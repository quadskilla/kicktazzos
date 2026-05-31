"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "out");
const youtuberVideo = path.join(OUT_DIR, "Youtuber_playing_tazzo_strike_202605280259.mp4");
const gamePromoVideo = path.join(OUT_DIR, "tazzo-strike-collection-clash-ad.mp4");
const musicTrack = path.resolve(ROOT_DIR, "..", "musics", "Bola na Rede.mp3");
const output = path.join(OUT_DIR, "tazzo-strike-youtuber-collection-clash-promo.mp4");
const fontPath = "/Windows/Fonts/arialbd.ttf";

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Arquivo nao encontrado: ${filePath}`);
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg.path, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (/frame=|Duration|Input #|Output #|Stream #/.test(text)) process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg saiu com codigo ${code}`));
    });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  ensureFile(youtuberVideo);
  ensureFile(gamePromoVideo);
  ensureFile(musicTrack);

  const adDuration = 15;
  const youtuberDuration = 8;
  const totalDuration = youtuberDuration + adDuration;

  const filter = [
    `[0:v]trim=0:${youtuberDuration},setpts=PTS-STARTPTS,fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p,` +
      `drawbox=x=0:y=0:w=iw:h=196:color=black@0.44:t=fill,` +
      `drawtext=fontfile=${fontPath}:text='COLECAO HOLOGRAFICA':x=(w-text_w)/2:y=55:fontsize=55:fontcolor=white:shadowcolor=black@0.75:shadowx=3:shadowy=3,` +
      `drawtext=fontfile=${fontPath}:text='E BATER TAZZOS':x=(w-text_w)/2:y=121:fontsize=42:fontcolor=0xf8e15f:shadowcolor=black@0.75:shadowx=3:shadowy=3,` +
      `drawbox=x=78:y=1698:w=924:h=118:color=black@0.5:t=fill,` +
      `drawtext=fontfile=${fontPath}:text='O album brilha e a mesa decide a disputa':x=(w-text_w)/2:y=1736:fontsize=36:fontcolor=white:shadowcolor=black@0.7:shadowx=2:shadowy=2,fade=t=out:st=7.72:d=0.28,settb=AVTB[ytv]`,
    `[1:v]trim=0:${adDuration},setpts=PTS-STARTPTS,fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.24,settb=AVTB[adv]`,
    `[ytv][adv]concat=n=2:v=1:a=0,format=yuv420p[v]`,
    `[0:a]atrim=0:${youtuberDuration},asetpts=PTS-STARTPTS,volume=1.0,afade=t=in:st=0:d=0.18,afade=t=out:st=7.72:d=0.28[yta]`,
    `[2:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS,volume=0.28,afade=t=in:st=0:d=0.35,afade=t=out:st=22.1:d=0.9[mus]`,
    `[yta][mus]amix=inputs=2:duration=longest:dropout_transition=0,atrim=0:${totalDuration},loudnorm=I=-14:TP=-1.5:LRA=11[a]`
  ].join(";");

  await runFfmpeg([
    "-y",
    "-i", youtuberVideo,
    "-i", gamePromoVideo,
    "-stream_loop", "-1",
    "-i", musicTrack,
    "-filter_complex", filter,
    "-map", "[v]",
    "-map", "[a]",
    "-t", String(totalDuration),
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "19",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    output
  ]);

  const stats = fs.statSync(output);
  console.log(`video ${path.relative(ROOT_DIR, output)} ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
