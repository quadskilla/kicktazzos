import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve("assets", "sfx");

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seedText) {
  let seed = hashString(seedText) || 1;
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
}

function waveValue(type, phase) {
  const p = phase % 1;
  if (type === "square") return p < 0.5 ? 1 : -1;
  if (type === "saw") return 2 * p - 1;
  if (type === "triangle") return 1 - 4 * Math.abs(Math.round(p - 0.25) - (p - 0.25));
  return Math.sin(Math.PI * 2 * p);
}

function envelope(t, duration, attack = 0.005, release = 0.04, decay = 1.35) {
  const a = attack > 0 ? clamp(t / attack, 0, 1) : 1;
  const r = release > 0 ? clamp((duration - t) / release, 0, 1) : 1;
  const d = Math.pow(clamp(1 - t / Math.max(duration, 0.001), 0, 1), decay);
  return Math.min(a, r) * d;
}

function addTone(buffer, options) {
  const {
    start = 0,
    duration = 0.15,
    freq = 440,
    endFreq = freq,
    gain = 0.35,
    wave = "sine",
    attack = 0.005,
    release = 0.04,
    decay = 1.25,
    vibrato = 0,
    vibratoRate = 7
  } = options;
  const startIndex = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endIndex = Math.min(buffer.length, Math.floor((start + duration) * SAMPLE_RATE));
  let phase = 0;
  for (let i = startIndex; i < endIndex; i += 1) {
    const t = (i - startIndex) / SAMPLE_RATE;
    const p = duration > 0 ? t / duration : 1;
    const eased = p * p * (3 - 2 * p);
    const currentFreq = freq + (endFreq - freq) * eased + Math.sin(t * Math.PI * 2 * vibratoRate) * vibrato;
    phase += currentFreq / SAMPLE_RATE;
    buffer[i] += waveValue(wave, phase) * gain * envelope(t, duration, attack, release, decay);
  }
}

function addNoise(buffer, options, rng) {
  const {
    start = 0,
    duration = 0.12,
    gain = 0.22,
    attack = 0.001,
    release = 0.05,
    decay = 1.8,
    filter = "none",
    cutoff = 0.24
  } = options;
  const startIndex = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endIndex = Math.min(buffer.length, Math.floor((start + duration) * SAMPLE_RATE));
  let low = 0;
  for (let i = startIndex; i < endIndex; i += 1) {
    const t = (i - startIndex) / SAMPLE_RATE;
    const raw = rng() * 2 - 1;
    low += (raw - low) * cutoff;
    const shaped = filter === "low" ? low : filter === "high" ? raw - low : raw;
    buffer[i] += shaped * gain * envelope(t, duration, attack, release, decay);
  }
}

function addChirp(buffer, options) {
  const {
    start = 0,
    duration = 0.12,
    freq = 650,
    steps = 4,
    gain = 0.24,
    direction = 1,
    wave = "triangle"
  } = options;
  for (let index = 0; index < steps; index += 1) {
    const ratio = index / Math.max(1, steps - 1);
    addTone(buffer, {
      start: start + (duration / steps) * index,
      duration: duration / steps,
      freq: freq * Math.pow(1.15, ratio * direction * steps),
      endFreq: freq * Math.pow(1.15, (ratio + 0.2) * direction * steps),
      gain: gain * (1 - ratio * 0.28),
      wave,
      attack: 0.002,
      release: 0.025,
      decay: 0.85
    });
  }
}

function addLayer(buffer, layer, rng) {
  if (layer.type === "noise") addNoise(buffer, layer, rng);
  else if (layer.type === "chirp") addChirp(buffer, layer);
  else addTone(buffer, layer);
}

function writeWav(samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  }
  return buffer;
}

function renderSound(sound) {
  const duration = Math.max(sound.duration, ...sound.layers.map((layer) => (layer.start || 0) + (layer.duration || 0))) + 0.02;
  const samples = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  const rng = createRng(sound.name);
  sound.layers.forEach((layer) => addLayer(samples, layer, rng));
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const trim = peak > 0.96 ? 0.96 / peak : 1;
  const master = sound.master ?? 0.86;
  for (let i = 0; i < samples.length; i += 1) samples[i] *= trim * master;
  return writeWav(samples);
}

const tone = (freq, endFreq, duration, gain = 0.25, start = 0, wave = "sine") => ({ type: "tone", freq, endFreq, duration, gain, start, wave });
const noise = (duration, gain = 0.2, start = 0, filter = "none", cutoff = 0.22) => ({ type: "noise", duration, gain, start, filter, cutoff });
const chirp = (freq, duration, gain = 0.22, start = 0, direction = 1, steps = 4) => ({ type: "chirp", freq, duration, gain, start, direction, steps });

const sounds = [
  ["ui-click", "Clique seco de botao", 0.10, [tone(980, 720, 0.07, 0.18, 0, "triangle"), noise(0.035, 0.08, 0, "high", 0.14)]],
  ["ui-back", "Voltar ou fechar painel", 0.12, [tone(420, 220, 0.10, 0.18, 0, "triangle"), noise(0.05, 0.05, 0, "low", 0.12)]],
  ["ui-confirm", "Confirmacao positiva", 0.20, [chirp(520, 0.16, 0.18, 0, 1, 3), tone(1040, 1180, 0.12, 0.08, 0.08, "sine")]],
  ["ui-error", "Erro curto", 0.20, [tone(220, 150, 0.18, 0.22, 0, "square"), noise(0.10, 0.06, 0.02, "low", 0.18)]],
  ["ui-disabled", "Botao indisponivel", 0.12, [tone(180, 160, 0.10, 0.12, 0, "triangle")]],
  ["tab-switch", "Troca de aba", 0.18, [tone(530, 760, 0.13, 0.16, 0, "triangle"), noise(0.09, 0.07, 0, "high", 0.1)]],
  ["modal-open", "Abrir janela", 0.24, [tone(330, 520, 0.20, 0.16, 0, "sine"), chirp(680, 0.12, 0.12, 0.08, 1, 4)]],
  ["modal-close", "Fechar janela", 0.16, [tone(480, 260, 0.13, 0.14, 0, "triangle"), noise(0.07, 0.06, 0.03, "high", 0.16)]],
  ["wallet-pop", "Popover da carteira", 0.16, [tone(740, 860, 0.09, 0.14, 0, "triangle"), tone(1180, 1220, 0.08, 0.08, 0.06, "sine")]],

  ["pack-buy", "Comprar pacotinho", 0.30, [noise(0.22, 0.18, 0, "high", 0.12), tone(160, 105, 0.24, 0.17, 0, "sine"), chirp(470, 0.10, 0.08, 0.18, 1, 3)]],
  ["pack-rustle", "Pacote balancando", 0.42, [noise(0.16, 0.17, 0, "high", 0.08), noise(0.14, 0.15, 0.13, "high", 0.1), noise(0.12, 0.12, 0.26, "high", 0.14)]],
  ["pack-tear", "Rasgar salgadinho", 0.44, [noise(0.42, 0.34, 0, "high", 0.18), tone(190, 110, 0.22, 0.08, 0.04, "saw")]],
  ["pack-open", "Pacotinho abrindo", 0.52, [noise(0.20, 0.22, 0, "high", 0.12), chirp(360, 0.22, 0.17, 0.14, 1, 5), tone(120, 86, 0.32, 0.18, 0.05, "sine")]],
  ["snack-burst", "Salgadinho explodindo", 0.46, [noise(0.24, 0.30, 0, "high", 0.18), noise(0.30, 0.16, 0.08, "low", 0.12), chirp(520, 0.18, 0.10, 0.12, 1, 6)]],
  ["card-flip", "Tazzo virando", 0.25, [noise(0.16, 0.16, 0, "high", 0.08), tone(620, 360, 0.18, 0.12, 0.03, "triangle")]],
  ["card-zoom", "Zoom no tazzo", 0.22, [tone(310, 620, 0.17, 0.14, 0, "sine"), chirp(720, 0.11, 0.08, 0.08, 1, 4)]],
  ["reveal-common", "Revelacao comum", 0.28, [tone(440, 610, 0.14, 0.12, 0, "triangle"), noise(0.10, 0.05, 0.02, "high", 0.12)]],
  ["reveal-uncommon", "Revelacao incomum", 0.34, [chirp(520, 0.18, 0.14, 0, 1, 4), tone(920, 960, 0.13, 0.08, 0.16, "sine")]],
  ["reveal-rare", "Revelacao rara", 0.46, [chirp(620, 0.22, 0.17, 0, 1, 5), tone(880, 1220, 0.24, 0.10, 0.16, "sine"), noise(0.16, 0.06, 0.08, "high", 0.08)]],
  ["reveal-epic", "Revelacao epica", 0.64, [tone(220, 190, 0.34, 0.12, 0, "sine"), chirp(720, 0.30, 0.19, 0.08, 1, 6), tone(1260, 1580, 0.28, 0.11, 0.28, "sine")]],
  ["reveal-legendary", "Revelacao lendaria", 0.86, [tone(160, 130, 0.54, 0.13, 0, "sine"), chirp(520, 0.38, 0.18, 0.09, 1, 7), chirp(980, 0.38, 0.12, 0.32, 1, 6), noise(0.22, 0.06, 0.18, "high", 0.08)]],
  ["reveal-mystic", "Revelacao mistica", 1.05, [tone(90, 70, 0.72, 0.13, 0, "sine"), tone(660, 880, 0.62, 0.10, 0.08, "sine"), chirp(980, 0.48, 0.15, 0.42, 1, 9), noise(0.35, 0.08, 0.24, "high", 0.06)]],
  ["fragment-pop", "Fragmentos ganhos", 0.30, [chirp(760, 0.18, 0.16, 0, 1, 5), chirp(920, 0.14, 0.10, 0.12, 1, 4)]],

  ["battle-start", "Inicio de batalha", 0.62, [tone(116, 96, 0.42, 0.18, 0, "sine"), chirp(330, 0.30, 0.16, 0.12, 1, 5), noise(0.22, 0.12, 0.05, "low", 0.16)]],
  ["turn-start", "Inicio do turno", 0.20, [tone(520, 700, 0.13, 0.13, 0, "triangle"), tone(1040, 1080, 0.08, 0.07, 0.08, "sine")]],
  ["action-select", "Selecionar acao", 0.14, [tone(720, 880, 0.09, 0.14, 0, "triangle"), noise(0.035, 0.05, 0, "high", 0.12)]],
  ["target-select", "Selecionar alvo", 0.15, [tone(660, 540, 0.10, 0.13, 0, "triangle"), noise(0.05, 0.05, 0.02, "high", 0.11)]],
  ["move-slide", "Mover tazzo no campo", 0.28, [noise(0.19, 0.13, 0, "low", 0.18), tone(230, 260, 0.18, 0.08, 0.05, "triangle")]],
  ["retreat-slide", "Recuar tazzo", 0.26, [noise(0.18, 0.11, 0, "low", 0.18), tone(320, 210, 0.17, 0.09, 0.04, "triangle")]],
  ["swap", "Trocar posicao", 0.33, [tone(430, 720, 0.15, 0.12, 0, "triangle"), tone(720, 430, 0.16, 0.12, 0.12, "triangle"), noise(0.10, 0.07, 0.08, "high", 0.1)]],
  ["dribble-hit", "Drible batendo", 0.30, [tone(140, 85, 0.20, 0.22, 0, "sine"), noise(0.14, 0.18, 0, "high", 0.2), tone(620, 360, 0.12, 0.07, 0.03, "triangle")]],
  ["shot-kick", "Chute forte", 0.40, [tone(95, 55, 0.28, 0.26, 0, "sine"), noise(0.11, 0.22, 0.01, "low", 0.16), noise(0.20, 0.12, 0.10, "high", 0.12)]],
  ["pressure-push", "Empurrao de pressao", 0.34, [tone(130, 90, 0.22, 0.18, 0, "sine"), noise(0.19, 0.16, 0.02, "low", 0.18)]],
  ["collision", "Colisao entre tazzos", 0.38, [tone(84, 48, 0.24, 0.28, 0, "sine"), noise(0.17, 0.24, 0, "high", 0.22), noise(0.23, 0.12, 0.08, "low", 0.14)]],
  ["wall-bump", "Bateu na borda", 0.34, [tone(72, 52, 0.22, 0.24, 0, "square"), noise(0.14, 0.14, 0.02, "low", 0.16)]],
  ["ko", "Tazzo saiu da arena", 0.58, [tone(360, 120, 0.34, 0.16, 0, "triangle"), noise(0.24, 0.14, 0.1, "high", 0.12), tone(90, 65, 0.30, 0.13, 0.22, "sine")]],
  ["pass-turn", "Passar turno", 0.18, [tone(390, 300, 0.13, 0.12, 0, "triangle"), noise(0.07, 0.05, 0.03, "high", 0.15)]],
  ["keeper-charge", "Goleiro carregando habilidade", 0.48, [tone(180, 260, 0.38, 0.12, 0, "sine"), chirp(420, 0.24, 0.13, 0.20, 1, 5)]],
  ["keeper-activate", "Goleiro ativado", 0.62, [tone(110, 90, 0.36, 0.18, 0, "sine"), chirp(520, 0.30, 0.18, 0.10, 1, 6), noise(0.20, 0.09, 0.18, "high", 0.08)]],
  ["battle-win", "Vitoria", 0.96, [chirp(392, 0.28, 0.16, 0, 1, 4), chirp(523, 0.28, 0.16, 0.22, 1, 4), tone(784, 1046, 0.38, 0.16, 0.48, "sine")]],
  ["battle-lose", "Derrota", 0.78, [tone(330, 220, 0.32, 0.15, 0, "triangle"), tone(220, 147, 0.44, 0.15, 0.24, "sine"), noise(0.22, 0.08, 0.18, "low", 0.12)]],
  ["battle-draw", "Empate", 0.54, [tone(320, 320, 0.18, 0.12, 0, "triangle"), tone(360, 360, 0.18, 0.12, 0.18, "triangle"), tone(300, 280, 0.18, 0.10, 0.36, "triangle")]],
  ["timer-warning", "Tempo acabando", 0.18, [tone(980, 980, 0.11, 0.16, 0, "square")]],

  ["tazzo-clash-invite", "Convite para bater tazzo", 0.35, [chirp(460, 0.18, 0.16, 0, 1, 4), noise(0.12, 0.10, 0.16, "high", 0.12)]],
  ["tazzo-clash-accept", "Duelo aceito", 0.40, [chirp(520, 0.22, 0.16, 0, 1, 5), tone(960, 1080, 0.18, 0.10, 0.2, "sine")]],
  ["tazzo-clash-coin", "Cara ou coroa", 0.52, [chirp(740, 0.36, 0.14, 0, 1, 8), noise(0.12, 0.06, 0.3, "high", 0.08)]],
  ["tazzo-clash-hit", "Batida de tazzo", 0.46, [tone(82, 48, 0.22, 0.30, 0, "sine"), noise(0.12, 0.32, 0, "high", 0.2), noise(0.26, 0.16, 0.09, "low", 0.1)]],
  ["tazzo-clash-perfect", "Batida perfeita", 0.62, [tone(84, 48, 0.22, 0.28, 0, "sine"), noise(0.10, 0.28, 0, "high", 0.18), chirp(680, 0.32, 0.18, 0.16, 1, 7)]],
  ["tazzo-clash-flip", "Tazzo virou na batida", 0.44, [noise(0.16, 0.14, 0, "high", 0.08), tone(520, 720, 0.25, 0.13, 0.06, "triangle"), chirp(890, 0.12, 0.09, 0.24, 1, 4)]],
  ["tazzo-clash-miss", "Nenhum tazzo virou", 0.34, [tone(240, 180, 0.22, 0.13, 0, "triangle"), noise(0.12, 0.08, 0.04, "low", 0.16)]],
  ["tazzo-clash-win", "Venceu batida de tazzo", 0.72, [chirp(440, 0.28, 0.16, 0, 1, 5), chirp(660, 0.30, 0.15, 0.22, 1, 6)]],
  ["tazzo-clash-lose", "Perdeu batida de tazzo", 0.62, [tone(320, 190, 0.28, 0.14, 0, "triangle"), tone(190, 140, 0.28, 0.12, 0.24, "sine")]],

  ["coins", "Merreis ganhos", 0.44, [chirp(820, 0.16, 0.14, 0, 1, 4), chirp(980, 0.16, 0.12, 0.10, 1, 4), chirp(1220, 0.18, 0.10, 0.23, 1, 4)]],
  ["purchase", "Compra concluida", 0.40, [tone(390, 520, 0.16, 0.15, 0, "triangle"), chirp(780, 0.18, 0.12, 0.18, 1, 4)]],
  ["upgrade", "Melhoria de tazzo", 0.58, [tone(240, 280, 0.35, 0.12, 0, "sine"), chirp(700, 0.28, 0.17, 0.14, 1, 7), noise(0.18, 0.07, 0.18, "high", 0.1)]],
  ["favorite-on", "Favoritar", 0.34, [tone(600, 760, 0.16, 0.13, 0, "sine"), tone(900, 1120, 0.18, 0.12, 0.14, "sine")]],
  ["favorite-off", "Remover favorito", 0.24, [tone(760, 480, 0.18, 0.12, 0, "triangle")]],
  ["team-slot", "Colocar no time", 0.34, [tone(350, 470, 0.18, 0.14, 0, "triangle"), noise(0.11, 0.07, 0.10, "high", 0.1)]],
  ["goalkeeper-set", "Goleiro escolhido", 0.46, [tone(180, 230, 0.28, 0.13, 0, "sine"), chirp(560, 0.22, 0.13, 0.18, 1, 5)]],
  ["mission-claim", "Missao resgatada", 0.52, [chirp(520, 0.22, 0.14, 0, 1, 5), tone(1040, 1180, 0.26, 0.10, 0.22, "sine"), noise(0.15, 0.06, 0.18, "high", 0.08)]],
  ["reward-shake", "Caixa de presente tremendo", 0.62, [noise(0.11, 0.12, 0, "low", 0.16), noise(0.11, 0.12, 0.16, "low", 0.16), noise(0.11, 0.12, 0.32, "low", 0.16), tone(260, 220, 0.50, 0.06, 0, "triangle")]],
  ["reward-open", "Presente abrindo", 0.70, [noise(0.16, 0.18, 0, "high", 0.12), chirp(520, 0.30, 0.18, 0.12, 1, 6), chirp(900, 0.30, 0.12, 0.34, 1, 6)]],

  ["friend-invite", "Convite de amigo", 0.32, [chirp(500, 0.18, 0.14, 0, 1, 4), tone(760, 820, 0.12, 0.10, 0.17, "sine")]],
  ["friend-message", "Mensagem recebida", 0.22, [tone(560, 560, 0.09, 0.11, 0, "triangle"), tone(740, 740, 0.10, 0.10, 0.09, "triangle")]],
  ["trade-offer", "Proposta de troca", 0.40, [tone(380, 520, 0.18, 0.13, 0, "triangle"), tone(520, 380, 0.18, 0.13, 0.16, "triangle"), noise(0.12, 0.06, 0.12, "high", 0.11)]],
  ["trade-accept", "Troca aceita", 0.54, [chirp(520, 0.22, 0.16, 0, 1, 5), chirp(740, 0.22, 0.13, 0.20, 1, 5)]],
  ["trade-decline", "Troca recusada", 0.28, [tone(300, 210, 0.22, 0.13, 0, "triangle")]],
  ["online-lobby", "Sala online", 0.36, [tone(450, 600, 0.18, 0.12, 0, "sine"), noise(0.14, 0.07, 0.12, "high", 0.08)]],
  ["matchmaking", "Busca de partida", 0.42, [tone(440, 520, 0.12, 0.09, 0, "triangle"), tone(520, 640, 0.12, 0.09, 0.14, "triangle"), tone(640, 740, 0.12, 0.09, 0.28, "triangle")]],
  ["notification", "Aviso social", 0.34, [tone(760, 760, 0.08, 0.11, 0, "sine"), tone(1020, 1020, 0.12, 0.10, 0.09, "sine"), tone(820, 820, 0.09, 0.08, 0.22, "sine")]]
].map(([name, description, duration, layers]) => ({ name, description, duration, layers }));

await mkdir(OUT_DIR, { recursive: true });
const manifest = [];
for (const sound of sounds) {
  const file = `${sound.name}.wav`;
  await writeFile(path.join(OUT_DIR, file), renderSound(sound));
  manifest.push({ id: sound.name, file, description: sound.description });
}
await writeFile(path.join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} SFX in ${OUT_DIR}`);
