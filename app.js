const {
  ASSETS,
  BACKS,
  DEFAULT_BACK_IMAGE,
  TYPES,
  RARITIES,
  MONSTERS,
  MONSTER_BY_ID,
  RANKS,
  TOURNAMENTS,
  SHOP_ITEMS,
  PACKS,
  MISSIONS,
  FRIENDS,
  BATTLE_MODES,
  BATTLE_FORMATIONS,
  BATTLE_OPPONENTS,
  TOURNAMENT_OPPONENTS,
  RANKED_OPPONENTS,
  TUTORIAL_STEPS
} = window.TAZZOMON_DATA;

const STORAGE_KEY = "tazzomon-save-v1";
const SERVER_PROFILE_ENDPOINT = "/api/profile";
const SERVER_FIREBASE_CONFIG_ENDPOINT = "/api/firebase/config";
const SERVER_FIREBASE_PROFILE_ENDPOINT = "/api/profile/firebase";
const SERVER_LEADERBOARD_ENDPOINT = "/api/leaderboard";
const SERVER_LOBBIES_ENDPOINT = "/api/lobbies";
const SERVER_SAVE_ENDPOINT = "/api/save";
const SERVER_MIGRATE_SAVE_ENDPOINT = "/api/save/migrate";
const SERVER_OPEN_PACK_ENDPOINT = "/api/open-pack";
const SERVER_SHOP_ENDPOINT = "/api/shop";
const SERVER_UPGRADE_ENDPOINT = "/api/upgrade";
const SERVER_CLAIM_MISSION_ENDPOINT = "/api/claim-mission";
const SERVER_TRADE_ENDPOINT = "/api/trade";
const SERVER_FRIEND_GIFT_ENDPOINT = "/api/friend-gift";
const SERVER_RANKED_START_ENDPOINT = "/api/ranked/start";
const SERVER_TOURNAMENT_START_ENDPOINT = "/api/tournament/start";
const SERVER_COMPETITIVE_RESOLVE_ENDPOINT = "/api/competitive/resolve";
const SERVER_SAVE_DEBOUNCE_MS = 450;
const ONLINE_WS_RECONNECT_MS = 2200;
const ENTRY_GATE_SESSION_KEY = "kick-tazzos-entry-gate-v1";
const TODAY_KEY = new Date().toISOString().slice(0, 10);
const PACK_OPENING_DURATION_MS = 1500;
const PACK_CLOSE_AFTER_REVEAL_MS = 900;
const LEGENDARY_BOOST_TAZZOS = 50;
const LEGENDARY_BOOST_MAX_TAZZOS = 100;
const LEGENDARY_BOOST_MULTIPLIER = 2;
const LEGENDARY_BOOST_MAX_MULTIPLIER = 4;
const AI_ACTION_WINDUP_MS = 760;
const AI_ACTION_RESULT_MS = 820;
const ONLINE_TARGET_ACTIONS = ["move", "retreat", "swap", "dribble", "shot", "pressure"];
const ONLINE_INSTANT_ACTIONS = ["pass", "keeper"];
const KEEPER_ABILITY_LABELS = {
  extraTurn: "Ganha um turno extra",
  fullShot: "Proximo chute causa dano cheio",
  teamHeal: "Recuperar Vitalidade",
  freeSwap: "Proxima troca em qualquer casa",
  substitution: "Duas estrelas: Substituicao",
  investidaTotal: "Investida total - 2 chutes cheios"
};
const MUSIC_TRACKS = [
  { file: "Bate no Tambor.mp3", name: "Bate no Tambor" },
  { file: "Bola na Rede.mp3", name: "Bola na Rede" },
  { file: "Bola no Gramado.mp3", name: "Bola no Gramado" },
  { file: "Carnaval no Maracanã.mp3", name: "Carnaval no Maracanã" },
  { file: "Copa Suave.mp3", name: "Copa Suave" },
  { file: "Copo FIFA.mp3", name: "Copo FIFA" },
  { file: "Maracanã Pulse.mp3", name: "Maracanã Pulse" },
  { file: "Moonlit Alley.mp3", name: "Moonlit Alley" }
];

function normalizeLobbyCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-F0-9]/g, "")
    .slice(0, 6);
}

function isValidLobbyCode(value) {
  return /^[A-F0-9]{6}$/.test(String(value || "").trim().toUpperCase());
}

function initialLobbyInviteCode() {
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeLobbyCode(params.get("lobby") || params.get("sala") || "");
  } catch (error) {
    return "";
  }
}

const startupLocalSave = loadSave();

const state = {
  save: startupLocalSave,
  currentTab: "battle",
  selectedSlot: 0,
  collectionFilters: { type: "all", rarity: "all", owned: "all" },
  selectedTrade: { offer: "", wish: "" },
  battleSetup: {
    mode: "casual",
    opponent: "random",
    formation: "center",
    positions: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
    placementSlot: 0
  },
  pendingTournament: null,
  pendingRanked: null,
  packOpening: null,
  packPurchasePending: false,
  packOpeningTimers: [],
  packReveal: [],
  tutorialResult: null,
  tradeLog: [],
  competitiveLog: [],
  leaderboard: { rows: [], loading: false, loadedAt: 0, error: "" },
  online: {
    lobbies: [],
    currentLobby: null,
    loading: false,
    loadedAt: 0,
    error: "",
    message: "",
    joinCode: "",
    inviteMessage: "",
    inviteMessageType: "info",
    pendingInviteCode: initialLobbyInviteCode(),
    inviteHandled: false,
    socket: null,
    socketStatus: "offline",
    reconnectTimer: null
  },
  editSelectedId: "",
  editMessage: "",
  shopMessage: "Itens sem vantagem direta",
  battle: null,
  battleSceneOpen: false,
  music: { audio: null, isPlaying: false },
  server: {
    enabled: false,
    loading: false,
    playerId: "",
    profile: null,
    profileMode: "login",
    profileMessage: "",
    profileMessageType: "info",
    saveTimer: null,
    startupSave: cloneSave(startupLocalSave),
    localChangedWhileLoading: false,
    entryGateDismissed: initialEntryGateDismissed(),
    entryGatePaused: false,
    status: "local",
    message: "Local"
  },
  firebase: {
    checked: false,
    enabled: false,
    loading: false,
    config: null,
    providers: [],
    sdkVersion: "12.13.0",
    modules: null,
    auth: null,
    currentUser: null,
    message: ""
  },
  timerInterval: null,
  matchTimerInterval: null
};

function defaultSave() {
  const collection = {};
  ["artilheiro-brasil", "goleiro-brasil-alison", "andreas-pereira-tazzo", "alex-sandro-tazzo", "wendell-tazzo"].forEach((id) => {
    collection[id] = 1;
  });

  return {
    createdAt: Date.now(),
    merreis: 1250,
    fragments: 0,
    collection,
    team: ["andreas-pereira-tazzo", "alex-sandro-tazzo", "wendell-tazzo"],
    goalkeeper: "goleiro-brasil-alison",
    customTazzos: [],
    upgrades: {},
    packPity: { sinceLegendaryPlus: 0 },
    trophies: 0,
    rankedWins: 0,
    rankedLosses: 0,
    tournamentWins: 0,
    onlineTrophies: 0,
    onlineWins: 0,
    onlineLosses: 0,
    onlineDraws: 0,
    activeCompetitive: null,
    cosmetics: {},
    selectedCosmetic: null,
    friendGifts: {},
    musicTrackIndex: 0,
    musicVolume: 0.55,
    tutorial: Object.fromEntries(TUTORIAL_STEPS.map((step) => [step.id, false])),
    tutorialRewardClaimed: false,
    missionDate: TODAY_KEY,
    missions: Object.fromEntries(MISSIONS.map((mission) => [
      mission.id,
      { progress: mission.id === "login" ? 1 : 0, claimed: false }
    ]))
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeSave(raw ? JSON.parse(raw) : defaultSave());
  } catch (error) {
    return defaultSave();
  }
}

function initialEntryGateDismissed() {
  try {
    return sessionStorage.getItem(ENTRY_GATE_SESSION_KEY) === "guest";
  } catch (error) {
    return false;
  }
}

function setEntryGateDismissed(value) {
  state.server.entryGateDismissed = Boolean(value);
  try {
    if (value) {
      sessionStorage.setItem(ENTRY_GATE_SESSION_KEY, "guest");
    } else {
      sessionStorage.removeItem(ENTRY_GATE_SESSION_KEY);
    }
  } catch (error) {}
  renderEntryGate();
}

function cloneSave(save) {
  try {
    return JSON.parse(JSON.stringify(save || defaultSave()));
  } catch (error) {
    return defaultSave();
  }
}

function normalizeSave(rawSave) {
  try {
    const save = migrateLegacySave(rawSave || defaultSave());
    const customTazzos = sanitizeCustomCatalog(save.customTazzos || []);
    applyCustomCatalog(customTazzos);
    const fresh = defaultSave();
    const missions = Object.fromEntries(MISSIONS.map((mission) => [
      mission.id,
      { ...fresh.missions[mission.id], ...((save.missions || {})[mission.id] || {}) }
    ]));
    const tutorial = Object.fromEntries(TUTORIAL_STEPS.map((step) => [
      step.id,
      Boolean((save.tutorial || fresh.tutorial)[step.id])
    ]));
    const merged = {
      ...fresh,
      ...save,
      collection: sanitizeCollection({ ...fresh.collection, ...(save.collection || {}) }),
      upgrades: { ...fresh.upgrades, ...(save.upgrades || {}) },
      packPity: sanitizePackPity(save.packPity || fresh.packPity),
      cosmetics: { ...fresh.cosmetics, ...(save.cosmetics || {}) },
      friendGifts: { ...fresh.friendGifts, ...(save.friendGifts || {}) },
      customTazzos,
      tutorial,
      missions,
      team: normalizeTeam(save.team || fresh.team),
      goalkeeper: normalizeGoalkeeper(save.goalkeeper || (save.team || []).find((id) => isGoalkeeper(id)) || fresh.goalkeeper)
    };
    merged.musicTrackIndex = clamp(Math.floor(Number(merged.musicTrackIndex)) || 0, 0, Math.max(0, MUSIC_TRACKS.length - 1));
    merged.musicVolume = clamp(Number(merged.musicVolume), 0, 1);
    if (!Number.isFinite(merged.musicVolume)) merged.musicVolume = fresh.musicVolume;

    if (merged.missionDate !== TODAY_KEY) {
      merged.missionDate = TODAY_KEY;
      merged.missions = resetDailyMissions(merged.missions, fresh.missions);
    }

    return merged;
  } catch (error) {
    return defaultSave();
  }
}

function saveProgressScore(save = {}) {
  const normalized = normalizeSave(save);
  const owned = Object.values(normalized.collection || {}).filter((count) => Number(count) > 0).length;
  const copies = Object.values(normalized.collection || {}).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0);
  const cosmetics = Object.values(normalized.cosmetics || {}).filter(Boolean).length;
  const tutorial = Object.values(normalized.tutorial || {}).filter(Boolean).length;
  return owned * 1000
    + copies * 35
    + Math.floor((Number(normalized.merreis) || 0) / 25)
    + Math.floor((Number(normalized.fragments) || 0) / 2)
    + (Number(normalized.trophies) || 0)
    + (Number(normalized.onlineTrophies) || 0)
    + (Number(normalized.rankedWins) || 0) * 120
    + (Number(normalized.tournamentWins) || 0) * 180
    + (Number(normalized.onlineWins) || 0) * 160
    + cosmetics * 250
    + tutorial * 80;
}

function shouldMigrateLocalSaveToServer(localSave, serverSave) {
  if (!localSave || !serverSave) return false;
  return saveProgressScore(localSave) > saveProgressScore(serverSave) + 120;
}

function resetDailyMissions(currentMissions, freshMissions) {
  return Object.fromEntries(MISSIONS.map((mission) => {
    if (mission.scope === "album") {
      return [
        mission.id,
        {
          ...freshMissions[mission.id],
          claimed: Boolean(currentMissions?.[mission.id]?.claimed)
        }
      ];
    }
    return [mission.id, freshMissions[mission.id]];
  }));
}

function migrateLegacySave(save = {}) {
  const next = { ...save, collection: { ...(save.collection || {}) } };
  const legacyMeiaCount = Math.max(0, Number(next.collection["meia-brasil"]) || 0);
  if (legacyMeiaCount > 0) {
    next.collection["goleiro-brasil-alison"] = Math.max(Number(next.collection["goleiro-brasil-alison"]) || 0, legacyMeiaCount);
    delete next.collection["meia-brasil"];
  }
  if (Array.isArray(next.team)) {
    next.team = next.team.filter((id) => id !== "meia-brasil");
  }
  if (!next.goalkeeper || (legacyMeiaCount > 0 && next.goalkeeper === "goleiro-portugal")) {
    next.goalkeeper = "goleiro-brasil-alison";
  }
  return next;
}

function normalizeTeam(team) {
  const available = Array.isArray(team) ? team.filter((id) => MONSTER_BY_ID[id] && !isGoalkeeper(id)) : [];
  const fallback = ["andreas-pereira-tazzo", "alex-sandro-tazzo", "wendell-tazzo"].filter((id) => MONSTER_BY_ID[id] && !isGoalkeeper(id));
  return [...available, ...fallback].filter(unique).slice(0, 3);
}

function normalizeGoalkeeper(id) {
  const goalkeepers = goalkeeperMonsters();
  if (id && MONSTER_BY_ID[id] && isGoalkeeper(id)) return id;
  return goalkeepers[0]?.id || "";
}

function sanitizeCollection(collection = {}) {
  return Object.fromEntries(
    Object.entries(collection)
      .filter(([id]) => MONSTER_BY_ID[id])
      .map(([id, count]) => [id, Math.max(0, Number(count) || 0)])
  );
}

function sanitizePackPity(packPity = {}) {
  const legacyEpicProgress = Number(packPity.sinceEpicPlus);
  const legendaryProgress = Number(packPity.sinceLegendaryPlus);
  return {
    sinceLegendaryPlus: clamp(Math.floor(Number.isFinite(legendaryProgress) ? legendaryProgress : legacyEpicProgress) || 0, 0, 999)
  };
}

function isGoalkeeper(monsterOrId) {
  const monster = typeof monsterOrId === "string" ? MONSTER_BY_ID[monsterOrId] : monsterOrId;
  return Boolean(monster?.keeperAbility || monster?.types?.includes("Goleiro"));
}

function fieldMonsters() {
  return MONSTERS.filter((monster) => !isGoalkeeper(monster));
}

function goalkeeperMonsters() {
  return MONSTERS.filter((monster) => isGoalkeeper(monster));
}

function normalizeRarity(rarity, fallback = "Comum") {
  if (rarity === "Mitico") return "Mistico";
  return RARITIES[rarity] ? rarity : fallback;
}

function isSecretRarity(rarity) {
  return Boolean(RARITIES[rarity]?.secret);
}

function isSecretMonster(monster) {
  return Boolean(monster && isSecretRarity(monster.rarity));
}

function visibleInCollection(monster) {
  return !isSecretMonster(monster) || (state.save.collection[monster.id] || 0) > 0;
}

function visibleCollectionMonsters() {
  return sortedMonsters(MONSTERS.filter(visibleInCollection));
}

function sortedMonsters(monsters) {
  return [...monsters].sort((a, b) => {
    const numberA = Number(a.number) || Number.MAX_SAFE_INTEGER;
    const numberB = Number(b.number) || Number.MAX_SAFE_INTEGER;
    if (numberA !== numberB) return numberA - numberB;
    const priorityA = a.id.endsWith("-tazzo") ? 0 : 1;
    const priorityB = b.id.endsWith("-tazzo") ? 0 : 1;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return MONSTERS.indexOf(a) - MONSTERS.indexOf(b);
  });
}

function unique(value, index, array) {
  return array.indexOf(value) === index;
}

function sanitizeCustomCatalog(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeCustomTazzo(item)).filter(Boolean);
}

function applyCustomCatalog(items = []) {
  sanitizeCustomCatalog(items).forEach((custom) => {
    const index = MONSTERS.findIndex((monster) => monster.id === custom.id);
    if (index >= 0) {
      MONSTERS[index] = custom;
    } else {
      MONSTERS.push(custom);
    }
    MONSTER_BY_ID[custom.id] = custom;
  });
}

function normalizeCustomTazzo(input = {}) {
  const rawName = cleanText(input.name, "Novo Tazzo", 48);
  const id = sanitizeId(input.id || rawName);
  if (!id) return null;

  const rawType = Array.isArray(input.types) ? input.types[0] : input.type;
  const explicitKeeper = input.isGoalkeeper === true || input.isGoalkeeper === "on" || input.isGoalkeeper === "true";
  const legacyKeeper = input.isGoalkeeper === undefined && (rawType === "Goleiro" || Boolean(input.keeperAbility));
  const keeper = explicitKeeper || legacyKeeper;
  const fieldType = TYPES[rawType] && rawType !== "Goleiro" ? rawType : "Atacante";
  const type = keeper ? "Goleiro" : fieldType;
  const rarity = normalizeRarity(input.rarity);
  const ability = KEEPER_ABILITY_LABELS[input.keeperAbility] ? input.keeperAbility : "extraTurn";

  return {
    id,
    number: Number(input.number) || nextCatalogNumber(),
    name: rawName,
    types: [type],
    rarity,
    vitality: keeper ? 0 : statValue(input.vitality, 90),
    shot: keeper ? 0 : statValue(input.shot, 70),
    dribble: keeper ? 0 : statValue(input.dribble, 70),
    speed: keeper ? 0 : statValue(input.speed, 70),
    role: keeper ? "Goleiro" : cleanText(input.role, type, 36),
    keeperAbility: keeper ? ability : null,
    image: String(input.image || ASSETS[0]),
    backImage: normalizeBackImage(input.backImage),
    cost: RARITIES[rarity].cost,
    custom: true
  };
}

function normalizeBackImage(image) {
  return BACKS.includes(image) ? image : DEFAULT_BACK_IMAGE;
}

function monsterBackImage(monster) {
  return normalizeBackImage(monster?.backImage);
}

function monsterHoloImage(monster) {
  return monster?.holoImage || "";
}

function hasHolographicArt(monster) {
  return Boolean(monsterHoloImage(monster));
}

function renderMonsterArt(monster, className, options = {}) {
  const loadingAttr = options.loading ? ` loading="${options.loading}"` : "";
  const revealHolographic = options.revealHolographic !== false;
  if (!revealHolographic || !hasHolographicArt(monster)) {
    return `<img class="${className}"${loadingAttr} src="${monster.image}" alt="${monster.name}">`;
  }

  return `
    <span class="holo-art ${className}" data-holo-art role="img" aria-label="${monster.name}">
      <img class="holo-art-layer holo-art-base"${loadingAttr} src="${monster.image}" alt="">
      <img class="holo-art-layer holo-art-alt"${loadingAttr} src="${monsterHoloImage(monster)}" alt="">
      <span class="holo-art-foil" aria-hidden="true"></span>
    </span>
  `;
}

function renderViewerFrontArt(monster, revealHolographic = true) {
  if (!revealHolographic || !hasHolographicArt(monster)) {
    return `<img class="viewer-face viewer-face-front" src="${monster.image}" alt="${monster.name}">`;
  }

  return `
    <div class="viewer-face viewer-face-front holo-art holo-art-viewer" data-holo-art role="img" aria-label="${monster.name}">
      <img class="holo-art-layer holo-art-base" src="${monster.image}" alt="">
      <img class="holo-art-layer holo-art-alt" src="${monsterHoloImage(monster)}" alt="">
      <span class="holo-art-foil" aria-hidden="true"></span>
    </div>
  `;
}

function statValue(value, fallback) {
  const number = Math.round(Number(value));
  return clamp(Number.isFinite(number) ? number : fallback, 1, 999);
}

function sanitizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function cleanText(value, fallback, maxLength) {
  const text = String(value || fallback || "")
    .replace(/[<>"&]/g, "")
    .trim()
    .slice(0, maxLength);
  return text || fallback;
}

function profileInitial(name = "") {
  const letter = String(name || "Visitante").trim().charAt(0) || "V";
  return letter.toLocaleUpperCase("pt-BR");
}

function profileAvatarUrl(profile) {
  const value = String(profile?.authPicture || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch (error) {
    return "";
  }
}

function renderProfileAvatar(element, profile) {
  if (!element) return;
  const avatarUrl = profileAvatarUrl(profile);
  element.textContent = profileInitial(profile?.name);
  element.classList.toggle("has-image", Boolean(avatarUrl));
  element.style.backgroundImage = avatarUrl ? `url("${avatarUrl.replace(/"/g, "%22")}")` : "";
}

function profileProviderText(profile) {
  if (!profile) return "Perfil";
  if (profile.authProvider === "firebase") return "Google";
  return "Nome/PIN";
}

function profileMetaText(profile) {
  if (!profile) return "Save anonimo sincronizado neste navegador.";
  if (profile.authProvider === "firebase") {
    return profile.authEmail
      ? `Conta Google conectada: ${profile.authEmail}`
      : "Conta Google conectada. Colecao, Merreis e partidas salvas no servidor.";
  }
  return "Colecao, Merreis e progresso salvos no servidor por nome/PIN.";
}

function nextCatalogNumber() {
  return MONSTERS.reduce((max, monster) => Math.max(max, Number(monster.number) || 0), 0) + 1;
}

function saveGame() {
  persistLocalSave();
  queueServerSave();
}

function persistLocalSave() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
  } catch (error) {
    setServerStatus("error", "Local cheio");
  }
}

function canUseServerSave() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function setupServerSave() {
  if (!canUseServerSave()) {
    setServerStatus("local", "Local");
    return;
  }
  state.server.loading = true;
  setServerStatus("connecting", "Conectando");
  loadServerSave();
}

async function loadServerSave() {
  try {
    const response = await fetch(SERVER_SAVE_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Servidor indisponivel");
    const payload = await response.json();
    state.server.enabled = true;
    state.server.loading = false;
    state.server.playerId = payload.playerId || "";
    applyProfile(payload.profile);
    connectOnlineSocket();
    refreshOnlineLobbies({ force: true });

    if (payload.save && !state.server.localChangedWhileLoading) {
      const serverSave = normalizeSave(payload.save);
      const localSave = normalizeSave(state.server.startupSave || state.save);
      if (!payload.profile && shouldMigrateLocalSaveToServer(localSave, serverSave)) {
        state.save = localSave;
        persistLocalSave();
        setServerStatus("syncing", "Migrando");
        if (await migrateServerSave(localSave)) return;
      }

      state.save = serverSave;
      persistLocalSave();
      setServerStatus("online", "Online");
      renderAll();
      return;
    }

    await pushServerSave();
  } catch (error) {
    state.server.enabled = false;
    state.server.loading = false;
    disconnectOnlineSocket();
    setServerStatus("error", "Local");
  }
}

async function migrateServerSave(save) {
  try {
    const response = await fetch(SERVER_MIGRATE_SAVE_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (payload.save) {
        state.save = normalizeSave(payload.save);
        persistLocalSave();
      }
      setServerStatus("online", "Salvo");
      renderAll();
      return true;
    }

    state.server.playerId = payload.playerId || state.server.playerId;
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    applyProfile(payload.profile);
    state.server.localChangedWhileLoading = false;
    setServerStatus("online", "Migrado");
    renderAll();
    return true;
  } catch (error) {
    return false;
  }
}

function queueServerSave() {
  if (state.server.loading) {
    state.server.localChangedWhileLoading = true;
    return;
  }
  if (!state.server.enabled) {
    updateServerStatus();
    return;
  }
  window.clearTimeout(state.server.saveTimer);
  setServerStatus("syncing", "Salvando");
  state.server.saveTimer = window.setTimeout(pushServerSave, SERVER_SAVE_DEBOUNCE_MS);
}

async function pushServerSave() {
  if (!state.server.enabled) return;
  window.clearTimeout(state.server.saveTimer);
  state.server.saveTimer = null;
  setServerStatus("syncing", "Salvando");
  try {
    const response = await fetch(SERVER_SAVE_ENDPOINT, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: state.save })
    });
    if (!response.ok) throw new Error("Falha ao salvar no servidor");
    const payload = await response.json();
    state.server.playerId = payload.playerId || state.server.playerId;
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    applyProfile(payload.profile);
    state.server.localChangedWhileLoading = false;
    setServerStatus("online", payload.ignoredProtectedFields?.length ? "Protegido" : "Salvo");
  } catch (error) {
    setServerStatus("error", "Local");
  }
}

async function postServerMutation(endpoint, body, statusLabel) {
  if (!state.server.enabled) return null;
  if (state.server.saveTimer) await pushServerSave();
  setServerStatus("syncing", statusLabel);

  let response;
  let payload = {};
  try {
    response = await fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    payload = await response.json().catch(() => ({}));
  } catch (error) {
    state.server.enabled = false;
    disconnectOnlineSocket();
    setServerStatus("error", "Local");
    throw error;
  }

  if (payload.save) {
    state.save = normalizeSave(payload.save);
    persistLocalSave();
  }
  if (!response.ok) {
    setServerStatus("online", "Salvo");
    throw new Error(payload.error || "Operacao recusada pelo servidor.");
  }

  state.server.playerId = payload.playerId || state.server.playerId;
  if ("profile" in payload) applyProfile(payload.profile);
  state.server.localChangedWhileLoading = false;
  setServerStatus("online", "Salvo");
  return payload;
}

function setServerStatus(status, message) {
  state.server.status = status;
  state.server.message = message;
  updateServerStatus();
}

function updateServerStatus() {
  const status = document.getElementById("server-status");
  if (!status) return;
  const pill = status.closest(".server-pill");
  status.textContent = state.server.message;
  if (pill) pill.dataset.serverState = state.server.status;
  renderEntryGate();
}

function onlineWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/lobbies`;
}

function connectOnlineSocket() {
  if (!state.server.enabled || !canUseServerSave() || !("WebSocket" in window)) return;
  const socket = state.online.socket;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  window.clearTimeout(state.online.reconnectTimer);
  state.online.reconnectTimer = null;
  state.online.socketStatus = "connecting";

  const nextSocket = new WebSocket(onlineWebSocketUrl());
  state.online.socket = nextSocket;

  nextSocket.addEventListener("open", () => {
    state.online.socketStatus = "online";
    state.online.error = "";
    nextSocket.send(JSON.stringify({ type: "hello" }));
    if (state.currentTab === "online") renderOnline();
  });

  nextSocket.addEventListener("message", (event) => {
    let payload = {};
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    if (payload.type === "online:error") {
      state.online.error = payload.error || "Acao online recusada.";
      if (state.battle?.online) {
        state.battle.online.pendingAction = false;
        state.battle.online.message = state.online.error;
        state.battle.status = state.online.error;
        renderBattle();
      }
      if (state.currentTab === "online") renderOnline();
      return;
    }
    if (payload.type !== "online:update") return;
    state.online.socketStatus = "online";
    applyOnlineLobbyPayload(payload);
    state.online.error = "";
    if (state.currentTab === "online") renderOnline();
  });

  nextSocket.addEventListener("close", () => {
    if (state.online.socket !== nextSocket) return;
    state.online.socket = null;
    state.online.socketStatus = "offline";
    if (state.currentTab === "online") renderOnline();
    scheduleOnlineSocketReconnect();
  });

  nextSocket.addEventListener("error", () => {
    state.online.error = "Tempo real reconectando.";
    nextSocket.close();
  });
}

function scheduleOnlineSocketReconnect() {
  if (!state.server.enabled || state.online.reconnectTimer) return;
  state.online.reconnectTimer = window.setTimeout(() => {
    state.online.reconnectTimer = null;
    connectOnlineSocket();
  }, ONLINE_WS_RECONNECT_MS);
}

function disconnectOnlineSocket() {
  window.clearTimeout(state.online.reconnectTimer);
  state.online.reconnectTimer = null;
  const socket = state.online.socket;
  state.online.socket = null;
  state.online.socketStatus = "offline";
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }
}

function reconnectOnlineSocket() {
  disconnectOnlineSocket();
  window.setTimeout(connectOnlineSocket, 80);
}

function applyProfile(profile) {
  state.server.profile = profile || null;
  if (profile) state.server.entryGatePaused = false;
  updateProfileStatus();
  renderEntryGate();
  const modal = document.getElementById("profile-modal");
  if (modal && !modal.hidden) renderProfileModal();
  refreshLeaderboard();
}

function updateProfileStatus() {
  const label = document.getElementById("profile-name-label");
  const provider = document.getElementById("profile-provider-label");
  const avatar = document.getElementById("profile-avatar");
  const button = document.getElementById("profile-button");
  if (!label || !button) return;
  label.textContent = state.server.profile?.name || "Visitante";
  if (provider) provider.textContent = profileProviderText(state.server.profile);
  renderProfileAvatar(avatar, state.server.profile);
  button.dataset.profileState = state.server.profile ? "logged" : "guest";
}

function setProfileMessage(message, type = "info") {
  state.server.profileMessage = message;
  state.server.profileMessageType = type;
  renderProfileModal();
}

async function refreshLeaderboard(options = {}) {
  if (!state.server.enabled || state.leaderboard.loading) return;
  const now = Date.now();
  if (!options.force && now - state.leaderboard.loadedAt < 15000) return;
  state.leaderboard.loading = true;
  state.leaderboard.error = "";
  try {
    const response = await fetch(`${SERVER_LEADERBOARD_ENDPOINT}?limit=20`, {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Ranking indisponivel");
    const payload = await response.json();
    state.leaderboard.rows = payload.rows || [];
    state.leaderboard.loadedAt = Date.now();
    if ("profile" in payload) applyProfile(payload.profile);
  } catch (error) {
    state.leaderboard.error = "Ranking online indisponivel.";
  } finally {
    state.leaderboard.loading = false;
    if (state.currentTab === "competitive") renderCompetitive();
  }
}

function applyOnlineLobbyPayload(payload = {}) {
  if (payload.save) {
    state.save = normalizeSave(payload.save);
    persistLocalSave();
    renderWallet();
    if (state.currentTab === "competitive") renderCompetitive();
  }
  state.online.lobbies = payload.lobbies || [];
  state.online.currentLobby = payload.currentLobby || null;
  state.online.loadedAt = Date.now();
  syncOpenOnlineBattleFromLobby(state.online.currentLobby);
  clearStaleOnlineBattle(state.online.currentLobby);
  if ("profile" in payload) applyProfile(payload.profile);
  schedulePendingLobbyInvite();
}

function syncOpenOnlineBattleFromLobby(lobby) {
  const match = lobby?.match;
  if (!match || !state.battle?.online || state.battle.online.matchId !== match.id) return;
  const appliedSnapshot = applyOnlineBattleSnapshot(match.battleState);
  const appliedAction = !appliedSnapshot && applyOnlineBattleEvent(match.lastAction);
  state.battle.online.message = match.message;
  state.battle.online.isYourTurn = match.isYourTurn;
  state.battle.online.pendingAction = false;
  state.battle.online.round = match.round;
  state.battle.online.sequence = match.sequence || 0;
  state.battle.online.actionDeadlineAt = match.actionDeadlineAt || null;
  state.battle.online.absence = match.absence || null;
  if (!appliedSnapshot && !state.battle.online.logStarted) {
    state.battle.log = [
      `Online ${lobby.id}: partida ${match.id.slice(0, 8)} contra ${match.opponentName}.`,
      ...(match.log || [])
    ].slice(-25);
    state.battle.online.logStarted = true;
  }
  alignOnlineBattleTurn(match, { render: false });
  if (appliedAction) state.battle.status = match.message;
  if (state.currentTab === "battle") renderBattle();
}

function clearStaleOnlineBattle(lobby) {
  const active = state.battle?.online;
  if (!active) return;
  if (lobby?.match?.id === active.matchId) return;
  clearTurnTimer();
  clearMatchTimer();
  state.battle = null;
  state.battleSceneOpen = false;
  state.online.message = "Sala pronta para uma nova partida.";
  if (state.currentTab === "battle") renderBattle();
}

async function refreshOnlineLobbies(options = {}) {
  if (!state.server.enabled) {
    state.online.error = "Servidor online indisponivel.";
    state.online.currentLobby = null;
    state.online.lobbies = [];
    if (state.currentTab === "online") renderOnline();
    return;
  }
  if (state.online.socketStatus === "online" && !options.force) return;
  if (state.online.loading) return;
  const now = Date.now();
  if (!options.force && now - state.online.loadedAt < 4000) return;
  state.online.loading = true;
  state.online.error = "";
  if (state.currentTab === "online") renderOnline();
  try {
    const response = await fetch(SERVER_LOBBIES_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Lobby indisponivel");
    applyOnlineLobbyPayload(payload);
    return payload;
  } catch (error) {
    state.online.error = "Lobby online indisponivel.";
    return null;
  } finally {
    state.online.loading = false;
    if (state.currentTab === "online") renderOnline();
  }
}

async function postOnlineLobbyAction(path, body, statusLabel) {
  if (!state.server.enabled) {
    state.online.error = "Servidor online indisponivel.";
    renderOnline();
    return null;
  }
  state.online.loading = true;
  state.online.error = "";
  renderOnline();
  try {
    const payload = await postServerMutation(`${SERVER_LOBBIES_ENDPOINT}/${path}`, body, statusLabel);
    applyOnlineLobbyPayload(payload);
    state.online.message = "";
    return payload;
  } catch (error) {
    state.online.error = error.message || "Acao online indisponivel.";
    return null;
  } finally {
    state.online.loading = false;
    renderOnline();
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function upgradeLevel(monsterId) {
  return clamp(Number(state.save.upgrades?.[monsterId]) || 0, 0, 2);
}

function upgradedStat(value, level) {
  return Math.round(value * (1 + level * 0.1));
}

function monsterStats(monsterOrId, side = "player") {
  const monster = typeof monsterOrId === "string" ? MONSTER_BY_ID[monsterOrId] : monsterOrId;
  if (!monster || isGoalkeeper(monster)) {
    return { vitality: 0, shot: 0, dribble: 0, speed: 0 };
  }
  const level = side === "player" ? upgradeLevel(monster.id) : 0;
  return {
    vitality: upgradedStat(monster.vitality, level),
    shot: upgradedStat(monster.shot, level),
    dribble: upgradedStat(monster.dribble, level),
    speed: upgradedStat(monster.speed, level)
  };
}

function upgradeCost(monsterId) {
  const monster = MONSTER_BY_ID[monsterId];
  const level = upgradeLevel(monsterId);
  const rarityFragments = RARITIES[monster?.rarity]?.fragments || 3;
  return {
    fragments: Math.round(rarityFragments * (2 + level)),
    merreis: Math.round((220 + level * 180) * (monster?.cost || 1))
  };
}

function setup() {
  setupTabs();
  setupFilters();
  setupActions();
  setupEntryGateActions();
  setupProfileActions();
  setupFirebaseAuth();
  setupMusicPlayer();
  setupOnlineLobbyRealtime();
  setupServerSave();
  renderAll();
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  state.currentTab = tabName;
  if (tabName === "collection") progressTutorial("collection");
  if (tabName === "competitive") refreshLeaderboard({ force: true });
  if (tabName === "online") refreshOnlineLobbies({ force: true });
  document.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${state.currentTab}`);
  });
  renderAll();
}

function setupOnlineLobbyRealtime() {
  window.setInterval(() => {
    if (state.server.enabled && state.online.socketStatus !== "online") connectOnlineSocket();
    if (state.currentTab === "online" && state.online.socketStatus !== "online") refreshOnlineLobbies();
  }, 10000);
}

function setupFilters() {
  const typeFilter = document.getElementById("type-filter");
  Object.keys(TYPES).forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.append(option);
  });

  const rarityFilter = document.getElementById("rarity-filter");
  Object.keys(RARITIES).forEach((rarity) => {
    const option = document.createElement("option");
    option.value = rarity;
    option.textContent = rarity;
    rarityFilter.append(option);
  });

  typeFilter.addEventListener("change", () => {
    state.collectionFilters.type = typeFilter.value;
    renderCollection();
  });

  rarityFilter.addEventListener("change", () => {
    state.collectionFilters.rarity = rarityFilter.value;
    renderCollection();
  });

  document.getElementById("owned-filter").addEventListener("change", (event) => {
    state.collectionFilters.owned = event.target.value;
    renderCollection();
  });

  document.getElementById("slot-picker").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-slot]");
    if (!button) return;
    state.selectedSlot = Number(button.dataset.slot);
    renderCollection();
  });
}

function setupActions() {
  document.getElementById("new-battle-button").addEventListener("click", startConfiguredBattle);
  document.getElementById("battle-setup-menu").addEventListener("click", handleBattleSetupClick);
  document.getElementById("back-to-battle-menu-button").addEventListener("click", () => {
    state.battleSceneOpen = false;
    renderBattle();
  });
  document.getElementById("battle-resume-card").addEventListener("click", (event) => {
    const openButton = event.target.closest("button[data-open-battle-scene]");
    const startButton = event.target.closest("button[data-start-battle]");
    if (openButton && state.battle) {
      state.battleSceneOpen = true;
      renderBattle();
    }
    const onlineButton = event.target.closest("button[data-open-online-battle]");
    if (onlineButton && !onlineButton.disabled) {
      openOnlineBattle();
      return;
    }
    if (startButton && !startButton.disabled) startConfiguredBattle();
  });
  document.getElementById("reveal-all-button").addEventListener("click", revealAllPulls);
  document.getElementById("pack-results").addEventListener("click", handlePackResultsClick);
  document.getElementById("trade-button").addEventListener("click", doTrade);
  document.getElementById("reset-save-button").addEventListener("click", resetSave);
  document.getElementById("ranked-button").addEventListener("click", () => runRankedMatch("ranked"));
  document.getElementById("create-lobby-button").addEventListener("click", createOnlineLobby);
  document.getElementById("refresh-lobbies-button").addEventListener("click", () => refreshOnlineLobbies({ force: true }));
  document.getElementById("online-code-form").addEventListener("submit", handleOnlineCodeSubmit);
  document.getElementById("online-code-input").addEventListener("input", handleOnlineCodeInput);
  document.getElementById("online-current-card").addEventListener("click", handleOnlineLobbyClick);
  document.getElementById("online-lobby-list").addEventListener("click", handleOnlineLobbyClick);
  document.getElementById("tutorial-panel").addEventListener("click", handleTutorialControls);
  document.getElementById("tutorial-coach").addEventListener("click", handleTutorialControls);
  document.getElementById("tutorial-popover").addEventListener("click", handleTutorialControls);
  document.getElementById("tutorial-result-popup").addEventListener("click", handleTutorialControls);

  document.getElementById("friends-grid").addEventListener("click", (event) => {
    const giftButton = event.target.closest("button[data-gift]");
    const challengeButton = event.target.closest("button[data-challenge]");
    if (giftButton && !giftButton.disabled) sendFriendGift(giftButton.dataset.gift);
    if (challengeButton) challengeFriend(challengeButton.dataset.challenge);
  });

  document.getElementById("trade-offer").addEventListener("change", (event) => {
    state.selectedTrade.offer = event.target.value;
  });

  document.getElementById("trade-wish").addEventListener("change", (event) => {
    state.selectedTrade.wish = event.target.value;
  });

  setupEditActions();

  document.getElementById("tournament-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tournament]");
    if (!button || button.disabled) return;
    runTournament(button.dataset.tournament);
  });

  document.getElementById("shop-grid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-shop]");
    if (!button || button.disabled) return;
    buyShopItem(button.dataset.shop);
  });

  document.getElementById("action-grid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    chooseAction(button.dataset.action);
  });

  document.getElementById("battle-result").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-result-action]");
    if (!button) return;
    handleResultAction(button.dataset.resultAction);
  });

  document.addEventListener("click", handleTazzoViewerClick);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTazzoViewer();
      const profileModal = document.getElementById("profile-modal");
      if (profileModal && !profileModal.hidden) closeProfileModal();
    }
  });
  setupHolographicArtMotion();
}

function handleOnlineLobbyClick(event) {
  const joinButton = event.target.closest("button[data-join-lobby]");
  if (joinButton && !joinButton.disabled) {
    joinOnlineLobby(joinButton.dataset.joinLobby);
    return;
  }

  const actionButton = event.target.closest("button[data-lobby-action]");
  if (!actionButton || actionButton.disabled) return;
  if (actionButton.dataset.lobbyAction === "leave") {
    leaveOnlineLobby();
    return;
  }
  if (actionButton.dataset.lobbyAction === "copy-invite") {
    copyOnlineInvite();
    return;
  }
  if (actionButton.dataset.lobbyAction === "ready") {
    setOnlineLobbyReady(actionButton.dataset.ready === "true");
    return;
  }
  if (actionButton.dataset.lobbyAction === "rematch") {
    resetOnlineLobbyMatch();
    return;
  }
  if (actionButton.dataset.lobbyAction === "claim-forfeit") {
    claimOnlineForfeit();
    return;
  }
  if (actionButton.dataset.lobbyAction === "open-battle") {
    openOnlineBattle();
  }
}

function handleOnlineCodeInput(event) {
  const code = normalizeLobbyCode(event.target.value);
  if (event.target.value !== code) event.target.value = code;
  state.online.joinCode = code;
  if (state.online.inviteMessageType === "error" && code.length < 6) {
    state.online.inviteMessage = "";
    renderOnlineInviteMessage();
  }
}

function handleOnlineCodeSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("online-code-input");
  joinOnlineLobby(input?.value || state.online.joinCode, { source: "code" });
}

async function createOnlineLobby() {
  const payload = await postOnlineLobbyAction("create", {}, "Criando sala");
  if (payload?.currentLobby?.id) {
    state.online.inviteMessage = `Sala ${payload.currentLobby.id} criada. Copie o convite para chamar alguem.`;
    state.online.inviteMessageType = "success";
    renderOnline();
  }
  return payload;
}

async function joinOnlineLobby(lobbyId, options = {}) {
  const code = normalizeLobbyCode(lobbyId);
  state.online.joinCode = code;
  if (!isValidLobbyCode(code)) {
    state.online.inviteMessage = "Digite um codigo de 6 caracteres da sala.";
    state.online.inviteMessageType = "error";
    renderOnlineInviteMessage();
    return null;
  }
  const payload = await postOnlineLobbyAction("join", { lobbyId: code }, options.source === "invite" ? "Entrando pelo convite" : "Entrando na sala");
  if (payload?.currentLobby?.id === code) {
    state.online.inviteMessage = options.source === "invite" ? `Convite aceito: sala ${code}.` : `Voce entrou na sala ${code}.`;
    state.online.inviteMessageType = "success";
    if (options.source === "invite") clearOnlineInviteParam();
  } else if (!payload) {
    state.online.inviteMessage = state.online.error || "Nao foi possivel entrar nessa sala.";
    state.online.inviteMessageType = "error";
  }
  renderOnline();
  return payload;
}

function onlineInviteUrl(lobbyId) {
  const url = new URL(window.location.href);
  url.searchParams.set("lobby", lobbyId);
  return url.toString();
}

function clearOnlineInviteParam() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("lobby");
    url.searchParams.delete("sala");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  } catch (error) {}
}

async function copyOnlineInvite() {
  const lobby = state.online.currentLobby;
  if (!lobby?.id) {
    state.online.inviteMessage = "Crie ou entre em uma sala antes de copiar o convite.";
    state.online.inviteMessageType = "error";
    renderOnline();
    return;
  }
  const invite = onlineInviteUrl(lobby.id);
  const copied = await copyTextToClipboard(invite);
  state.online.inviteMessage = copied
    ? `Convite da sala ${lobby.id} copiado.`
    : `Convite da sala ${lobby.id}: ${invite}`;
  state.online.inviteMessageType = copied ? "success" : "info";
  renderOnline();
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {}
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  } catch (error) {
    return false;
  }
}

function schedulePendingLobbyInvite() {
  const code = state.online.pendingInviteCode;
  if (!code || state.online.inviteHandled || !state.server.enabled) return;
  state.online.inviteHandled = true;
  window.setTimeout(() => joinOnlineLobbyFromInvite(code), 80);
}

async function joinOnlineLobbyFromInvite(code) {
  state.online.joinCode = code;
  state.online.inviteMessage = `Entrando na sala ${code} pelo convite...`;
  state.online.inviteMessageType = "info";
  switchTab("online");
  if (state.online.currentLobby?.id === code) {
    state.online.inviteMessage = `Voce ja esta na sala ${code}.`;
    state.online.inviteMessageType = "success";
    clearOnlineInviteParam();
    renderOnline();
    return;
  }
  await joinOnlineLobby(code, { source: "invite" });
}

async function leaveOnlineLobby(options = {}) {
  const payload = await postOnlineLobbyAction("leave", {}, "Saindo da sala");
  if (options.switchToOnline) {
    state.battleSceneOpen = false;
    switchTab("online");
  }
  return payload;
}

function setOnlineLobbyReady(ready) {
  postOnlineLobbyAction("ready", { ready }, ready ? "Marcando pronto" : "Voltando");
}

async function resetOnlineLobbyMatch(options = {}) {
  const match = state.online.currentLobby?.match;
  if (!match?.battleState?.over) {
    switchTab("online");
    refreshOnlineLobbies({ force: true });
    return;
  }
  const previousMatchId = match.id;
  const payload = await postOnlineLobbyAction("rematch", {}, "Pedindo revanche");
  const nextMatch = payload?.currentLobby?.match;
  if (options.openWhenReady && nextMatch && nextMatch.id !== previousMatchId && !nextMatch.battleState?.over) {
    openOnlineBattle();
    return;
  }
  switchTab("online");
}

async function claimOnlineForfeit() {
  await postOnlineLobbyAction("forfeit", {}, "Pedindo W.O.");
  switchTab("online");
}

function resumableOnlineMatch() {
  const lobby = state.online.currentLobby;
  const match = lobby?.match;
  if (!lobby || !match) return null;
  return { lobby, match };
}

function currentOnlineRematchStatus() {
  const lobby = state.online.currentLobby;
  if (!state.battle?.online || !lobby?.match || lobby.match.id !== state.battle.online.matchId) {
    return {
      canRequest: false,
      requestedByYou: false,
      requestedCount: 0,
      requiredCount: 2,
      waitingFor: []
    };
  }
  return lobby.rematch || {
    canRequest: false,
    requestedByYou: false,
    requestedCount: 0,
    requiredCount: 2,
    waitingFor: []
  };
}

function onlineBattleStatus(match) {
  const absence = match.absence || {};
  if (absence.opponentAway) {
    return absence.canClaimForfeit
      ? `${absence.opponentName || match.opponentName} esta ausente. Voce ja pode pedir W.O.`
      : `${absence.opponentName || match.opponentName} desconectou. W.O. em ${absence.secondsUntilForfeit || 0}s.`;
  }
  return match.isYourTurn
    ? "Seu turno online: escolha uma acao e um alvo."
    : `Aguardando ${match.opponentName}.`;
}

function isOnlineTargetAction(action) {
  return ONLINE_TARGET_ACTIONS.includes(action);
}

function applyOnlineBattleSnapshot(snapshot, options = {}) {
  if (!state.battle?.online || !snapshot) return false;
  const sequence = Number(snapshot.sequence) || 0;
  if (!options.force && sequence <= (Number(state.battle.online.stateSequence) || 0)) return false;

  state.battle.online.stateSequence = sequence;
  state.battle.online.lastActionSequence = Math.max(Number(state.battle.online.lastActionSequence) || 0, sequence);
  state.battle.round = Math.max(1, Number(snapshot.round) || 1);
  state.battle.activeId = snapshot.activeId || state.battle.activeId;
  state.battle.pieces = (snapshot.pieces || []).map((piece) => ({
    id: piece.id,
    monsterId: piece.monsterId,
    side: piece.side,
    x: Number(piece.x) || 0,
    y: Number(piece.y) || 0,
    hp: Math.max(0, Number(piece.hp) || 0),
    maxHp: Math.max(0, Number(piece.maxHp) || 0),
    shot: Math.max(0, Number(piece.shot) || 0),
    dribble: Math.max(0, Number(piece.dribble) || 0),
    speed: Math.max(0, Number(piece.speed) || 0),
    acted: Boolean(piece.acted)
  }));
  state.battle.effects = {
    player: cloneOnlineEffects(snapshot.effects?.player),
    cpu: cloneOnlineEffects(snapshot.effects?.cpu)
  };
  state.battle.goalkeepers = {
    player: cloneOnlineGoalkeeper(snapshot.goalkeepers?.player, "player"),
    cpu: cloneOnlineGoalkeeper(snapshot.goalkeepers?.cpu, "cpu")
  };
  state.battle.damageByPlayer = Math.max(0, Number(snapshot.damageByPlayer) || 0);
  state.battle.damageByCpu = Math.max(0, Number(snapshot.damageByCpu) || 0);
  state.battle.over = Boolean(snapshot.over);
  if (snapshot.result) {
    state.battle.result = {
      winner: snapshot.result.winner,
      title: snapshot.result.title,
      reason: snapshot.result.reason,
      rewards: snapshot.result.rewards || [],
      online: true,
      ranked: false,
      tournamentId: null,
      packReward: false
    };
  }
  state.battle.log = [
    `Online ${state.battle.online.lobbyId}: estado sincronizado pelo servidor.`,
    ...((snapshot.log || []).slice(-24))
  ].slice(-25);
  state.battle.status = snapshot.result?.status || snapshot.status || state.battle.online.message || state.battle.status;
  state.battle.pendingAction = null;
  state.battle.validTargets = [];
  state.battle.online.logStarted = true;
  return true;
}

function cloneOnlineEffects(effects = {}) {
  return {
    fullShot: Math.max(0, Number(effects.fullShot) || 0),
    freeSwap: Boolean(effects.freeSwap),
    substitution: Boolean(effects.substitution),
    extraTurnId: effects.extraTurnId || null
  };
}

function cloneOnlineGoalkeeper(goalkeeper, side) {
  return goalkeeper ? {
    monsterId: goalkeeper.monsterId,
    side,
    used: Boolean(goalkeeper.used)
  } : null;
}

function applyOnlineBattleEvent(event) {
  if (!state.battle?.online || !event) return false;
  const sequence = Number(event.sequence) || 0;
  if (sequence <= (Number(state.battle.online.lastActionSequence) || 0)) return false;
  state.battle.online.lastActionSequence = sequence;
  state.battle.online.sequence = Math.max(Number(state.battle.online.sequence) || 0, sequence);
  state.battle.online.pendingAction = false;
  state.battle.pendingAction = null;
  state.battle.validTargets = [];

  if (event.action === "pass" || event.action === "keeper") {
    logBattle(event.message || `${event.actorName || "Jogador"} passou.`);
    return true;
  }

  if (!isOnlineTargetAction(event.action) || !event.target) return false;
  const side = event.isYours ? "player" : "cpu";
  const actor = activePiece()?.side === side
    ? activePiece()
    : state.battle.pieces.find((piece) => piece.side === side && piece.hp > 0);
  const target = actor
    ? validTargetsFor(actor, event.action).find((item) => item.x === event.target.x && item.y === event.target.y)
    : null;

  if (!actor || !target) {
    logBattle(event.message || "Jogada online recebida, mas o alvo nao encaixou nesta arena.");
    return true;
  }

  executeAction(actor, target, { skipFinishTurn: true });
  return true;
}

async function sendOnlineBattleAction(action, target = null) {
  if (!state.battle?.online) return;
  if (state.battle.over || state.battle.online.pendingAction) return;
  if (!state.battle.online.isYourTurn || !isPlayerTurn()) {
    state.battle.status = "Aguardando o turno online chegar.";
    renderBattle();
    return;
  }

  state.battle.online.pendingAction = true;
  state.battle.online.message = target ? "Enviando jogada online..." : "Enviando passe online...";
  state.battle.pendingAction = null;
  state.battle.validTargets = [];
  state.battle.status = state.battle.online.message;
  renderBattle();

  const payload = {
    type: "online:action",
    matchId: state.battle.online.matchId,
    action,
    target
  };
  const socket = state.online.socket;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
    return;
  }

  try {
    const response = await postServerMutation(`${SERVER_LOBBIES_ENDPOINT}/action`, {
      matchId: state.battle.online.matchId,
      action,
      target
    }, "Jogada online");
    if (response) applyOnlineLobbyPayload(response);
  } catch (error) {
    state.battle.online.pendingAction = false;
    state.battle.online.message = error.message || "Acao online indisponivel.";
    state.battle.status = state.battle.online.message;
    renderBattle();
  }
}

function handleOnlineBattleAction(action) {
  if (!state.battle?.online) return;
  closeTazzoViewer();
  if (state.battle.over || state.battle.online.pendingAction) return;
  if (action === "pass" || action === "keeper") {
    sendOnlineBattleAction(action);
    return;
  }
  if (!isOnlineTargetAction(action)) {
    state.battle.status = "Esta acao online entra no proximo passo.";
    renderBattle();
    return;
  }
  if (!state.battle.online.isYourTurn || !isPlayerTurn()) {
    state.battle.status = "Aguardando o turno online chegar.";
    renderBattle();
    return;
  }

  state.battle.pendingAction = state.battle.pendingAction === action ? null : action;
  state.battle.validTargets = state.battle.pendingAction ? validTargetsFor(activePiece(), state.battle.pendingAction) : [];
  state.battle.status = state.battle.pendingAction
    ? state.battle.validTargets.length
      ? `${actionName(action)}: escolha o alvo online.`
      : `${actionName(action)} sem alvos validos agora.`
    : onlineBattleStatus({ isYourTurn: true, opponentName: state.battle.enemyName });
  renderBattle();
}

function handleOnlineBattleTarget(x, y) {
  if (!state.battle?.online) return;
  if (state.battle.over) return;
  if (state.battle.online.pendingAction) return;
  if (!state.battle.online.isYourTurn || !isPlayerTurn() || !state.battle.pendingAction) return;
  const target = state.battle.validTargets.find((item) => item.x === x && item.y === y);
  if (!target) return;
  sendOnlineBattleAction(target.action, { x: target.x, y: target.y });
}

function openOnlineBattle() {
  const lobby = state.online.currentLobby;
  const match = lobby?.match;
  if (!lobby || !match) return;
  if (state.battle?.online?.matchId === match.id) {
    syncOpenOnlineBattleFromLobby(lobby);
    state.battleSceneOpen = true;
    switchTab("battle");
    return;
  }

  clearTurnTimer();
  clearMatchTimer();
  const onlineMeta = {
    matchId: match.id,
    lobbyId: lobby.id,
    playerSlot: match.playerSlot,
    isYourTurn: match.isYourTurn,
    message: match.message,
    round: match.round,
    sequence: match.sequence || 0,
    actionDeadlineAt: match.actionDeadlineAt || null,
    turnKey: "",
    absence: match.absence || null,
    stateSequence: -1,
    lastActionSequence: 0,
    pendingAction: false,
    logStarted: true
  };
  switchTab("battle");
  newBattle({
    playerTeam: match.playerTeam,
    playerGoalkeeper: match.playerGoalkeeper,
    playerPositions: match.playerPositions,
    enemyTeam: match.enemyTeam,
    enemyGoalkeeper: match.enemyGoalkeeper,
    enemyPositions: match.enemyPositions,
    enemyName: match.opponentName,
    mode: "friend",
    matchTime: match.matchTime,
    actionTime: match.actionTime,
    online: onlineMeta,
    preservePlayerLoadout: true,
    logIntro: `Online ${lobby.id}: partida ${match.id.slice(0, 8)} contra ${match.opponentName} pronta.`
  });
  state.battle.log = [
    `Online ${lobby.id}: partida ${match.id.slice(0, 8)} contra ${match.opponentName}.`,
    ...(match.log || [])
  ].slice(-25);
  applyOnlineBattleSnapshot(match.battleState, { force: true });
  alignOnlineBattleTurn(match);
}

function onlineTurnKey(match) {
  return [
    match.id || state.battle?.online?.matchId || "",
    Number(match.sequence) || 0,
    match.battleState?.activeId || "",
    match.isYourTurn ? "player" : "rival"
  ].join(":");
}

function onlineRemainingTurnSeconds(match) {
  const serverSeconds = Number(match.actionSecondsRemaining);
  if (Number.isFinite(serverSeconds) && serverSeconds >= 0) return Math.ceil(serverSeconds);
  if (match.actionDeadlineAt) {
    const deadline = new Date(match.actionDeadlineAt).getTime();
    if (Number.isFinite(deadline)) return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }
  return Math.max(1, Number(match.actionTime) || state.battle?.actionTime || 20);
}

function syncOnlineTurnTimer(match) {
  if (!state.battle?.online) return;
  const key = onlineTurnKey(match);
  state.battle.online.actionDeadlineAt = match.actionDeadlineAt || null;

  if (!match.isYourTurn) {
    state.battle.online.turnKey = key;
    if (state.timerInterval || state.battle.turnTime !== 0) {
      clearTurnTimer();
      state.battle.turnTime = 0;
      renderTimer();
    }
    return;
  }

  const remaining = Math.max(1, onlineRemainingTurnSeconds(match));
  const current = Math.max(0, Number(state.battle.turnTime) || 0);
  const shouldRestart = state.battle.online.turnKey !== key
    || !state.timerInterval
    || current <= 0
    || Math.abs(current - remaining) > 2;
  state.battle.online.turnKey = key;

  if (shouldRestart) {
    startTurnTimer(remaining);
  } else if (remaining < current) {
    state.battle.turnTime = remaining;
    renderTimer();
  }
}

function alignOnlineBattleTurn(match, options = {}) {
  if (!state.battle?.online) return;
  const statusText = onlineBattleStatus(match);
  state.battle.online.message = match.absence?.opponentAway ? statusText : match.message;
  state.battle.online.isYourTurn = match.isYourTurn;
  state.battle.online.round = match.round;
  state.battle.online.sequence = match.sequence || 0;
  state.battle.online.actionDeadlineAt = match.actionDeadlineAt || null;
  state.battle.online.absence = match.absence || null;
  state.battle.round = Math.max(1, Number(match.round) || 1);
  if (match.battleState?.over || state.battle.over) {
    clearTurnTimer();
    state.battle.online.turnKey = "";
    state.battle.pendingAction = null;
    state.battle.validTargets = [];
    state.battle.status = match.battleState?.result?.status || match.message || state.battle.status;
    if (options.render !== false) renderAll();
    return;
  }
  const desiredSide = match.isYourTurn ? "player" : "cpu";
  const active = state.battle.pieces.find((piece) => piece.id === match.battleState?.activeId && piece.hp > 0)
    || state.battle.pieces.find((piece) => piece.side === desiredSide && piece.hp > 0);
  if (!active) return;
  state.battle.activeId = active.id;
  state.battle.pendingAction = null;
  state.battle.validTargets = [];
  state.battle.status = statusText;
  syncOnlineTurnTimer(match);
  if (options.render !== false) renderAll();
}

function setupProfileActions() {
  const profileButton = document.getElementById("profile-button");
  const profileModal = document.getElementById("profile-modal");
  const closeButton = document.getElementById("profile-close-button");
  const form = document.getElementById("profile-form");
  const logoutButton = document.getElementById("profile-logout-button");
  if (!profileButton || !profileModal || !closeButton || !form || !logoutButton) return;

  profileButton.addEventListener("click", () => openProfileModal());
  closeButton.addEventListener("click", closeProfileModal);
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) closeProfileModal();
  });
  profileModal.querySelector(".profile-mode-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-profile-mode]");
    if (!button) return;
    state.server.profileMode = button.dataset.profileMode === "register" ? "register" : "login";
    state.server.profileMessage = "";
    renderProfileModal();
  });
  form.addEventListener("submit", submitProfileForm);
  logoutButton.addEventListener("click", logoutProfile);
}

function setupFirebaseAuth() {
  document.querySelectorAll("[data-firebase-provider]").forEach((button) => {
    button.addEventListener("click", () => loginWithFirebase(button.dataset.firebaseProvider));
  });
  loadFirebaseAuth();
}

async function loadFirebaseAuth() {
  if (!canUseServerSave()) {
    state.firebase.checked = true;
    renderFirebaseAuth();
    return;
  }

  try {
    const response = await fetch(SERVER_FIREBASE_CONFIG_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Firebase indisponivel.");

    state.firebase.checked = true;
    state.firebase.enabled = Boolean(payload.enabled && payload.config);
    state.firebase.config = payload.config || null;
    state.firebase.providers = Array.isArray(payload.providers) ? payload.providers : [];
    state.firebase.sdkVersion = payload.sdkVersion || state.firebase.sdkVersion;
    renderFirebaseAuth();

    if (!state.firebase.enabled) return;
    const version = encodeURIComponent(state.firebase.sdkVersion);
    const [appModule, authModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`)
    ]);
    const app = appModule.initializeApp(state.firebase.config);
    state.firebase.modules = authModule;
    state.firebase.auth = authModule.getAuth(app);
    authModule.onAuthStateChanged(state.firebase.auth, (user) => {
      state.firebase.currentUser = user || null;
    });
    renderFirebaseAuth();
  } catch (error) {
    state.firebase.checked = true;
    state.firebase.enabled = false;
    state.firebase.message = "Login social nao carregou. Nome/PIN continua funcionando.";
    renderFirebaseAuth();
  }
}

function firebaseProviderLabel(providerId) {
  return providerId === "facebook" ? "Facebook" : "Google";
}

function firebaseProviderListLabel() {
  const labels = (state.firebase.providers || []).map(firebaseProviderLabel);
  if (!labels.length) return "login social";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} ou ${labels[labels.length - 1]}`;
}

function firebaseErrorMessage(error, providerId) {
  const code = String(error?.code || "");
  if (code.includes("popup-closed")) return "Login cancelado.";
  if (code.includes("popup-blocked")) return "O navegador bloqueou a janela de login.";
  if (code.includes("operation-not-allowed")) return `${firebaseProviderLabel(providerId)} ainda nao esta ativo no Firebase.`;
  if (code.includes("unauthorized-domain")) return "Dominio nao autorizado no Firebase Authentication.";
  return error?.message || `Nao foi possivel entrar com ${firebaseProviderLabel(providerId)}.`;
}

async function loginWithFirebase(providerId = "google") {
  if (!state.firebase.enabled || !state.firebase.auth || !state.firebase.modules) {
    setProfileMessage("Firebase ainda nao esta configurado.", "error");
    return;
  }
  const providerName = providerId === "facebook" ? "Facebook" : "Google";
  state.firebase.loading = true;
  state.firebase.message = `Entrando com ${providerName}...`;
  setProfileMessage(state.firebase.message);
  renderFirebaseAuth();
  renderEntryGate();

  try {
    if (state.server.saveTimer) await pushServerSave();
    const modules = state.firebase.modules;
    const provider = providerId === "facebook"
      ? new modules.FacebookAuthProvider()
      : new modules.GoogleAuthProvider();
    if (providerId === "google") provider.setCustomParameters({ prompt: "select_account" });
    const result = await modules.signInWithPopup(state.firebase.auth, provider);
    const idToken = await result.user.getIdToken();
    const response = await fetch(SERVER_FIREBASE_PROFILE_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Nao foi possivel entrar com ${providerName}.`);

    state.server.enabled = true;
    state.server.loading = false;
    state.server.playerId = payload.playerId || state.server.playerId;
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    applyProfile(payload.profile);
    setEntryGateDismissed(true);
    setServerStatus("online", payload.migratedGuestSave ? "Migrado" : "Salvo");
    reconnectOnlineSocket();
    closeProfileModal();
    state.firebase.message = payload.migratedGuestSave ? "Progresso visitante importado para sua conta Google." : "";
    renderAll();
  } catch (error) {
    const message = firebaseErrorMessage(error, providerId);
    state.firebase.message = message;
    setProfileMessage(message, "error");
  } finally {
    state.firebase.loading = false;
    renderFirebaseAuth();
    renderEntryGate();
  }
}

function renderFirebaseAuth() {
  const enabled = state.firebase.checked && state.firebase.enabled;
  document.querySelectorAll("[data-firebase-auth]").forEach((container) => {
    container.hidden = !enabled;
  });
  document.querySelectorAll("[data-firebase-provider]").forEach((button) => {
    const provider = button.dataset.firebaseProvider;
    const providerEnabled = enabled && state.firebase.providers.includes(provider);
    button.hidden = !providerEnabled;
    button.disabled = state.firebase.loading || !providerEnabled;
  });
}

function setupEntryGateActions() {
  const gate = document.getElementById("entry-gate");
  const loginButton = document.getElementById("entry-login-button");
  const registerButton = document.getElementById("entry-register-button");
  const guestButton = document.getElementById("entry-guest-button");
  if (!gate || !loginButton || !registerButton || !guestButton) return;

  loginButton.addEventListener("click", () => openProfileModal("login", { fromEntryGate: true }));
  registerButton.addEventListener("click", () => openProfileModal("register", { fromEntryGate: true }));
  guestButton.addEventListener("click", () => {
    state.server.entryGatePaused = false;
    setEntryGateDismissed(true);
  });
}

function entryGateStatusText() {
  if (state.firebase.loading) return state.firebase.message || "Abrindo login social...";
  if (state.firebase.message) return state.firebase.message;
  if (!canUseServerSave()) return "Abra pelo servidor online para criar ou entrar em um perfil.";
  if (state.server.loading || state.server.status === "connecting") return "Conectando ao servidor...";
  if (!state.server.enabled || state.server.status === "error") return "Servidor indisponivel agora. Visitante usa save local.";
  if (state.firebase.enabled) return `Servidor online. Entre com ${firebaseProviderListLabel()}, nome/PIN ou visitante.`;
  return "Servidor online. O perfil salva seu progresso entre dispositivos e redeploys.";
}

function renderEntryGate() {
  const gate = document.getElementById("entry-gate");
  if (!gate) return;
  const status = document.getElementById("entry-status");
  const loginButton = document.getElementById("entry-login-button");
  const registerButton = document.getElementById("entry-register-button");
  const shouldShow = canUseServerSave()
    && !state.server.profile
    && !state.server.entryGateDismissed
    && !state.server.entryGatePaused;
  gate.hidden = !shouldShow;
  if (status) status.textContent = entryGateStatusText();

  const accountDisabled = state.server.loading || !state.server.enabled;
  if (loginButton) loginButton.disabled = accountDisabled;
  if (registerButton) registerButton.disabled = accountDisabled;
}

function openProfileModal(mode = state.server.profileMode, options = {}) {
  state.server.profileMessage = "";
  state.server.profileMode = mode === "register" ? "register" : "login";
  if (options.fromEntryGate) {
    state.server.entryGatePaused = true;
    renderEntryGate();
  }
  renderProfileModal();
  const modal = document.getElementById("profile-modal");
  modal.hidden = false;
  document.getElementById("profile-name-input").focus();
}

function closeProfileModal() {
  document.getElementById("profile-modal").hidden = true;
  state.server.entryGatePaused = false;
  renderEntryGate();
}

function renderProfileModal() {
  const mode = state.server.profileMode;
  const profile = state.server.profile;
  const currentName = document.getElementById("profile-current-name");
  const currentMeta = document.getElementById("profile-current-meta");
  const currentAvatar = document.getElementById("profile-current-avatar");
  const title = document.getElementById("profile-title");
  const submit = document.getElementById("profile-submit-button");
  const message = document.getElementById("profile-message");
  const logoutButton = document.getElementById("profile-logout-button");
  if (!currentName || !currentMeta || !title || !submit || !message || !logoutButton) return;

  renderProfileAvatar(currentAvatar, profile);
  currentName.textContent = profile?.name || "Visitante";
  currentMeta.textContent = profileMetaText(profile);
  title.textContent = mode === "register" ? "Criar jogador" : "Entrar no perfil";
  submit.textContent = mode === "register" ? "Criar jogador" : "Entrar";
  message.textContent = state.server.profileMessage;
  message.classList.toggle("is-error", state.server.profileMessageType === "error");
  logoutButton.hidden = !profile;
  logoutButton.textContent = profile?.authProvider === "firebase" ? "Sair da conta Google" : "Sair do perfil";
  document.querySelectorAll("[data-profile-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileMode === mode);
  });
}

async function submitProfileForm(event) {
  event.preventDefault();
  if (!canUseServerSave()) {
    setProfileMessage("Abra o jogo pelo servidor para usar perfil online.", "error");
    return;
  }

  const name = document.getElementById("profile-name-input").value;
  const pin = document.getElementById("profile-pin-input").value;
  const action = state.server.profileMode === "register" ? "register" : "login";
  setProfileMessage(action === "register" ? "Criando jogador..." : "Entrando...");

  try {
    if (state.server.saveTimer) await pushServerSave();
    const response = await fetch(`${SERVER_PROFILE_ENDPOINT}/${action}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Nao foi possivel usar esse perfil.");

    state.server.enabled = true;
    state.server.loading = false;
    state.server.playerId = payload.playerId || state.server.playerId;
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    applyProfile(payload.profile);
    setEntryGateDismissed(true);
    setServerStatus("online", "Salvo");
    reconnectOnlineSocket();
    closeProfileModal();
    renderAll();
  } catch (error) {
    setProfileMessage(error.message || "Erro de perfil.", "error");
  }
}

async function logoutProfile() {
  if (!canUseServerSave()) return;
  setProfileMessage("Saindo...");
  try {
    if (state.server.saveTimer) await pushServerSave();
    await fetch(`${SERVER_PROFILE_ENDPOINT}/logout`, {
      method: "POST",
      credentials: "same-origin"
    });
    if (state.firebase.auth && state.firebase.modules?.signOut) {
      await state.firebase.modules.signOut(state.firebase.auth).catch(() => {});
    }
  } catch (error) {
    setProfileMessage("Nao foi possivel sair agora.", "error");
    return;
  }

  state.save = defaultSave();
  persistLocalSave();
  applyProfile(null);
  setEntryGateDismissed(false);
  closeProfileModal();
  setServerStatus("connecting", "Conectando");
  await loadServerSave();
  renderAll();
}

function setupMusicPlayer() {
  const player = document.getElementById("music-player");
  const audio = document.getElementById("music-audio");
  const playButton = document.getElementById("music-play-button");
  const toggleButton = document.getElementById("music-toggle-button");
  const nextButton = document.getElementById("music-next-button");
  const volumeControl = document.getElementById("music-volume-control");
  if (!player || !audio || !playButton || !toggleButton || !nextButton || !volumeControl) return;

  state.music.audio = audio;
  audio.volume = clamp(Number(state.save.musicVolume), 0, 1);
  volumeControl.value = String(audio.volume);
  setMusicTrack(state.save.musicTrackIndex, { autoplay: false });

  playButton.addEventListener("click", toggleMusicPlayback);
  toggleButton.addEventListener("click", toggleMusicPlayback);
  nextButton.addEventListener("click", () => nextMusicTrack({ autoplay: state.music.isPlaying }));
  volumeControl.addEventListener("input", () => {
    const volume = clamp(Number(volumeControl.value), 0, 1);
    audio.volume = volume;
    state.save.musicVolume = volume;
    saveGame();
  });
  audio.addEventListener("ended", () => nextMusicTrack({ autoplay: true }));
  audio.addEventListener("play", () => {
    state.music.isPlaying = true;
    syncMusicPlayer();
  });
  audio.addEventListener("pause", () => {
    state.music.isPlaying = false;
    syncMusicPlayer();
  });
  audio.addEventListener("error", () => {
    state.music.isPlaying = false;
    document.getElementById("music-track-name").textContent = "Musica indisponivel";
    syncMusicPlayer();
  });
}

function musicTrackSrc(track) {
  return `musics/${encodeURIComponent(track.file)}`;
}

function setMusicTrack(index, options = {}) {
  const audio = state.music.audio;
  if (!audio || !MUSIC_TRACKS.length) return;
  const nextIndex = clamp(Number(index) || 0, 0, MUSIC_TRACKS.length - 1);
  const track = MUSIC_TRACKS[nextIndex];
  state.save.musicTrackIndex = nextIndex;
  audio.src = musicTrackSrc(track);
  audio.load();
  saveGame();
  syncMusicPlayer();
  if (options.autoplay) playMusic();
}

function nextMusicTrack(options = {}) {
  const current = Number(state.save.musicTrackIndex) || 0;
  setMusicTrack((current + 1) % MUSIC_TRACKS.length, options);
}

function toggleMusicPlayback() {
  const audio = state.music.audio;
  if (!audio) return;
  if (audio.paused) {
    playMusic();
    return;
  }
  audio.pause();
}

function playMusic() {
  const audio = state.music.audio;
  if (!audio || !MUSIC_TRACKS.length) return;
  audio.play().catch(() => {
    state.music.isPlaying = false;
    syncMusicPlayer();
  });
}

function syncMusicPlayer() {
  const player = document.getElementById("music-player");
  const trackName = document.getElementById("music-track-name");
  const playButton = document.getElementById("music-play-button");
  const toggleButton = document.getElementById("music-toggle-button");
  const volumeControl = document.getElementById("music-volume-control");
  const audio = state.music.audio;
  const track = MUSIC_TRACKS[state.save.musicTrackIndex] || MUSIC_TRACKS[0];
  const isPlaying = Boolean(audio && !audio.paused && !audio.ended);
  if (trackName && track) trackName.textContent = track.name;
  if (playButton) playButton.textContent = isPlaying ? "Pausar" : "Play";
  if (toggleButton) toggleButton.setAttribute("aria-label", isPlaying ? "Pausar musica" : "Tocar musica");
  if (volumeControl && audio) volumeControl.value = String(audio.volume);
  if (player) player.classList.toggle("is-playing", isPlaying);
}

function setupHolographicArtMotion() {
  document.addEventListener("pointermove", (event) => {
    const art = event.target.closest?.("[data-holo-art]");
    if (!art || art.closest("[data-viewer-tilt]")) return;
    const rect = art.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    updateHolographicArt(art, x, y, 8);
  });

  document.addEventListener("pointerout", (event) => {
    const art = event.target.closest?.("[data-holo-art]");
    if (!art || art.closest("[data-viewer-tilt]")) return;
    if (event.relatedTarget && art.contains(event.relatedTarget)) return;
    resetHolographicArt(art);
  });
}

function updateHolographicArt(art, x, y, tilt = 0) {
  const shiftedX = clamp(x + (0.5 - y) * 0.12, 0, 1);
  const transitionProgress = clamp((shiftedX - 0.08) / 0.84, 0, 1);
  const smoothProgress = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
  art.classList.add("is-holo-moving");
  art.style.setProperty("--holo-x", `${x * 100}%`);
  art.style.setProperty("--holo-y", `${y * 100}%`);
  art.style.setProperty("--holo-wipe", `${(smoothProgress * 124 - 12).toFixed(2)}%`);
  art.style.setProperty("--holo-tilt-x", `${(0.5 - y) * tilt}deg`);
  art.style.setProperty("--holo-tilt-y", `${(x - 0.5) * tilt}deg`);
}

function resetHolographicArt(art) {
  art.classList.remove("is-holo-moving");
  art.style.setProperty("--holo-x", "52%");
  art.style.setProperty("--holo-y", "44%");
  art.style.setProperty("--holo-wipe", "-12%");
  art.style.setProperty("--holo-tilt-x", "0deg");
  art.style.setProperty("--holo-tilt-y", "0deg");
}

function setupEditActions() {
  const form = document.getElementById("edit-tazzo-form");
  const select = document.getElementById("edit-tazzo-select");
  const roster = document.getElementById("edit-roster");
  const newButton = document.getElementById("edit-new-button");
  if (!form || !select || !roster || !newButton) return;

  select.addEventListener("change", () => {
    state.editSelectedId = select.value;
    state.editMessage = "";
    renderEdit();
  });

  roster.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-edit-roster]");
    if (!button) return;
    state.editSelectedId = button.dataset.editRoster;
    state.editMessage = "";
    renderEdit();
  });

  newButton.addEventListener("click", () => {
    state.editSelectedId = "__new__";
    state.editMessage = "";
    renderEdit();
  });

  form.addEventListener("submit", saveEditedTazzo);
  form.addEventListener("change", (event) => {
    if (event.target.id === "edit-type" || event.target.id === "edit-is-goalkeeper") syncEditFormMode();
    if (event.target.id === "edit-image" || event.target.id === "edit-back-image") syncEditPreviewImage();
  });
}

function handleTazzoViewerClick(event) {
  const closeButton = event.target.closest("[data-close-tazzo-viewer]");
  const flipButton = event.target.closest("[data-flip-tazzo-viewer]");
  const viewer = document.getElementById("tazzo-viewer");
  if (flipButton) {
    event.preventDefault();
    event.stopPropagation();
    flipTazzoViewer(flipButton);
    return;
  }

  if (closeButton || event.target === viewer) {
    closeTazzoViewer();
    return;
  }

  const target = event.target.closest("[data-monster-view]");
  if (!target || target.closest(".arena")) return;
  if (!canOpenTazzoViewer()) return;
  event.preventDefault();
  openTazzoViewer(target.dataset.monsterView);
}

function canOpenTazzoViewer() {
  return !state.battle?.pendingAction;
}

function openTazzoViewer(monsterId) {
  if (!canOpenTazzoViewer()) return;
  const monster = MONSTER_BY_ID[monsterId];
  const viewer = document.getElementById("tazzo-viewer");
  if (!monster || !viewer) return;
  const copies = state.save.collection[monster.id] || 0;
  const stats = monsterStats(monster);
  const keeper = isGoalkeeper(monster);
  const level = keeper ? 0 : upgradeLevel(monster.id);
  const abilityText = keeperAbilityText(monster);
  const ownedText = copies ? `${copies} copia(s) no album` : "Ainda nao obtido";
  viewer.innerHTML = `
    <section class="tazzo-viewer-card${copies ? "" : " is-missing"}" role="dialog" aria-modal="true" aria-labelledby="tazzo-viewer-title">
      <button class="viewer-close" type="button" data-close-tazzo-viewer="true" aria-label="Fechar visualizacao">Fechar</button>
      <div class="viewer-art-stage" data-viewer-tilt>
        <button class="viewer-flip-button" type="button" data-flip-tazzo-viewer aria-label="Ver verso">></button>
        <div class="viewer-art-disc">
          ${renderViewerFrontArt(monster, copies > 0)}
          <img class="viewer-face viewer-face-back" src="${monsterBackImage(monster)}" alt="Verso de ${monster.name}">
        </div>
      </div>
      <div class="viewer-info">
        <span class="eyebrow">Tazzo #${String(monster.number).padStart(2, "0")}</span>
        <h2 id="tazzo-viewer-title">${monster.name}</h2>
        <div class="stat-line">
          ${typeChips(monster)}
          <span class="rarity-chip">${monster.rarity}</span>
          ${holographicChip(monster)}
          ${level ? `<span class="rarity-chip">+${level}</span>` : ""}
        </div>
        <div class="viewer-stats">
          ${keeper ? smallViewerStat("Uso", "1x") : `
            ${smallViewerStat("Vital", stats.vitality)}
            ${smallViewerStat("Chute", stats.shot)}
            ${smallViewerStat("Drible", stats.dribble)}
            ${smallViewerStat("Vel", stats.speed)}
          `}
          ${monster.shirtNumber ? smallViewerStat("Camisa", monster.shirtNumber) : ""}
          ${smallViewerStat("Custo", monster.cost)}
        </div>
        <p>${keeper ? "Nao entra no campo." : monster.role}.${abilityText ? ` ${abilityText}` : ""} ${ownedText}.</p>
      </div>
    </section>
  `;
  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  setupTazzoViewer3d(viewer);
  progressTutorial("inspect");
}

function flipTazzoViewer(flipButton) {
  const stage = flipButton.closest("[data-viewer-tilt]");
  if (!stage) return;
  const isBack = stage.classList.toggle("is-back");
  flipButton.textContent = isBack ? "<" : ">";
  flipButton.setAttribute("aria-label", isBack ? "Ver frente" : "Ver verso");
}

function setupTazzoViewer3d(viewer) {
  const stage = viewer.querySelector("[data-viewer-tilt]");
  if (!stage) return;
  const flipButton = stage.querySelector("[data-flip-tazzo-viewer]");
  const holoArt = stage.querySelector("[data-holo-art]");
  const isViewerControl = (event) => Boolean(event.target.closest("[data-flip-tazzo-viewer], [data-close-tazzo-viewer]"));
  const updateTilt = (event) => {
    if (isViewerControl(event)) return;
    const rect = stage.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    stage.style.setProperty("--tilt-x", `${(0.5 - y) * 18}deg`);
    stage.style.setProperty("--tilt-y", `${(x - 0.5) * 18}deg`);
    stage.style.setProperty("--shine-x", `${x * 100}%`);
    stage.style.setProperty("--shine-y", `${y * 100}%`);
    if (holoArt) updateHolographicArt(holoArt, x, y, 0);
  };
  const resetTilt = () => {
    stage.classList.remove("is-moving");
    stage.style.setProperty("--tilt-x", "0deg");
    stage.style.setProperty("--tilt-y", "0deg");
    stage.style.setProperty("--shine-x", "50%");
    stage.style.setProperty("--shine-y", "42%");
    if (holoArt) resetHolographicArt(holoArt);
  };

  if (flipButton) {
    ["pointerdown", "pointerup", "pointermove"].forEach((type) => {
      flipButton.addEventListener(type, (event) => event.stopPropagation());
    });
    flipButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      flipTazzoViewer(flipButton);
    });
  }

  stage.addEventListener("pointerdown", (event) => {
    if (isViewerControl(event)) return;
    stage.classList.add("is-moving");
    stage.setPointerCapture?.(event.pointerId);
    updateTilt(event);
  });
  stage.addEventListener("pointermove", updateTilt);
  stage.addEventListener("pointerup", (event) => {
    if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    resetTilt();
  });
  stage.addEventListener("pointerleave", resetTilt);
  stage.addEventListener("pointercancel", resetTilt);
}

function closeTazzoViewer() {
  const viewer = document.getElementById("tazzo-viewer");
  if (!viewer) return;
  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  viewer.innerHTML = "";
}

function smallViewerStat(label, value) {
  return `
    <div>
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `;
}

function monsterStatsLine(monster, stats = monsterStats(monster)) {
  if (isGoalkeeper(monster)) {
    return `
      <span>Habilidade</span>
      <span>${keeperAbilityText(monster).replace("Habilidade: ", "")}</span>
    `;
  }

  return `
    <span>Vital ${stats.vitality}</span>
    <span>Chute ${stats.shot}</span>
    <span>Drible ${stats.dribble}</span>
    <span>Vel ${stats.speed}</span>
  `;
}

function handleBattleSetupClick(event) {
  const modeButton = event.target.closest("button[data-setup-mode]");
  const opponentButton = event.target.closest("button[data-setup-opponent]");
  const formationButton = event.target.closest("button[data-setup-formation]");
  const slotButton = event.target.closest("button[data-setup-slot]");
  const cellButton = event.target.closest("button[data-setup-cell]");
  const startButton = event.target.closest("button[data-start-battle]");

  if (slotButton) {
    state.battleSetup.placementSlot = Number(slotButton.dataset.setupSlot);
    renderBattleSetup();
    return;
  }

  if (cellButton && !cellButton.disabled) {
    placeSetupSlot(Number(cellButton.dataset.x), Number(cellButton.dataset.y));
    return;
  }

  if (modeButton) {
    state.battleSetup.mode = modeButton.dataset.setupMode;
    state.battleSetup.opponent = battleOpponentOptions(state.battleSetup.mode)[0]?.id || "random";
    renderBattleSetup();
    return;
  }

  if (opponentButton) {
    state.battleSetup.opponent = opponentButton.dataset.setupOpponent;
    renderBattleSetup();
    return;
  }

  if (formationButton) {
    state.battleSetup.formation = formationButton.dataset.setupFormation;
    state.battleSetup.positions = formationPositions(state.battleSetup.formation);
    progressTutorial("position");
    renderBattleSetup();
    return;
  }

  if (startButton && !startButton.disabled) {
    startConfiguredBattle();
  }
}

function normalizeBattleSetup() {
  if (!BATTLE_MODES[state.battleSetup.mode] || state.battleSetup.mode === "tournament") {
    state.battleSetup.mode = "casual";
  }
  const options = battleOpponentOptions(state.battleSetup.mode);
  if (!options.some((option) => option.id === state.battleSetup.opponent)) {
    state.battleSetup.opponent = options[0]?.id || "random";
  }
  if (!BATTLE_FORMATIONS[state.battleSetup.formation]) {
    state.battleSetup.formation = "center";
  }
  normalizeBattleSetupPositions();
}

function battleOpponentOptions(mode) {
  if (mode === "friend") {
    return FRIENDS.map((friend) => ({
      id: `friend:${friend.id}`,
      name: friend.name,
      meta: friend.rank,
      team: friend.team,
      goalkeeper: friend.goalkeeper
    }));
  }
  return BATTLE_OPPONENTS.filter((opponent) => opponent.mode === mode);
}

function selectedBattleOpponent() {
  normalizeBattleSetup();
  return battleOpponentOptions(state.battleSetup.mode).find((option) => option.id === state.battleSetup.opponent) || battleOpponentOptions("casual")[0];
}

function formationPositions(formationId) {
  const formation = BATTLE_FORMATIONS[formationId] || BATTLE_FORMATIONS.center;
  return formation.positions.map((pos) => ({ ...pos }));
}

function setupSlotIndex() {
  const index = Number(state.battleSetup.placementSlot);
  return Number.isInteger(index) && index >= 0 && index < state.save.team.length ? index : 0;
}

function isPlayerSetupCell(x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x <= 1 && y >= 0 && y < 5;
}

function isValidSetupPosition(pos, used = new Set()) {
  if (!pos) return false;
  const x = Number(pos.x);
  const y = Number(pos.y);
  const key = `${x},${y}`;
  return isPlayerSetupCell(x, y) && !used.has(key);
}

function firstOpenSetupCell(used) {
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 2; x += 1) {
      const key = `${x},${y}`;
      if (!used.has(key)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function normalizeBattleSetupPositions() {
  const fallback = formationPositions(state.battleSetup.formation);
  const current = Array.isArray(state.battleSetup.positions) ? state.battleSetup.positions : [];
  const used = new Set();
  const positions = state.save.team.map((_, index) => {
    const candidates = [current[index], fallback[index], firstOpenSetupCell(used)];
    const pos = candidates.find((candidate) => isValidSetupPosition(candidate, used));
    const normalized = { x: Number(pos.x), y: Number(pos.y) };
    used.add(`${normalized.x},${normalized.y}`);
    return normalized;
  });
  state.battleSetup.positions = positions;
  state.battleSetup.placementSlot = setupSlotIndex();
}

function setupPlacementStatus() {
  normalizeBattleSetup();
  const used = new Set();
  const valid = state.battleSetup.positions.length === state.save.team.length && state.battleSetup.positions.every((pos) => {
    const ok = isValidSetupPosition(pos, used);
    if (ok) used.add(`${pos.x},${pos.y}`);
    return ok;
  });
  return {
    valid,
    text: valid ? "3 tazzos posicionados" : "Escolha 3 casas na zona inicial"
  };
}

function setupCellOccupantSlot(positions, x, y) {
  return positions.findIndex((pos) => pos.x === x && pos.y === y);
}

function matchingSetupFormation(positions = state.battleSetup.positions) {
  return Object.keys(BATTLE_FORMATIONS).find((id) => {
    const preset = formationPositions(id);
    return preset.every((pos, index) => positions[index]?.x === pos.x && positions[index]?.y === pos.y);
  }) || "";
}

function setupFormationLabel(positions = state.battleSetup.positions) {
  const formationId = matchingSetupFormation(positions);
  return formationId ? `Formacao ${BATTLE_FORMATIONS[formationId].name}` : "Posicionamento manual";
}

function placeSetupSlot(x, y) {
  if (!isPlayerSetupCell(x, y)) return;
  normalizeBattleSetup();
  const positions = state.battleSetup.positions.map((pos) => ({ ...pos }));
  const selected = setupSlotIndex();
  const occupied = setupCellOccupantSlot(positions, x, y);
  if (occupied >= 0) {
    state.battleSetup.placementSlot = occupied;
    renderBattleSetup();
    return;
  }

  positions[selected] = { x, y };
  state.battleSetup.positions = positions;
  const matchingFormation = matchingSetupFormation(positions);
  if (matchingFormation) state.battleSetup.formation = matchingFormation;
  progressTutorial("position");
  renderBattleSetup();
}

function activeTournamentBattle() {
  return Boolean(state.pendingTournament || (state.battle && state.battle.tournamentId && !state.battle.over));
}

function activeRankedBattle() {
  return Boolean(state.pendingRanked || (state.battle && state.battle.ranked && !state.battle.over));
}

function activeLockedBattle() {
  return activeTournamentBattle() || activeRankedBattle();
}

function startConfiguredBattle() {
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  normalizeBattleSetup();
  const mode = state.battleSetup.mode;
  const modeData = BATTLE_MODES[mode];
  const opponent = selectedBattleOpponent();
  state.pendingTournament = null;
  newBattle({
    enemyTeam: opponent.team,
    enemyGoalkeeper: opponent.goalkeeper,
    enemyName: opponent.name,
    mode,
    matchTime: modeData.matchTime,
    actionTime: modeData.actionTime,
    playerPositions: selectedFormationPositions(),
    logIntro: `${modeData.name}: batalha contra ${opponent.name} comecou.`
  });
}

function selectedFormationPositions() {
  normalizeBattleSetup();
  return state.battleSetup.positions.map((pos) => ({ ...pos }));
}

async function handleResultAction(action) {
  if (action === "battle-menu") {
    state.battleSceneOpen = false;
    switchTab("battle");
    return;
  }

  if (action === "rematch") {
    if (state.battle?.result?.ranked) {
      runRankedMatch();
      return;
    }
    startConfiguredBattle();
    return;
  }

  if (action === "tournaments") {
    switchTab("competitive");
    return;
  }

  if (action === "online") {
    switchTab("online");
    refreshOnlineLobbies({ force: true });
    return;
  }

  if (action === "online-rematch") {
    await resetOnlineLobbyMatch({ openWhenReady: true });
    return;
  }

  if (action === "online-leave") {
    await leaveOnlineLobby({ switchToOnline: true });
    return;
  }

  if (action === "packs") {
    switchTab("packs");
    return;
  }

  if (action === "collection") {
    switchTab("collection");
  }
}

function handleTutorialControls(event) {
  const resultButton = event.target.closest("button[data-tutorial-result-continue]");
  if (resultButton) {
    confirmTutorialResult();
    return;
  }

  const rewardButton = event.target.closest("button[data-tutorial-reward]");
  if (rewardButton) {
    if (!rewardButton.disabled) claimTutorialReward();
    return;
  }

  const actionButton = event.target.closest("button[data-tutorial-action]");
  if (!actionButton || actionButton.disabled) return;
  handleTutorialAction(actionButton.dataset.tutorialAction);
}

function handleTutorialAction(stepId) {
  if (stepId === "pack") {
    switchTab("packs");
    return;
  }

  if (stepId === "collection" || stepId === "inspect" || stepId === "team") {
    switchTab("collection");
    return;
  }

  if (stepId === "position") {
    state.battleSceneOpen = false;
    switchTab("battle");
    return;
  }

  if (stepId === "trade") {
    switchTab("trade");
    return;
  }

  if (stepId === "ranked" || stepId === "tournament") {
    switchTab("competitive");
    return;
  }

  if (isTutorialScenarioStep(stepId)) {
    startTutorialScenario(stepId);
    return;
  }

  if (stepId === "win") {
    startConfiguredBattle();
  }
}

function isTutorialScenarioStep(stepId) {
  return Boolean(tutorialScenarioFor(stepId));
}

function currentTutorialAllowedAction() {
  const tutorial = state.battle?.tutorial;
  if (!tutorial || tutorial.completed) return "";
  return tutorial.allowedAction || "";
}

function tutorialScenarioFor(stepId) {
  const base = {
    playerTeam: ["vinicius-jr-tazzo", "bruno-guimaraes-tazzo", "marquinhos-tazzo"],
    enemyTeam: ["bremer-tazzo", "joao-gomes-tazzo", "eder-militao-tazzo"],
    playerGoalkeeper: "goleiro-brasil-alison",
    enemyGoalkeeper: "goleiro-brasil-alison",
    playerPositions: [{ x: 1, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
    enemyPositions: [{ x: 6, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
  };

  const scenarios = {
    shot: {
      allowedAction: "shot",
      title: "Treino de Chute",
      playerPositions: [{ x: 1, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 4, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    dribble: {
      allowedAction: "dribble",
      title: "Treino de Drible",
      playerPositions: [{ x: 2, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 3, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    pressure: {
      allowedAction: "pressure",
      title: "Treino de Pressao",
      playerPositions: [{ x: 2, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 3, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    collision: {
      allowedAction: "pressure",
      title: "Treino de Colisao",
      playerPositions: [{ x: 5, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 6, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    retreat: {
      allowedAction: "retreat",
      title: "Treino de Recuo",
      playerPositions: [{ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 3, y: 1 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    move: {
      allowedAction: "move",
      title: "Treino de Movimento",
      playerPositions: [{ x: 1, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 6, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    swap: {
      allowedAction: "swap",
      title: "Treino de Troca",
      playerPositions: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 6, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    keeper: {
      allowedAction: "keeper",
      title: "Treino de Goleiro",
      playerPositions: [{ x: 2, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 6, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    },
    pass: {
      allowedAction: "pass",
      title: "Treino de Passar",
      playerPositions: [{ x: 2, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 4 }],
      enemyPositions: [{ x: 6, y: 2 }, { x: 6, y: 0 }, { x: 6, y: 4 }]
    }
  };

  return scenarios[stepId] ? { ...base, ...scenarios[stepId] } : null;
}

function startTutorialScenario(stepId) {
  const scenario = tutorialScenarioFor(stepId);
  if (!scenario) return;

  state.pendingTournament = null;
  state.pendingRanked = null;
  newBattle({
    playerTeam: scenario.playerTeam,
    enemyTeam: scenario.enemyTeam,
    playerGoalkeeper: scenario.playerGoalkeeper,
    enemyGoalkeeper: scenario.enemyGoalkeeper,
    enemyName: "Tutor Tazzo",
    mode: "training",
    matchTime: 999,
    actionTime: 999,
    playerPositions: scenario.playerPositions,
    enemyPositions: scenario.enemyPositions,
    logIntro: `${scenario.title}: selecione ${actionName(scenario.allowedAction)} e faca a jogada destacada para concluir.`,
    tutorial: {
      stepId,
      allowedAction: scenario.allowedAction,
      title: scenario.title
    }
  });

  state.battle.status = `Tutorial: selecione ${actionName(scenario.allowedAction)}.`;
  state.battleSceneOpen = true;
  switchTab("battle");
}

function completeTutorialScenario(action, details = {}) {
  const tutorial = state.battle?.tutorial;
  if (!tutorial || tutorial.completed || tutorial.allowedAction !== action) return false;
  if (tutorial.stepId === "collision" && !details.collision) return false;

  tutorial.completed = true;
  state.battle.pendingAction = null;
  state.battle.validTargets = [];
  state.battle.status = "Tutorial: veja o resultado no campo e continue pelo popup.";
  progressTutorial(tutorial.stepId);
  renderBattle();
  return true;
}

function renderAll() {
  applySelectedCosmetic();
  applyTutorialState();
  renderWallet();
  renderBattle();
  renderPacks();
  renderCollection();
  renderEdit();
  renderFriends();
  renderTrade();
  renderOnline();
  renderCompetitive();
  renderShop();
  renderTutorial();
  renderMissions();
  renderEntryGate();
  renderTutorialCoach();
  renderTutorialPopover();
  renderTutorialResultPopup();
}

function applySelectedCosmetic() {
  const selected = state.save.selectedCosmetic;
  const isOwned = selected && state.save.cosmetics[selected];
  const exists = SHOP_ITEMS.some((item) => item.id === selected);
  if (isOwned && exists) {
    document.body.dataset.cosmetic = selected;
    return;
  }
  delete document.body.dataset.cosmetic;
}

function completedTutorialCount() {
  return TUTORIAL_STEPS.filter((step) => state.save.tutorial[step.id]).length;
}

function currentTutorialStep() {
  return TUTORIAL_STEPS.find((step) => !state.save.tutorial[step.id]) || null;
}

function applyTutorialState() {
  const current = currentTutorialStep();
  if (current) {
    document.body.dataset.tutorialStep = current.id;
    return;
  }
  delete document.body.dataset.tutorialStep;
}

function tutorialStepDetails(step) {
  if (!step) return "";
  const steps = Array.isArray(step.steps) && step.steps.length
    ? `<ol class="tutorial-do-list">${step.steps.map((item) => `<li>${item}</li>`).join("")}</ol>`
    : "";
  const tip = step.tip ? `<div class="tutorial-note"><strong>Dica</strong><span>${step.tip}</span></div>` : "";
  const completes = step.completes ? `<div class="tutorial-note"><strong>Conclui quando</strong><span>${step.completes}</span></div>` : "";
  return `
    <div class="tutorial-detail-block">
      ${steps}
      <div class="tutorial-note-grid">
        ${tip}
        ${completes}
      </div>
    </div>
  `;
}

function tutorialQuickLine(step) {
  if (!step) return "";
  return Array.isArray(step.steps) && step.steps.length ? step.steps[0] : step.description;
}

function isCurrentTutorialStep(stepId) {
  return currentTutorialStep()?.id === stepId && !state.tutorialResult;
}

function tutorialResultText(stepId) {
  const fallbackStep = TUTORIAL_STEPS.find((step) => step.id === stepId);
  const messages = {
    pack: {
      title: "Pacotinho aberto",
      body: "Voce comprou um pacote, recebeu tazzos e repetidos viraram fragmentos. Esse e o loop basico da colecao."
    },
    collection: {
      title: "Album aberto",
      body: "Aqui voce ve obtidos, faltantes, raridades e copias. O album tambem e onde o time ganha forma."
    },
    inspect: {
      title: "Atributos conferidos",
      body: "O popup mostra funcao, raridade e atributos. Use esses numeros para decidir quem joga, troca ou melhora."
    },
    team: {
      title: "Time ajustado",
      body: "Seu trio de campo e o goleiro ativo definem como voce entra na arena. Goleiro nao ocupa casa, mas traz uma habilidade unica."
    },
    position: {
      title: "Formacao preparada",
      body: "A posicao inicial muda linhas de chute, contato para drible e seguranca contra empurroes."
    },
    shot: {
      title: "Chute aplicado",
      body: "O chute avancou em linha reta e causou metade do atributo de Chute como dano. E otimo para alcancar alvos distantes."
    },
    dribble: {
      title: "Drible aplicado",
      body: "O drible funciona adjacente e usa o valor cheio do atributo. Quando voce encosta no alvo certo, ele bate forte."
    },
    pressure: {
      title: "Pressao feita",
      body: "Pressionar empurra sem dano direto. A jogada abre espaco e prepara borda ou colisao."
    },
    collision: {
      title: "Colisao criada",
      body: "O empurrao levou o alvo contra borda ou outro tazzo. Colisoes adicionam dano e mudam o controle do campo."
    },
    retreat: {
      title: "Recuo seguro",
      body: "Recuar tirou seu tazzo da marcacao. Use quando ficar colado em um rival perigoso."
    },
    move: {
      title: "Movimento feito",
      body: "Mover reposiciona o tazzo para preparar linha de chute, contato de drible ou bonus de zona."
    },
    swap: {
      title: "Troca feita",
      body: "Trocar inverte duas posicoes aliadas. E uma forma rapida de proteger um tazzo ou abrir uma jogada."
    },
    keeper: {
      title: "Goleiro usado",
      body: "A habilidade do goleiro mudou o ritmo da partida. Cada goleiro tem um efeito unico e normalmente usa uma vez por batalha."
    },
    pass: {
      title: "Turno passado",
      body: "Passar encerra a acao sem se expor. Serve quando mover pioraria sua posicao."
    },
    win: {
      title: "Batalha vencida",
      body: "Voce venceu ao derrubar o rival ou superar os criterios do tempo. Vivos, vitalidade e dano decidem partidas apertadas."
    },
    trade: {
      title: "Troca concluida",
      body: "Um repetido saiu da colecao e um tazzo faltante entrou. Trocas aceleram bastante o album."
    },
    tournament: {
      title: "Torneio iniciado",
      body: "O torneio criou uma batalha com entrada e premio. Ganhar a partida entrega a recompensa da chave."
    },
    ranked: {
      title: "Ranqueada iniciada",
      body: "A ranqueada abriu uma batalha competitiva. O resultado mexe nos trofeus e ajuda a subir de divisao."
    }
  };
  return messages[stepId] || {
    title: fallbackStep?.title || "Passo concluido",
    body: fallbackStep?.tip || fallbackStep?.description || "Voce concluiu esta parte do tutorial."
  };
}

function queueTutorialResult(stepId) {
  const current = currentTutorialStep();
  if (!current || current.id !== stepId || state.save.tutorial?.[stepId]) return false;
  if (state.tutorialResult?.stepId === stepId) return true;
  state.tutorialResult = {
    stepId,
    title: tutorialResultText(stepId).title,
    body: tutorialResultText(stepId).body
  };
  renderTutorialResultPopup();
  return true;
}

function confirmTutorialResult() {
  const result = state.tutorialResult;
  if (!result) return;
  state.tutorialResult = null;
  if (state.save.tutorial && !state.save.tutorial[result.stepId]) {
    state.save.tutorial[result.stepId] = true;
  }
  if (state.battle?.tutorial?.stepId === result.stepId || state.battle?.tutorialCompetitiveStep === result.stepId) {
    clearTurnTimer();
    clearMatchTimer();
    if (state.battle?.tutorialCompetitiveStep === result.stepId) {
      state.pendingTournament = null;
      state.pendingRanked = null;
    }
    state.battle = null;
    state.battleSceneOpen = false;
    switchTab("battle");
    saveGame();
    renderTutorialResultPopup();
    return;
  }
  saveGame();
  renderAll();
}

function renderTutorialResultPopup() {
  const popup = document.getElementById("tutorial-result-popup");
  if (!popup) return;
  const result = state.tutorialResult;
  if (!result) {
    popup.hidden = true;
    popup.innerHTML = "";
    popup.dataset.renderKey = "";
    return;
  }
  const doneAfterConfirm = completedTutorialCount() + 1;
  const renderKey = `tutorial:${result.stepId}:${result.title}:${result.body}:${doneAfterConfirm}`;
  if (!popup.hidden && popup.dataset.renderKey === renderKey) return;
  popup.hidden = false;
  popup.dataset.renderKey = renderKey;
  popup.innerHTML = `
    <div class="tutorial-result-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-result-title">
      <span class="eyebrow">Resultado do tutorial</span>
      <h2 id="tutorial-result-title">${result.title}</h2>
      <p>${result.body}</p>
      <div class="tutorial-result-meta">
        <span class="chip">${doneAfterConfirm}/${TUTORIAL_STEPS.length}</span>
        <span>O proximo passo so aparece depois de continuar.</span>
      </div>
      <button type="button" data-tutorial-result-continue>Continuar</button>
    </div>
  `;
}

function renderWallet() {
  const visibleMonsters = visibleCollectionMonsters();
  const owned = visibleMonsters.filter((monster) => state.save.collection[monster.id] > 0).length;
  document.getElementById("wallet-merreis").textContent = formatNumber(state.save.merreis);
  document.getElementById("wallet-fragments").textContent = formatNumber(state.save.fragments);
  document.getElementById("wallet-album").textContent = `${owned}/${visibleMonsters.length}`;
  updateServerStatus();
  updateProfileStatus();
}

function renderPackPity() {
  const pity = state.save.packPity;
  const legendaryCount = Math.min(pity.sinceLegendaryPlus, LEGENDARY_BOOST_MAX_TAZZOS);
  const boostMultiplier = legendaryBoostMultiplier(pity.sinceLegendaryPlus);
  const boostReady = boostMultiplier > 1;
  const boostMaxReady = boostMultiplier >= LEGENDARY_BOOST_MAX_MULTIPLIER;
  const nextGoal = boostReady ? LEGENDARY_BOOST_MAX_TAZZOS : LEGENDARY_BOOST_TAZZOS;
  const nextBoost = boostReady ? LEGENDARY_BOOST_MAX_MULTIPLIER : LEGENDARY_BOOST_MULTIPLIER;
  const remaining = Math.max(0, nextGoal - pity.sinceLegendaryPlus);
  const headline = boostMaxReady
    ? "Chance 4x ativa para Lendario+"
    : boostReady
    ? `${remaining} tazzo(s) para boost 4x`
    : `${remaining} tazzo(s) para boost ${nextBoost}x`;

  return `
    <article class="pack-pity-card${boostReady ? " is-ready" : ""}${boostMaxReady ? " is-max" : ""}">
      <div>
        <span class="eyebrow">Boost lendario</span>
        <strong>${headline}</strong>
        <small>${legendaryCount}/${LEGENDARY_BOOST_MAX_TAZZOS} sem Lendario+${boostReady && !boostMaxReady ? " - 2x ativo" : ""}</small>
      </div>
      <div class="progress" aria-label="Progresso para boost lendario">
        <span style="width:${Math.round((legendaryCount / LEGENDARY_BOOST_MAX_TAZZOS) * 100)}%"></span>
      </div>
    </article>
  `;
}

function renderPacks() {
  const grid = document.getElementById("pack-grid");
  const packBusy = isPackBusy();
  const canRevealAll = !state.packOpening && state.packReveal.some((pull) => !pull.revealed && !pull.flipping);
  const pityPanel = document.getElementById("pack-pity");
  if (pityPanel) pityPanel.innerHTML = renderPackPity();
  document.getElementById("reveal-all-button").disabled = !canRevealAll;
  const gridKey = `packs:${packBusy}:${state.save.merreis}:${PACKS.length}:${state.save.packPity.sinceLegendaryPlus}`;
  if (grid.dataset.renderKey !== gridKey) {
    grid.dataset.renderKey = gridKey;
    grid.innerHTML = PACKS.map((pack) => `
      <article class="pack-card${packBusy ? " is-disabled" : ""}">
        <img class="pack-card-art" src="${pack.image}" alt="Pacote ${pack.name}">
        <h2>${pack.name}</h2>
        <p>${pack.note}</p>
        <div class="pack-meta">
          <span class="chip">${pack.cards}x</span>
          <span class="chip">${formatNumber(pack.cost)} Merreis</span>
        </div>
        <button type="button" data-pack="${pack.id}" ${packBusy || state.save.merreis < pack.cost ? "disabled" : ""}>Abrir</button>
      </article>
    `).join("");

    grid.querySelectorAll("button[data-pack]").forEach((button) => {
      button.addEventListener("click", () => openPack(button.dataset.pack));
    });
  }

  const results = document.getElementById("pack-results");
  results.classList.remove("has-reveal-shortcut", "is-results-popup");
  if (state.packOpening) {
    const openingKey = `opening:${state.packOpening.packId}:${state.packOpening.packName}:${state.packReveal.length}`;
    if (results.dataset.renderKey !== openingKey) {
      results.dataset.renderKey = openingKey;
      results.innerHTML = renderPackOpening();
      results.querySelectorAll("[data-pack-stage='tear']").forEach((button) => {
        button.addEventListener("click", tearOpenPack);
      });
      results.querySelectorAll("[data-pack-stage='cards']").forEach((button) => {
        button.addEventListener("click", showPackCards);
      });
    }
    return;
  }

  if (!state.packReveal.length) {
    if (results.dataset.renderKey !== "empty") {
      results.dataset.renderKey = "empty";
      results.innerHTML = "";
    }
    return;
  }

  const canRevealAllNow = state.packReveal.some((pull) => !pull.revealed && !pull.flipping);
  const revealedCount = state.packReveal.filter((pull) => pull.revealed).length;
  const resultsKey = packResultsRenderKey();
  results.classList.toggle("has-reveal-shortcut", canRevealAllNow);
  results.classList.add("is-results-popup");
  if (results.dataset.renderKey === resultsKey) return;
  results.dataset.renderKey = resultsKey;
  const revealShortcut = canRevealAllNow
    ? `<button class="pack-reveal-all-corner" type="button" data-reveal-all-pulls aria-label="Virar todos os tazzos"></button>`
    : "";
  const pullsHtml = state.packReveal.map((pull, index) => renderPullCard(pull, index)).join("");

  results.innerHTML = `
    <section class="pack-results-overlay" role="dialog" aria-modal="true" aria-labelledby="pack-results-title">
      <div class="pack-results-dialog">
        <div class="pack-results-head">
          <div>
            <span class="eyebrow">Pacotinho aberto</span>
            <h2 id="pack-results-title">Tazzos encontrados</h2>
          </div>
          <div class="pack-results-actions">
            <span class="chip" data-pack-results-count>${revealedCount}/${state.packReveal.length}</span>
            <button class="viewer-close" type="button" data-close-pack-results>Fechar</button>
          </div>
        </div>
        <div class="pack-results-grid">
          ${revealShortcut}
          ${pullsHtml}
        </div>
      </div>
    </section>
  `;
}

function rarityAuraClass(rarity) {
  return {
    Epico: "rarity-epico",
    Lendario: "rarity-lendario",
    Mistico: "rarity-mistico",
    "Mistico Secreto": "rarity-mistico-secreto"
  }[rarity] || "";
}

function packResultsRenderKey() {
  if (!state.packReveal.length) return "empty";
  return `results:${state.packReveal.map((pull) => [
    pull.monsterId,
    pull.isNew ? 1 : 0,
    pull.fragments,
    pull.revealed ? 1 : 0,
    pull.flipping ? 1 : 0,
    pull.justRevealed ? 1 : 0
  ].join(":")).join("|")}`;
}

function renderPullCard(pull, index) {
  const monster = MONSTER_BY_ID[pull.monsterId];
  if (!pull.revealed) {
    const auraClass = rarityAuraClass(monster.rarity);
    const flippingClass = pull.flipping ? " is-flipping" : "";
    return `
      <button class="pull-card is-hidden ${auraClass}${flippingClass}" type="button" data-reveal="${index}" data-pull-index="${index}">
        <span class="pull-art-frame">
          <img class="pull-back-image" src="${monsterBackImage(monster)}" alt="Verso do tazzo">
        </span>
        <span class="pull-hidden-spacer" aria-hidden="true">?</span>
      </button>
    `;
  }

  const rare = ["Raro", "Epico", "Lendario", "Mistico", "Mistico Secreto"].includes(monster.rarity) ? " is-rare" : "";
  const flippedIn = pull.justRevealed ? " is-flipped-in" : "";
  const premiumReveal = pull.justRevealed && isAtLeastRarity(monster.rarity, "Epico") ? ` is-premium-reveal ${rarityAuraClass(monster.rarity)}` : "";
  const revealBadge = premiumReveal ? `<span class="pull-reveal-badge">${premiumRevealLabel(monster.rarity)}</span>` : "";
  const label = pull.isNew ? "Novo" : `+${pull.fragments} frag`;
  const stats = monsterStats(monster);
  return `
    <button class="pull-card${rare}${flippedIn}${premiumReveal}" type="button" data-monster-view="${monster.id}" data-pull-index="${index}">
      ${revealBadge}
      <span class="pull-art-frame">
        ${renderMonsterArt(monster, "pull-front-image")}
      </span>
      <span class="pull-info">
        <h3>${monster.name}</h3>
        <span class="stat-line">
          ${typeChips(monster)}
          <span class="rarity-chip">${monster.rarity}</span>
          ${holographicChip(monster)}
        </span>
        <span class="stat-line">
          ${monsterStatsLine(monster, stats)}
        </span>
        <span class="chip">${label}</span>
      </span>
    </button>
  `;
}

function handlePackResultsClick(event) {
  const revealAllButton = event.target.closest("[data-reveal-all-pulls]");
  if (revealAllButton) {
    revealAllPulls();
    return;
  }

  const closeButton = event.target.closest("[data-close-pack-results]");
  if (closeButton) {
    closePackResults();
    return;
  }

  const card = event.target.closest("[data-reveal]");
  if (card) revealPull(Number(card.dataset.reveal));
}

function revealPull(index) {
  if (state.packOpening) return;
  revealPullBatch([index]);
}

function revealPullBatch(indexes) {
  const readyIndexes = indexes.filter((index) => {
    const pull = state.packReveal[index];
    return pull && !pull.revealed && !pull.flipping;
  });
  if (!readyIndexes.length) return;

  readyIndexes.forEach((index) => {
    state.packReveal[index].flipping = true;
  });
  updatePullCards(readyIndexes);
  setTimeout(() => {
    readyIndexes.forEach((index) => {
      const current = state.packReveal[index];
      if (!current) return;
      current.flipping = false;
      current.revealed = true;
      current.justRevealed = true;
    });
    updatePullCards(readyIndexes);
    triggerPremiumRevealEffect(readyIndexes);
    setTimeout(() => {
      readyIndexes.forEach((index) => {
        const revealed = state.packReveal[index];
        if (!revealed) return;
        revealed.justRevealed = false;
      });
      updatePullCards(readyIndexes);
    }, 360);
  }, 260);
}

function premiumRevealLabel(rarity) {
  return {
    Epico: "Epico!",
    Lendario: "Lendario!",
    Mistico: "Mistico!",
    "Mistico Secreto": "Mistico secreto!"
  }[rarity] || "Raro!";
}

function triggerPremiumRevealEffect(indexes) {
  const premiumPulls = indexes
    .map((index) => state.packReveal[index])
    .map((pull) => MONSTER_BY_ID[pull?.monsterId])
    .filter((monster) => monster && isAtLeastRarity(monster.rarity, "Epico"));
  if (!premiumPulls.length) return;

  const best = premiumPulls.sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity))[0];
  const overlay = document.querySelector(".pack-results-overlay");
  if (!overlay) return;

  overlay.querySelectorAll(".rare-reveal-burst").forEach((effect) => effect.remove());
  const burst = document.createElement("div");
  burst.className = `rare-reveal-burst ${rarityAuraClass(best.rarity)}`;
  burst.setAttribute("aria-hidden", "true");
  burst.innerHTML = `
    <span class="rare-reveal-ring"></span>
    <strong>${premiumRevealLabel(best.rarity)}</strong>
    <span>${best.name}</span>
  `;
  burst.append(createSnackExplosion());
  overlay.append(burst);
  setTimeout(() => burst.remove(), 3000);
}

function createSnackExplosion() {
  const field = document.createElement("div");
  field.className = "snack-explosion";
  const count = 28;
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.46;
    const distance = 36 + Math.random() * 42;
    const chip = document.createElement("img");
    chip.src = "assets/salgadinho.png";
    chip.alt = "";
    chip.style.setProperty("--tx", `${Math.cos(angle) * distance}vw`);
    chip.style.setProperty("--ty", `${Math.sin(angle) * distance}vh`);
    chip.style.setProperty("--rot", `${Math.round((Math.random() * 2 - 1) * 680)}deg`);
    chip.style.setProperty("--scale", (0.28 + Math.random() * 0.42).toFixed(2));
    chip.style.setProperty("--delay", `${Math.round(Math.random() * 240)}ms`);
    chip.style.setProperty("--dur", `${1800 + Math.round(Math.random() * 840)}ms`);
    field.append(chip);
  }
  return field;
}

function updatePullCards(indexes) {
  const results = document.getElementById("pack-results");
  if (!results?.querySelector(".pack-results-grid")) {
    renderPacks();
    return;
  }

  indexes.forEach((index) => {
    const pull = state.packReveal[index];
    const card = results.querySelector(`[data-pull-index="${index}"]`);
    if (!pull || !card) return;
    card.outerHTML = renderPullCard(pull, index);
  });
  updatePackResultsChrome();
}

function updatePackResultsChrome() {
  const results = document.getElementById("pack-results");
  const canRevealAllNow = state.packReveal.some((pull) => !pull.revealed && !pull.flipping);
  const revealedCount = state.packReveal.filter((pull) => pull.revealed).length;
  document.getElementById("reveal-all-button").disabled = !canRevealAllNow;
  results.classList.toggle("has-reveal-shortcut", canRevealAllNow);
  results.dataset.renderKey = packResultsRenderKey();
  const counter = results.querySelector("[data-pack-results-count]");
  if (counter) counter.textContent = `${revealedCount}/${state.packReveal.length}`;
  const closeButton = results.querySelector("[data-close-pack-results]");
  if (closeButton) closeButton.textContent = "Fechar";
  const shortcut = results.querySelector("[data-reveal-all-pulls]");
  if (shortcut) shortcut.hidden = !canRevealAllNow;
}

function renderPackOpening() {
  const opening = state.packOpening;
  const pack = PACKS.find((item) => item.id === opening.packId);
  const packImage = pack?.image || "assets/pack-simples.png";
  const packOpenImage = pack?.openImage || packImage;
  const snacks = Array.from({ length: Math.min(10, pack?.cards ? pack.cards + 4 : 7) }, (_, index) => `<span style="--delay:${index * 70}ms"></span>`).join("");

  return `
    <section class="pack-opening-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div class="pack-opening is-auto-opening">
        <div class="snack-pack has-image is-tearing" aria-label="Abrindo pacotinho ${opening.packName}">
          <img class="snack-pack-art snack-pack-art-closed" src="${packImage}" alt="Pacote ${opening.packName}">
          <img class="snack-pack-art snack-pack-art-open" src="${packOpenImage}" alt="Pacote ${opening.packName} aberto">
          <div class="snack-rain" aria-hidden="true">${snacks}</div>
        </div>
        <div class="opening-copy">
          <span class="eyebrow">Pacotinho comprado</span>
          <h2>Abrindo ${opening.packName}</h2>
          <p>${state.packReveal.length} disco(s) estao saindo da embalagem.</p>
          <div class="pack-opening-progress" aria-hidden="true"><span></span></div>
        </div>
      </div>
    </section>
  `;
}

function renderCollection() {
  document.querySelectorAll("#slot-picker button").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.slot) === state.selectedSlot);
  });

  const grid = document.getElementById("collection-grid");
  const monsters = visibleCollectionMonsters().filter(matchesCollectionFilters);
  grid.innerHTML = monsters.map((monster) => {
    const copies = state.save.collection[monster.id] || 0;
    const owned = copies > 0;
    const keeper = isGoalkeeper(monster);
    const inTeam = state.save.team.includes(monster.id);
    const activeGoalkeeper = state.save.goalkeeper === monster.id;
    const stats = monsterStats(monster);
    const level = keeper ? 0 : upgradeLevel(monster.id);
    const cost = keeper ? { fragments: 0, merreis: 0 } : upgradeCost(monster.id);
    const canUpgrade = !keeper && owned && level < 2 && state.save.fragments >= cost.fragments && state.save.merreis >= cost.merreis;
    const upgradeNote = keeper
      ? "Goleiro nao entra no campo: habilidade unica, 1 uso por partida."
      : level >= 2
      ? "Melhoria maxima: +20% em todos os stats."
      : `Melhoria +10% nos stats: ${formatNumber(cost.fragments)} fragmentos + ${formatNumber(cost.merreis)} Merreis. Nivel ${level}/2.`;
    const classes = ["monster-card"];
    if (!owned) classes.push("is-missing");
    if (inTeam || activeGoalkeeper) classes.push("is-team");

    return `
      <article class="${classes.join(" ")}">
        <span class="copy-badge">x${copies}</span>
        <button class="art-view-button" type="button" data-monster-view="${monster.id}">
          ${renderMonsterArt(monster, "monster-art", { loading: "lazy", revealHolographic: owned })}
        </button>
        <h3>#${String(monster.number).padStart(2, "0")} ${monster.name}</h3>
        <div class="stat-line">
          ${typeChips(monster)}
          <span class="rarity-chip">${monster.rarity}</span>
          ${holographicChip(monster)}
          ${level ? `<span class="rarity-chip">+${level}</span>` : ""}
          ${activeGoalkeeper ? `<span class="rarity-chip">Goleiro ativo</span>` : ""}
        </div>
        <div class="stat-line">
          ${monsterStatsLine(monster, stats)}
        </div>
        <p class="evolution-note">${owned ? upgradeNote : "Tazzo ainda nao obtido."}</p>
        <div class="card-actions">
          ${keeper
            ? `<button type="button" data-goalkeeper="${monster.id}" ${owned || activeGoalkeeper ? "" : "disabled"}>${activeGoalkeeper ? "Goleiro ativo" : "Usar como goleiro"}</button>`
            : `<button type="button" data-team="${monster.id}" ${owned ? "" : "disabled"}>${inTeam ? "No trio" : `Colocar no slot ${state.selectedSlot + 1}`}</button>
               <button class="secondary-button" type="button" data-upgrade="${monster.id}" ${canUpgrade ? "" : "disabled"}>${level >= 2 ? "Maximo" : "Melhorar"}</button>`}
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("button[data-team]").forEach((button) => {
    button.addEventListener("click", () => setTeamSlot(button.dataset.team));
  });

  grid.querySelectorAll("button[data-upgrade]").forEach((button) => {
    button.addEventListener("click", () => upgradeMonster(button.dataset.upgrade));
  });

  grid.querySelectorAll("button[data-goalkeeper]").forEach((button) => {
    button.addEventListener("click", () => setGoalkeeper(button.dataset.goalkeeper));
  });
}

function renderEdit() {
  const select = document.getElementById("edit-tazzo-select");
  const form = document.getElementById("edit-tazzo-form");
  const roster = document.getElementById("edit-roster");
  const preview = document.getElementById("edit-preview");
  if (!select || !form || !roster || !preview) return;

  if (!state.editSelectedId || (state.editSelectedId !== "__new__" && !MONSTER_BY_ID[state.editSelectedId])) {
    state.editSelectedId = MONSTERS[0]?.id || "__new__";
  }

  const editingNew = state.editSelectedId === "__new__";
  const monster = editingNew ? editDraft() : MONSTER_BY_ID[state.editSelectedId];
  const keeper = isGoalkeeper(monster);
  const fieldTypes = Object.keys(TYPES).filter((type) => type !== "Goleiro");
  const selectedFieldType = fieldTypes.find((type) => monster.types.includes(type)) || "Atacante";
  const stats = {
    vitality: Number(monster.vitality) || 0,
    shot: Number(monster.shot) || 0,
    dribble: Number(monster.dribble) || 0,
    speed: Number(monster.speed) || 0
  };

  select.innerHTML = `
    <option value="__new__" ${editingNew ? "selected" : ""}>Novo tazzo</option>
    ${sortedMonsters(MONSTERS).map((item) => `<option value="${item.id}" ${item.id === state.editSelectedId ? "selected" : ""}>#${String(item.number).padStart(2, "0")} ${item.name}</option>`).join("")}
  `;

  roster.innerHTML = sortedMonsters(MONSTERS).map((item) => `
    <button class="small-row ${item.id === state.editSelectedId ? "is-selected" : ""}" type="button" data-edit-roster="${item.id}">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <strong>${item.name}</strong>
        <span>${item.types.join("/")} - ${item.rarity}</span>
      </div>
      <span class="chip">${isGoalkeeper(item) ? "Hab" : item.cost}</span>
    </button>
  `).join("");

  form.dataset.editId = editingNew ? "" : monster.id;
  form.innerHTML = `
    <div class="edit-form-grid">
      <label>
        Nome
        <input id="edit-name" name="name" type="text" value="${monster.name}" maxlength="48" required>
      </label>
      <label>
        ID
        <input id="edit-id" name="id" type="text" value="${editingNew ? "automatico" : monster.id}" readonly>
      </label>
      <label>
        Imagem
        <select id="edit-image" name="image">
          ${ASSETS.map((asset, index) => `<option value="${asset}" ${asset === monster.image ? "selected" : ""}>Imagem ${index + 1}</option>`).join("")}
        </select>
      </label>
      <label>
        Verso
        <select id="edit-back-image" name="backImage">
          ${BACKS.map((asset, index) => `<option value="${asset}" ${asset === monsterBackImage(monster) ? "selected" : ""}>Verso ${index + 1}</option>`).join("")}
        </select>
      </label>
      <label>
        Funcao
        <select id="edit-type" name="type">
          ${fieldTypes.map((type) => `<option value="${type}" ${selectedFieldType === type ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </label>
      <label>
        Raridade
        <select id="edit-rarity" name="rarity">
          ${Object.keys(RARITIES).map((rarity) => `<option value="${rarity}" ${rarity === monster.rarity ? "selected" : ""}>${rarity}</option>`).join("")}
        </select>
      </label>
      <label>
        Papel
        <input id="edit-role" name="role" type="text" value="${monster.role}" maxlength="36">
      </label>
    </div>
    <label class="edit-toggle">
      <input id="edit-is-goalkeeper" name="isGoalkeeper" type="checkbox" ${keeper ? "checked" : ""}>
      <span>
        <strong>Goleiro</strong>
        <small>Quando ativo, nao entra no campo e usa apenas a habilidade abaixo.</small>
      </span>
    </label>
    <div class="edit-stat-grid" id="edit-stat-fields">
      <label>
        Vitalidade
        <input name="vitality" type="number" min="1" max="999" value="${stats.vitality || 90}">
      </label>
      <label>
        Chute
        <input name="shot" type="number" min="1" max="999" value="${stats.shot || 70}">
      </label>
      <label>
        Drible
        <input name="dribble" type="number" min="1" max="999" value="${stats.dribble || 70}">
      </label>
      <label>
        Velocidade
        <input name="speed" type="number" min="1" max="999" value="${stats.speed || 70}">
      </label>
    </div>
    <label class="edit-keeper-field" id="edit-keeper-field">
      Habilidade do goleiro
      <select id="edit-keeper-ability" name="keeperAbility">
        ${Object.entries(KEEPER_ABILITY_LABELS).map(([id, label]) => `<option value="${id}" ${monster.keeperAbility === id ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </label>
    <p class="evolution-note" id="edit-message">${state.editMessage || (editingNew ? "Novo tazzo sera adicionado ao album com 1 copia." : "Salvar cria uma versao editada persistente deste tazzo.")}</p>
    <div class="edit-actions">
      <button type="submit">${editingNew ? "Adicionar tazzo" : "Salvar tazzo"}</button>
    </div>
  `;

  preview.innerHTML = `
    <span class="eyebrow">Previa</span>
    <div class="edit-preview-art-set">
      <figure class="edit-preview-art">
        <img id="edit-preview-image" src="${monster.image}" alt="${monster.name}">
        <figcaption>Frente</figcaption>
      </figure>
      <figure class="edit-preview-art">
        <img id="edit-preview-back-image" src="${monsterBackImage(monster)}" alt="Verso de ${monster.name}">
        <figcaption>Verso</figcaption>
      </figure>
    </div>
    <h2>${monster.name || "Novo Tazzo"}</h2>
    <div class="stat-line">
      ${typeChips(monster)}
      <span class="rarity-chip">${monster.rarity}</span>
      ${holographicChip(monster)}
      ${keeper ? `<span class="rarity-chip">Fora do campo</span>` : ""}
    </div>
    <div class="small-list">
      ${keeper
        ? smallSummary("Habilidade", "1 uso", keeperAbilityText(monster).replace("Habilidade: ", ""))
        : `
          ${smallSummary("Vitalidade", stats.vitality || 90, "Vida em batalha")}
          ${smallSummary("Chute", stats.shot || 70, "Dano de chute usa 50%")}
          ${smallSummary("Drible", stats.dribble || 70, "Dano cheio adjacente")}
          ${smallSummary("Velocidade", stats.speed || 70, "Define ordem e alcance")}
        `}
    </div>
  `;

  syncEditFormMode();
}

function editDraft() {
  return {
    id: "",
    number: nextCatalogNumber(),
    name: "Novo Tazzo",
    types: ["Atacante"],
    rarity: "Comum",
    vitality: 90,
    shot: 70,
    dribble: 70,
    speed: 70,
    role: "Atacante",
    keeperAbility: null,
    image: ASSETS[0],
    backImage: DEFAULT_BACK_IMAGE,
    cost: RARITIES.Comum.cost
  };
}

function syncEditFormMode() {
  const type = document.getElementById("edit-type")?.value;
  const checkbox = document.getElementById("edit-is-goalkeeper");
  const statFields = document.getElementById("edit-stat-fields");
  const keeperField = document.getElementById("edit-keeper-field");
  const keeperSelect = document.getElementById("edit-keeper-ability");
  const role = document.getElementById("edit-role");
  const keeper = Boolean(checkbox?.checked);
  if (statFields) statFields.classList.toggle("is-disabled", keeper);
  if (keeperField) keeperField.classList.toggle("is-active", keeper);
  if (keeperSelect) keeperSelect.disabled = !keeper;
  if (statFields) {
    statFields.querySelectorAll("input").forEach((input) => {
      input.disabled = keeper;
    });
  }
  if (role && keeper) role.value = "Goleiro";
  if (role && !keeper && role.value === "Goleiro") role.value = type || "Atacante";
}

function syncEditPreviewImage() {
  const image = document.getElementById("edit-image")?.value;
  const backImage = document.getElementById("edit-back-image")?.value;
  const preview = document.getElementById("edit-preview-image");
  const backPreview = document.getElementById("edit-preview-back-image");
  if (image && preview) preview.src = image;
  if (backImage && backPreview) backPreview.src = backImage;
}

function saveEditedTazzo(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const existingId = form.dataset.editId || "";
  const existing = existingId ? MONSTER_BY_ID[existingId] : null;
  const baseId = existingId || uniqueCustomId(sanitizeId(formData.get("name")) || "novo-tazzo");
  const edited = normalizeCustomTazzo({
    id: baseId,
    number: existing?.number || nextCatalogNumber(),
    name: formData.get("name"),
    image: formData.get("image"),
    backImage: formData.get("backImage"),
    type: formData.get("type"),
    rarity: formData.get("rarity"),
    role: formData.get("role"),
    isGoalkeeper: formData.get("isGoalkeeper") === "on",
    vitality: formData.get("vitality"),
    shot: formData.get("shot"),
    dribble: formData.get("dribble"),
    speed: formData.get("speed"),
    keeperAbility: formData.get("keeperAbility")
  });
  if (!edited) return;

  state.save.customTazzos = [
    ...(state.save.customTazzos || []).filter((item) => item.id !== edited.id),
    edited
  ];
  applyCustomCatalog(state.save.customTazzos);
  state.save.collection[edited.id] = Math.max(1, state.save.collection[edited.id] || 0);

  if (isGoalkeeper(edited)) {
    delete state.save.upgrades[edited.id];
    state.save.team = normalizeTeam(state.save.team);
    state.save.goalkeeper = edited.id;
  } else {
    state.save.team = normalizeTeam(state.save.team);
    if (state.save.goalkeeper === edited.id) state.save.goalkeeper = normalizeGoalkeeper("");
  }

  if (state.battle && !state.battle.over) {
    clearTurnTimer();
    clearMatchTimer();
    state.battle = null;
    state.battleSceneOpen = false;
  }

  state.editSelectedId = edited.id;
  state.editMessage = `${edited.name} salvo no catalogo.`;
  saveGame();
  renderAll();
}

function uniqueCustomId(baseId) {
  const cleanBase = baseId || "novo-tazzo";
  let id = cleanBase;
  let suffix = 2;
  while (MONSTER_BY_ID[id]) {
    id = `${cleanBase}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function renderTrade() {
  const duplicates = MONSTERS.filter((monster) => (state.save.collection[monster.id] || 0) > 1);
  const missing = visibleCollectionMonsters().filter((monster) => !state.save.collection[monster.id]);
  const offerSelect = document.getElementById("trade-offer");
  const wishSelect = document.getElementById("trade-wish");

  if (!duplicates.some((monster) => monster.id === state.selectedTrade.offer)) {
    state.selectedTrade.offer = duplicates[0]?.id || "";
  }
  if (!missing.some((monster) => monster.id === state.selectedTrade.wish)) {
    state.selectedTrade.wish = missing[0]?.id || "";
  }

  offerSelect.innerHTML = duplicates.length
    ? duplicates.map((monster) => `<option value="${monster.id}" ${monster.id === state.selectedTrade.offer ? "selected" : ""}>${monster.name} x${state.save.collection[monster.id]}</option>`).join("")
    : `<option value="">Sem repetidos</option>`;

  wishSelect.innerHTML = missing.length
    ? missing.map((monster) => `<option value="${monster.id}" ${monster.id === state.selectedTrade.wish ? "selected" : ""}>${monster.name} - ${monster.rarity}</option>`).join("")
    : `<option value="">Album completo</option>`;

  document.getElementById("duplicate-list").innerHTML = duplicates.length
    ? duplicates.map((monster) => smallRow(monster, `x${state.save.collection[monster.id]}`)).join("")
    : `<p>Nenhum repetido agora.</p>`;

  document.getElementById("wish-list").innerHTML = missing.length
    ? missing.slice(0, 8).map((monster) => smallRow(monster, monster.rarity)).join("")
    : `<p>Album completo.</p>`;

  document.getElementById("trade-log").innerHTML = state.tradeLog.length
    ? state.tradeLog.map((line) => `<p>${line}</p>`).join("")
    : `<p>Sem trocas nesta sessao.</p>`;

  document.getElementById("trade-message").textContent = duplicates.length && missing.length
    ? "Taxa de 60 Merreis por troca."
    : "Abra pacotinhos para criar repetidos e desejos.";

  document.getElementById("trade-button").disabled = !duplicates.length || !missing.length || state.save.merreis < 60;
}

function renderFriends() {
  const grid = document.getElementById("friends-grid");
  const todayGifts = state.save.friendGifts[TODAY_KEY] || {};
  grid.innerHTML = FRIENDS.map((friend) => {
    const ownedFriendHas = friend.collection.filter((id) => state.save.collection[id]).length;
    const canOffer = friend.wants.some((id) => (state.save.collection[id] || 0) > 1);
    const friendCanHelp = friend.collection.filter((id) => !state.save.collection[id]).length;
    const giftSent = Boolean(todayGifts[friend.id]);
    const avatar = MONSTER_BY_ID[friend.team[0]] || MONSTERS[friend.avatar - 1] || MONSTERS[0];
    return `
      <article class="friend-card">
        <div class="friend-head">
          <img src="${avatar.image}" alt="${friend.name}">
          <div>
            <h2>${friend.name}</h2>
            <div class="stat-line">
              <span>${friend.rank}</span>
              <span>${ownedFriendHas}/${friend.collection.length} em comum</span>
            </div>
          </div>
          <span class="chip">${friendCanHelp}</span>
        </div>
        <div class="small-list">
          ${smallSummary("Procura", "Busca", friend.wants.map((id) => MONSTER_BY_ID[id].name).join(", "))}
          ${smallSummary("Pode mostrar", "Album", friend.collection.slice(0, 3).map((id) => MONSTER_BY_ID[id].name).join(", "))}
          ${smallSummary("Troca", "Match", canOffer ? "Voce tem repetido util" : "Sem repetido compativel")}
        </div>
        <div class="friend-actions">
          <button type="button" data-gift="${friend.id}" ${giftSent ? "disabled" : ""}>${giftSent ? "Enviado" : "Presente"}</button>
          <button type="button" data-challenge="${friend.id}">Desafiar</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderOnline() {
  const currentCard = document.getElementById("online-current-card");
  const lobbyList = document.getElementById("online-lobby-list");
  const teamPreview = document.getElementById("online-team-preview");
  if (!currentCard || !lobbyList || !teamPreview) return;

  const current = state.online.currentLobby;
  const statusText = state.online.loading
    ? "Atualizando"
    : state.online.error
    ? state.online.error
    : current
    ? onlineLobbyStatusText(current)
    : state.server.enabled
    ? "Fora de sala"
    : "Servidor local";
  const realtimeLabel = state.online.socketStatus === "online"
    ? "Ao vivo"
    : state.online.socketStatus === "connecting"
    ? "Conectando"
    : "HTTP";

  currentCard.innerHTML = current ? renderCurrentOnlineLobby(current, statusText, realtimeLabel) : `
    <div class="panel-heading">
      <span class="eyebrow">Online</span>
      <span class="chip">${realtimeLabel}</span>
    </div>
    <h2>Sala atual</h2>
    <p class="evolution-note">${statusText}</p>
    <div class="online-current-actions">
      <button type="button" data-lobby-action="ready" disabled>Pronto</button>
      <button type="button" data-lobby-action="leave" disabled>Sair</button>
    </div>
  `;

  lobbyList.innerHTML = state.online.lobbies.length
    ? state.online.lobbies.map(renderOnlineLobbyRow).join("")
    : `<div class="small-row"><span class="chip">0</span><div><strong>Nenhuma sala</strong><span>${state.online.loading ? "Atualizando" : "Aguardando jogadores"}</span></div><span></span></div>`;

  renderOnlineInviteMessage();

  teamPreview.innerHTML = state.save.team
    .map((id) => MONSTER_BY_ID[id])
    .filter(Boolean)
    .map((monster) => smallRow(monster, `Custo ${monster.cost}`))
    .join("");
}

function renderOnlineInviteMessage() {
  const input = document.getElementById("online-code-input");
  const message = document.getElementById("online-code-message");
  if (input && document.activeElement !== input && state.online.joinCode) input.value = state.online.joinCode;
  if (!message) return;
  message.textContent = state.online.inviteMessage || "";
  message.classList.toggle("is-error", state.online.inviteMessageType === "error");
  message.classList.toggle("is-success", state.online.inviteMessageType === "success");
}

function onlineLobbyStatusText(lobby) {
  if (lobby.match?.battleState?.over) return "Partida encerrada";
  if (lobby.match) return "Em batalha";
  if (lobby.status === "ready") return "Todos prontos";
  if (lobby.status === "forming") return "Preparando";
  return "Aguardando";
}

function renderCurrentOnlineLobby(lobby, statusText, realtimeLabel) {
  const currentPlayer = lobby.players.find((player) => player.isCurrent);
  const ready = Boolean(currentPlayer?.ready);
  const matchFinished = Boolean(lobby.match?.battleState?.over);
  const activeMatch = Boolean(lobby.match && !matchFinished);
  const absence = lobby.match?.absence || {};
  const opponentAway = Boolean(activeMatch && absence.opponentAway);
  const canClaimForfeit = Boolean(activeMatch && absence.canClaimForfeit);
  const rematch = lobby.rematch || {};
  const leaveLabel = activeMatch ? opponentAway ? "Sair sem punicao" : "Desistir" : "Sair";
  const matchActionLabel = lobby.match
    ? matchFinished
      ? "Ver resultado"
      : lobby.match.isYourTurn
      ? "Continuar turno"
      : "Continuar batalha"
    : "Aguardando";
  return `
    <div class="panel-heading">
      <span class="eyebrow">Sala ${lobby.id}</span>
      <span class="chip">${realtimeLabel}</span>
    </div>
    <div class="stat-line">
      <span class="chip">${lobby.playerCount}/${lobby.capacity}</span>
      <span class="chip">${lobby.readyCount} pronto(s)</span>
    </div>
    <h2>${statusText}</h2>
    <div class="online-player-list">
      ${lobby.players.map(renderOnlinePlayerRow).join("")}
    </div>
    ${lobby.match ? renderOnlineMatchState(lobby.match) : ""}
    <div class="online-current-actions">
      <button type="button" data-lobby-action="copy-invite">Copiar convite</button>
      <button type="button" data-lobby-action="ready" data-ready="${!ready}" ${lobby.match ? "disabled" : ""}>${ready ? "Voltar" : "Pronto"}</button>
      <button type="button" data-lobby-action="leave">${leaveLabel}</button>
      <button type="button" data-lobby-action="open-battle" ${lobby.match ? "" : "disabled"}>${matchActionLabel}</button>
      ${canClaimForfeit ? `<button type="button" data-lobby-action="claim-forfeit">Vencer por W.O.</button>` : ""}
      ${matchFinished ? `<button type="button" data-lobby-action="rematch" ${rematch.requestedByYou ? "disabled" : ""}>${rematch.requestedByYou ? "Revanche pedida" : "Revanche"}</button>` : ""}
    </div>
  `;
}

function renderOnlineMatchState(match) {
  const finished = Boolean(match.battleState?.over);
  const absence = match.absence || {};
  const absenceText = !finished && absence.opponentAway
    ? absence.canClaimForfeit
      ? `${cleanText(absence.opponentName || match.opponentName, "Rival", 24)} ausente. W.O. liberado.`
      : `${cleanText(absence.opponentName || match.opponentName, "Rival", 24)} desconectou. W.O. em ${absence.secondsUntilForfeit || 0}s.`
    : "";
  const resultText = finished && match.battleState?.result
    ? `${match.battleState.result.title} | ${match.battleState.result.rewards.join(" | ")}`
    : "";
  const rematch = state.online.currentLobby?.match?.id === match.id ? state.online.currentLobby.rematch : null;
  const rematchText = finished && rematch?.requestedCount
    ? rematch.requestedByYou
      ? `Revanche pedida (${rematch.requestedCount}/${rematch.requiredCount}). Aguardando ${rematch.waitingFor.join(", ") || "rival"}.`
      : `O rival pediu revanche (${rematch.requestedCount}/${rematch.requiredCount}).`
    : "";
  return `
    <div class="online-match-card">
      <strong>${finished ? "Partida encerrada" : "Estado da partida"}</strong>
      <span>${match.message}</span>
      ${absenceText ? `<span class="is-warning">${absenceText}</span>` : ""}
      ${resultText ? `<span>${resultText}</span>` : `<span>Turno atual: ${cleanText(match.turnName, "Jogador", 24)}${match.isYourTurn ? " (voce)" : ""}</span>`}
      ${rematchText ? `<span>${rematchText}</span>` : ""}
      <span>Placar ${match.score.home} x ${match.score.away} - rodada ${match.round}</span>
    </div>
  `;
}

function renderOnlinePlayerRow(player) {
  const name = cleanText(player.name, "Visitante", 24);
  const role = player.isHost ? "Dono" : "Visitante";
  const status = player.away ? "Ausente" : player.ready ? "Pronto" : player.online ? "Online" : "Livre";
  return `
    <div class="small-row${player.isCurrent ? " is-selected" : ""}">
      <span class="chip">${player.isHost ? "D" : "J"}</span>
      <div>
        <strong>${name}${player.isCurrent ? " (voce)" : ""}</strong>
        <span>${role}</span>
      </div>
      <span class="chip${player.away ? " is-danger" : player.online ? " is-online" : ""}">${status}</span>
    </div>
  `;
}

function renderOnlineLobbyRow(lobby) {
  const joined = Boolean(lobby.players.some((player) => player.isCurrent));
  const full = lobby.playerCount >= lobby.capacity && !joined;
  const host = cleanText(lobby.players.find((player) => player.isHost)?.name, "Visitante", 24);
  return `
    <div class="small-row${joined ? " is-selected" : ""}">
      <span class="chip">${lobby.id}</span>
      <div>
        <strong>${host}</strong>
        <span>${onlineLobbyStatusText(lobby)} | ${lobby.playerCount}/${lobby.capacity} | ${lobby.readyCount} pronto(s)</span>
      </div>
      <button type="button" data-join-lobby="${lobby.id}" ${full || joined ? "disabled" : ""}>${joined ? "Atual" : full ? "Cheia" : "Entrar"}</button>
    </div>
  `;
}

function renderCompetitive() {
  const rank = currentRank();
  const next = nextRank();
  const progress = next ? Math.round(((state.save.trophies - rank.min) / (next.min - rank.min)) * 100) : 100;
  const cost = teamCost();
  const power = Math.round(teamPower());
  const legal = cost <= 10;
  const rankedTutorialReady = isCurrentTutorialStep("ranked");
  const tournamentTutorialReady = isCurrentTutorialStep("tournament");
  const chance = Math.round(rankedChance() * 100);
  const latest = state.competitiveLog[0] || "Sem partidas competitivas nesta sessao.";
  const rankedOpponent = rankedOpponentForCurrentRank();

  document.getElementById("rank-card").innerHTML = `
    <span class="eyebrow">Divisao atual</span>
    <div class="rank-value">${rank.name}</div>
    <div class="stat-line">
      <span>${formatNumber(state.save.trophies)} trofeus</span>
      <span>${state.save.rankedWins}V/${state.save.rankedLosses}D</span>
      <span>Online ${formatNumber(state.save.onlineTrophies || 0)}</span>
      <span>${state.save.tournamentWins} torneio(s)</span>
    </div>
    <div class="rank-meter">
      <div class="progress"><span style="width:${clamp(progress, 0, 100)}%"></span></div>
    </div>
    <p class="evolution-note">${next ? `${next.name} em ${next.min} trofeus.` : "Topo da liga local."}</p>
  `;

  document.getElementById("ranked-summary").innerHTML = `
    ${smallSummary("Custo competitivo", `${cost}/10`, legal ? "Time valido" : "Ajuste o time na colecao")}
    ${smallSummary("Forca do trio", power, `${chance}% de chance estimada`)}
    ${smallSummary("Oponente", rankedOpponent.name, `${rankedOpponent.team.map((id) => MONSTER_BY_ID[id].name).join(", ")} | Goleiro ${MONSTER_BY_ID[rankedOpponent.goalkeeper]?.name || "sorteado"}`)}
    ${smallSummary("Recompensa", "+90 a +150 trofeus", "Resolvida na arena")}
    ${smallSummary("Ultimo resultado", "Liga", latest)}
  `;

  const activeTournamentId = activeTournamentBattle() ? state.battle.tournamentId : "";
  const activeRanked = activeRankedBattle();
  const rankedButton = document.getElementById("ranked-button");
  rankedButton.disabled = (!legal && !rankedTutorialReady) || Boolean(activeTournamentId) || activeRanked;
  rankedButton.textContent = activeTournamentId
    ? "Finalize o torneio"
    : activeRanked
    ? "Ranqueada ativa"
    : !legal && rankedTutorialReady
    ? "Disputar ranqueada tutorial"
    : "Disputar ranqueada";
  document.getElementById("tournament-list").innerHTML = TOURNAMENTS.map((tournament) => {
    const active = activeTournamentId === tournament.id;
    const tutorialBypass = tournamentTutorialReady;
    const disabled = activeTournamentId || activeRanked || (!tutorialBypass && (state.save.merreis < tournament.entry || !legal));
    const label = active ? "Em batalha" : tutorialBypass && (state.save.merreis < tournament.entry || !legal) ? "Entrar pelo tutorial" : "Entrar e batalhar";
    const opponent = TOURNAMENT_OPPONENTS[tournament.id];
    return `
      <article class="tournament-card${active ? " is-active" : ""}">
        <h3>${tournament.name}</h3>
        <p>Entrada ${formatNumber(tournament.entry)} Merreis. Premio: ${tournament.prize}.</p>
        <div class="tournament-opponent">
          <span class="eyebrow">Oponente</span>
          <strong>${opponent.name}</strong>
          <span>${opponent.team.map((id) => MONSTER_BY_ID[id].name).join(", ")} | Goleiro ${MONSTER_BY_ID[opponent.goalkeeper]?.name || "sorteado"}</span>
        </div>
        <button type="button" data-tournament="${tournament.id}" ${disabled ? "disabled" : ""}>${label}</button>
      </article>
    `;
  }).join("");

  document.getElementById("leaderboard-list").innerHTML = renderLeaderboardRows(rank);
}

function renderLeaderboardRows(currentPlayerRank) {
  const serverRows = state.leaderboard.rows || [];
  const currentPlayerId = state.server.playerId;
  const currentName = state.server.profile?.name || "Voce";
  const currentRow = {
    playerId: currentPlayerId || "local",
    name: currentName,
    trophies: state.save.trophies,
    rank: currentPlayerRank.name,
    rankedWins: state.save.rankedWins,
    rankedLosses: state.save.rankedLosses,
    tournamentWins: state.save.tournamentWins,
    onlineTrophies: state.save.onlineTrophies,
    onlineWins: state.save.onlineWins,
    onlineLosses: state.save.onlineLosses,
    onlineDraws: state.save.onlineDraws,
    album: visibleCollectionMonsters().filter((monster) => state.save.collection[monster.id] > 0).length,
    albumTotal: visibleCollectionMonsters().length
  };
  const rows = serverRows.length
    ? serverRows
    : [
      { name: "Nina Holo", trophies: 1180, rank: "Lendario", rankedWins: 12, rankedLosses: 3, tournamentWins: 4 },
      { name: "Tio Croc", trophies: 910, rank: "Lendario", rankedWins: 9, rankedLosses: 4, tournamentWins: 2 },
      { name: "Bia Caps", trophies: 640, rank: "Holografico", rankedWins: 7, rankedLosses: 5, tournamentWins: 1 },
      currentRow,
      { name: "Lipe Snack", trophies: 350, rank: "Crocante", rankedWins: 4, rankedLosses: 4, tournamentWins: 0 },
      { name: "Madu Tazo", trophies: 210, rank: "Recreio", rankedWins: 2, rankedLosses: 2, tournamentWins: 0 }
    ];
  const hasCurrent = rows.some((row) => row.playerId && currentPlayerId && row.playerId === currentPlayerId);
  const withCurrent = hasCurrent ? rows : [...rows, currentRow];
  const sorted = [...withCurrent].sort((a, b) => (b.onlineTrophies || 0) - (a.onlineTrophies || 0) || b.trophies - a.trophies || (b.onlineWins || 0) - (a.onlineWins || 0) || (b.album || 0) - (a.album || 0));
  const visibleRows = sorted.slice(0, 20);
  const currentSortedRow = currentPlayerId
    ? sorted.find((row) => row.playerId === currentPlayerId)
    : null;
  if (currentSortedRow && !visibleRows.some((row) => row.playerId === currentPlayerId)) {
    visibleRows.push(currentSortedRow);
  }
  const statusRow = state.leaderboard.loading
    ? `<div class="small-row"><span class="chip">...</span><div><strong>Atualizando ranking</strong><span>Buscando jogadores online</span></div><span></span></div>`
    : state.leaderboard.error
    ? `<div class="small-row"><span class="chip">!</span><div><strong>Ranking local</strong><span>${state.leaderboard.error}</span></div><span></span></div>`
    : "";

  return `${statusRow}${visibleRows.map((row, index) => {
    const isCurrent = row.playerId && currentPlayerId && row.playerId === currentPlayerId;
    const onlineRecord = `${Number(row.onlineWins) || 0}V/${Number(row.onlineLosses) || 0}D/${Number(row.onlineDraws) || 0}E`;
    const meta = `Online ${formatNumber(row.onlineTrophies || 0)} pts ${onlineRecord} | Liga ${row.rank || "Tampinha"} | ${Number(row.tournamentWins) || 0} torneio(s)`;
    const album = row.albumTotal ? `${row.album}/${row.albumTotal}` : "";
    return `
      <div class="small-row${isCurrent ? " is-selected" : ""}">
        <span class="chip">#${index + 1}</span>
        <div>
          <strong>${row.name}${isCurrent ? " (voce)" : ""}</strong>
          <span>${meta}${album ? ` | Album ${album}` : ""}</span>
        </div>
        <span class="chip">${formatNumber(row.onlineTrophies || row.trophies || 0)}</span>
      </div>
    `;
  }).join("")}`;
}

function renderShop() {
  document.getElementById("shop-message").textContent = state.shopMessage;
  document.getElementById("shop-grid").innerHTML = SHOP_ITEMS.map((item) => {
    const owned = Boolean(state.save.cosmetics[item.id]);
    const active = state.save.selectedCosmetic === item.id;
    const disabled = !owned && state.save.merreis < item.cost;
    const label = active ? "Ativo" : owned ? "Ativar" : "Comprar";
    return `
      <article class="shop-card${owned ? " is-owned" : ""}${active ? " is-active" : ""}">
        <h2>${item.name}</h2>
        <p>${item.note}</p>
        <div class="pack-meta">
          <span class="chip">${formatNumber(item.cost)} Merreis</span>
          <span class="rarity-chip">${owned ? "Obtido" : "Cosmetico"}</span>
        </div>
        <button type="button" data-shop="${item.id}" ${disabled || active ? "disabled" : ""}>${label}</button>
      </article>
    `;
  }).join("");
}

function smallSummary(title, value, meta) {
  return `
    <div class="small-row">
      <span class="chip">${value}</span>
      <div>
        <strong>${title}</strong>
        <span>${meta}</span>
      </div>
      <span></span>
    </div>
  `;
}

function renderMissions() {
  const grid = document.getElementById("mission-grid");
  grid.innerHTML = MISSIONS.map((mission) => {
    const status = missionStatus(mission);
    const progress = clamp(status.progress, 0, mission.target);
    const ready = progress >= mission.target && !status.claimed;
    const done = status.claimed;
    const width = Math.round((progress / mission.target) * 100);
    return `
      <article class="mission-card">
        <h2>${mission.title}</h2>
        <p>${progress}/${mission.target} - ${formatNumber(mission.reward)} Merreis</p>
        <div class="progress"><span style="width:${width}%"></span></div>
        <button type="button" data-claim="${mission.id}" ${ready ? "" : "disabled"}>${done ? "Resgatada" : "Resgatar"}</button>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("button[data-claim]").forEach((button) => {
    button.addEventListener("click", () => claimMission(button.dataset.claim));
  });
}

function missionStatus(mission) {
  const saved = state.save.missions[mission.id] || { progress: 0, claimed: false };
  if (mission.scope === "album") {
    return {
      progress: albumMissionProgress(mission),
      claimed: Boolean(saved.claimed)
    };
  }
  return saved;
}

function albumMissionProgress(mission) {
  const [from, to] = mission.range || [0, -1];
  return MONSTERS
    .filter((monster) => monster.number >= from && monster.number <= to)
    .filter((monster) => (state.save.collection[monster.id] || 0) > 0)
    .length;
}

function renderTutorial() {
  const current = currentTutorialStep();
  const done = completedTutorialCount();
  const complete = done === TUTORIAL_STEPS.length;
  const rewardReady = complete && !state.save.tutorialRewardClaimed;
  document.getElementById("tutorial-panel").innerHTML = `
    <div class="panel-heading">
      <div>
        <span class="eyebrow">Tutorial</span>
        <h2>Primeira liga</h2>
      </div>
      <span class="chip">${done}/${TUTORIAL_STEPS.length}</span>
    </div>
    <div class="tutorial-active-card${complete ? " is-complete" : ""}">
      <div>
        <span class="eyebrow">${complete ? "Tutorial completo" : "Proximo passo"}</span>
        <h3>${complete ? "Primeira liga concluida" : current.title}</h3>
        <p>${complete ? "Voce ja passou pelo loop principal do MVP." : current.description}</p>
        ${complete ? "" : tutorialStepDetails(current)}
      </div>
      ${complete
        ? `<button type="button" data-tutorial-reward="true" ${rewardReady ? "" : "disabled"}>${state.save.tutorialRewardClaimed ? "Recompensa resgatada" : "Resgatar tutorial"}</button>`
        : `<button type="button" data-tutorial-action="${current.id}">${current.action || "Continuar"}</button>`}
    </div>
    <div class="tutorial-grid">
      ${TUTORIAL_STEPS.map((step) => `
        <div class="tutorial-step${state.save.tutorial[step.id] ? " is-done" : ""}${current?.id === step.id ? " is-current" : ""}">
          <strong>${step.title}</strong>
          <span>${state.save.tutorial[step.id] ? "Concluido" : current?.id === step.id ? "Agora" : "Pendente"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTutorialCoach() {
  const coach = document.getElementById("tutorial-coach");
  if (!coach) return;
  const current = currentTutorialStep();
  const done = completedTutorialCount();
  const complete = done === TUTORIAL_STEPS.length;
  const percent = Math.round((done / TUTORIAL_STEPS.length) * 100);
  coach.classList.toggle("is-complete", complete);
  coach.innerHTML = `
    <div class="tutorial-coach-copy">
      <span class="eyebrow">${complete ? "Tutorial completo" : `Tutorial ${done + 1}/${TUTORIAL_STEPS.length}`}</span>
      <strong>${complete ? "Primeira liga concluida" : current.title}</strong>
      <p>${complete ? "O loop principal ja esta validado no seu save." : current.description}</p>
      ${complete ? "" : `<span class="tutorial-next-line">${tutorialQuickLine(current)}</span>`}
    </div>
    <div class="tutorial-coach-progress" aria-label="Progresso do tutorial">
      <span style="width:${percent}%"></span>
    </div>
    ${complete
      ? `<button type="button" data-tutorial-reward="true" ${!state.save.tutorialRewardClaimed ? "" : "disabled"}>${state.save.tutorialRewardClaimed ? "Recompensa resgatada" : "Resgatar"}</button>`
      : `<button type="button" data-tutorial-action="${current.id}">${current.action || "Continuar"}</button>`}
  `;
}

function renderTutorialPopover() {
  const popover = document.getElementById("tutorial-popover");
  if (!popover) return;
  const current = currentTutorialStep();
  if (!current) {
    popover.hidden = true;
    popover.innerHTML = "";
    return;
  }

  popover.hidden = false;
  popover.innerHTML = `
    <div class="tutorial-popover-icon">?</div>
    <div>
      <span class="eyebrow">Ajuda rapida</span>
      <strong>${current.title}</strong>
      <p>${current.tip || current.description}</p>
      <small>${current.completes || "Siga a instrucao destacada para avancar."}</small>
    </div>
    <button type="button" data-tutorial-action="${current.id}">${current.action || "Ir"}</button>
  `;
}

function smallRow(monster, meta) {
  return `
    <button class="small-row" type="button" data-monster-view="${monster.id}">
      ${renderMonsterArt(monster, "small-row-art")}
      <div>
        <strong>${monster.name}</strong>
        <span>${monster.types.join("/")} - ${monster.rarity}${hasHolographicArt(monster) ? " - Holografico" : ""}</span>
      </div>
      <span class="chip">${meta}</span>
    </button>
  `;
}

function keeperAbilityText(monster) {
  const labels = {
    extraTurn: "Habilidade: ganha um turno extra.",
    fullShot: "Habilidade: o proximo chute do time causa dano cheio.",
    teamHeal: "Habilidade: Recuperar Vitalidade recupera toda a vitalidade do time.",
    freeSwap: "Habilidade: a proxima troca pode ser feita em qualquer casa.",
    substitution: "Habilidade duas estrelas: Substituicao permite trocar jogadores em qualquer lugar do campo ate o final da partida.",
    investidaTotal: "Habilidade: investida total, os proximos 2 chutes do time causam dano cheio."
  };
  return monster.keeperAbility ? labels[monster.keeperAbility] : "";
}

function typeChips(monster) {
  return monster.types.map((type) => `<span class="type-chip" style="--type-color:${TYPES[type]?.color || "#64748b"}">${type}</span>`).join("");
}

function holographicChip(monster) {
  return hasHolographicArt(monster) ? `<span class="rarity-chip holo-chip">Holografico</span>` : "";
}

function matchesCollectionFilters(monster) {
  const copies = state.save.collection[monster.id] || 0;
  const filter = state.collectionFilters;
  if (!visibleInCollection(monster)) return false;
  if (filter.type !== "all" && !monster.types.includes(filter.type)) return false;
  if (filter.rarity !== "all" && monster.rarity !== filter.rarity) return false;
  if (filter.owned === "owned" && copies <= 0) return false;
  if (filter.owned === "missing" && copies > 0) return false;
  if (filter.owned === "duplicates" && copies <= 1) return false;
  return true;
}

function isPackBusy() {
  return state.packPurchasePending || Boolean(state.packOpening) || state.packReveal.some((pull) => !pull.revealed || pull.flipping);
}

function clearPackOpeningTimers() {
  state.packOpeningTimers.forEach((timer) => clearTimeout(timer));
  state.packOpeningTimers = [];
}

function schedulePackOpening() {
  clearPackOpeningTimers();
  const timer = setTimeout(() => {
    if (!state.packOpening) return;
    state.packOpening = null;
    state.packOpeningTimers = [];
    renderPacks();
  }, PACK_OPENING_DURATION_MS);
  state.packOpeningTimers = [timer];
}

async function openPack(packId) {
  const pack = PACKS.find((item) => item.id === packId);
  if (!pack || state.save.merreis < pack.cost || isPackBusy()) return;

  if (state.server.enabled) {
    await openPackOnServer(pack);
    return;
  }

  openPackLocally(pack);
}

function openPackLocally(pack) {
  state.save.merreis -= pack.cost;
  const pulls = drawPackPulls(pack);
  if (pack.id === "familia") {
    state.save.fragments += 8;
  }

  state.packReveal = pulls;
  state.packOpening = {
    packId: pack.id,
    packName: pack.name,
    stage: "opening"
  };
  progressMission("pack", 1);
  progressTutorial("pack");
  saveGame();
  renderAll();
  schedulePackOpening();
}

async function openPackOnServer(pack) {
  state.packPurchasePending = true;
  setServerStatus("syncing", "Abrindo");
  renderPacks();

  try {
    if (state.server.saveTimer) await pushServerSave();
    const response = await fetch(SERVER_OPEN_PACK_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: pack.id })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (payload.save) {
        state.save = normalizeSave(payload.save);
        persistLocalSave();
      }
      throw new Error(payload.error || "Nao foi possivel abrir o pacotinho.");
    }

    state.server.playerId = payload.playerId || state.server.playerId;
    state.save = normalizeSave(payload.save);
    persistLocalSave();
    state.packReveal = (payload.pulls || []).map((pull) => ({ ...pull, revealed: false }));
    state.packOpening = {
      packId: payload.pack?.id || pack.id,
      packName: payload.pack?.name || pack.name,
      stage: "opening"
    };
    state.packPurchasePending = false;
    state.server.localChangedWhileLoading = false;
    setServerStatus("online", "Salvo");
    progressTutorial("pack");
    renderAll();
    schedulePackOpening();
  } catch (error) {
    state.packPurchasePending = false;
    setServerStatus("error", "Local");
    renderAll();
  }
}

function drawPackPulls(pack) {
  const pulls = [];
  const pity = sanitizePackPity(state.save.packPity);
  for (let index = 0; index < pack.cards; index += 1) {
    let guaranteed = pack.id === "recheado" && index === pack.cards - 1 ? "Raro" : null;
    const monster = randomMonster(guaranteed, { legendaryBoostMultiplier: legendaryBoostMultiplier(pity.sinceLegendaryPlus) });
    const isNew = !state.save.collection[monster.id];
    state.save.collection[monster.id] = (state.save.collection[monster.id] || 0) + 1;
    const fragments = isNew ? 0 : RARITIES[monster.rarity].fragments;
    state.save.fragments += fragments;
    pulls.push({ monsterId: monster.id, isNew, fragments, revealed: false });
    pity.sinceLegendaryPlus = nextPackPity(pity, monster);
  }
  state.save.packPity = pity;
  return pulls;
}

function revealAllPulls() {
  if (state.packOpening) return;
  const unrevealedIndexes = state.packReveal
    .map((pull, index) => ({ pull, index }))
    .filter(({ pull }) => !pull.revealed && !pull.flipping)
    .map(({ index }) => index);

  if (!unrevealedIndexes.length) {
    renderPacks();
    return;
  }

  revealPullBatch(unrevealedIndexes);
}

function tearOpenPack() {
  if (!state.packOpening) return;
  clearPackOpeningTimers();
  state.packOpening = null;
  renderPacks();
}

function showPackCards() {
  if (!state.packOpening) return;
  clearPackOpeningTimers();
  state.packOpening = null;
  renderPacks();
}

function closePackResults() {
  if (state.packOpening) return;

  const pendingIndexes = state.packReveal
    .map((pull, index) => ({ pull, index }))
    .filter(({ pull }) => !pull.revealed)
    .map(({ index }) => index);

  if (pendingIndexes.length) {
    revealPullBatch(pendingIndexes);
    setTimeout(closePackResults, PACK_CLOSE_AFTER_REVEAL_MS);
    return;
  }

  if (state.packReveal.some((pull) => pull.flipping)) {
    setTimeout(closePackResults, PACK_CLOSE_AFTER_REVEAL_MS);
    return;
  }

  state.packReveal = [];
  renderPacks();
}

function rarityIndex(rarity) {
  return Object.keys(RARITIES).indexOf(normalizeRarity(rarity));
}

function isAtLeastRarity(rarity, minRarity) {
  return rarityIndex(rarity) >= rarityIndex(minRarity);
}

function nextPackPity(previousPity, monster) {
  return isAtLeastRarity(monster.rarity, "Lendario")
    ? 0
    : previousPity.sinceLegendaryPlus + 1;
}

function legendaryBoostMultiplier(count) {
  if (count >= LEGENDARY_BOOST_MAX_TAZZOS) return LEGENDARY_BOOST_MAX_MULTIPLIER;
  if (count >= LEGENDARY_BOOST_TAZZOS) return LEGENDARY_BOOST_MULTIPLIER;
  return 1;
}

function randomMonster(minRarity, options = {}) {
  const allowedRarities = minRarity ? rarityAtLeast(minRarity) : Object.keys(RARITIES);
  const rarity = minRarity ? rollRarityFrom(allowedRarities, options) : rollRarity(options);
  const pool = MONSTERS.filter((monster) => allowedRarities.includes(monster.rarity));
  const rarityPool = MONSTERS.filter((monster) => monster.rarity === rarity);
  const safePool = rarityPool.length ? rarityPool : pool.length ? pool : MONSTERS;
  return safePool[Math.floor(Math.random() * safePool.length)];
}

function rollRarity(options = {}) {
  return rollRarityFrom(Object.keys(RARITIES), options);
}

function rollRarityFrom(allowedRarities, options = {}) {
  const entries = Object.entries(RARITIES).filter(([name]) => allowedRarities.includes(name));
  const legendaryMultiplier = Math.max(1, Number(options.legendaryBoostMultiplier) || 1);
  if (legendaryMultiplier > 1) {
    const legendaryEntries = entries.filter(([name]) => isAtLeastRarity(name, "Lendario"));
    const regularEntries = entries.filter(([name]) => !isAtLeastRarity(name, "Lendario"));
    const total = entries.reduce((sum, [, rarity]) => sum + rarity.chance, 0);
    const legendaryTotal = legendaryEntries.reduce((sum, [, rarity]) => sum + rarity.chance, 0);
    const boostedLegendaryChance = Math.min(1, (legendaryTotal / total) * legendaryMultiplier);
    if (!regularEntries.length || Math.random() < boostedLegendaryChance) {
      return weightedRarityChoice(legendaryEntries);
    }
    return weightedRarityChoice(regularEntries);
  }
  return weightedRarityChoice(entries);
}

function weightedRarityChoice(entries) {
  const safeEntries = entries.length ? entries : Object.entries(RARITIES);
  const total = safeEntries.reduce((sum, [, rarity]) => sum + rarity.chance, 0);
  let roll = Math.random() * total;
  for (const [name, data] of safeEntries) {
    roll -= data.chance;
    if (roll <= 0) return name;
  }
  return "Comum";
}

function rarityAtLeast(minRarity) {
  const order = Object.keys(RARITIES);
  const rarity = normalizeRarity(minRarity, "Comum");
  return order.slice(Math.max(0, order.indexOf(rarity)));
}

async function upgradeMonster(monsterId) {
  if (state.server.enabled) {
    await upgradeMonsterOnServer(monsterId);
    return;
  }
  upgradeMonsterLocally(monsterId);
}

function upgradeMonsterLocally(monsterId) {
  if (!state.save.collection[monsterId] || isGoalkeeper(monsterId)) return;
  const level = upgradeLevel(monsterId);
  if (level >= 2) return;
  const cost = upgradeCost(monsterId);
  if (state.save.fragments < cost.fragments || state.save.merreis < cost.merreis) return;

  state.save.fragments -= cost.fragments;
  state.save.merreis -= cost.merreis;
  state.save.upgrades[monsterId] = level + 1;
  progressMission("evolve", 1);
  progressTutorial("team");
  saveGame();
  renderAll();
}

async function upgradeMonsterOnServer(monsterId) {
  try {
    await postServerMutation(SERVER_UPGRADE_ENDPOINT, { monsterId }, "Melhorando");
    progressTutorial("team");
    renderAll();
  } catch (error) {
    renderAll();
  }
}

function currentRank() {
  return [...RANKS].reverse().find((rank) => state.save.trophies >= rank.min) || RANKS[0];
}

function rankedOpponentForCurrentRank() {
  const rank = currentRank();
  return RANKED_OPPONENTS.find((opponent) => opponent.rank === rank.name) || RANKED_OPPONENTS[0];
}

function nextRank() {
  return RANKS.find((rank) => rank.min > state.save.trophies) || null;
}

function teamCost() {
  const fieldCost = state.save.team.reduce((sum, id) => sum + (MONSTER_BY_ID[id]?.cost || 0), 0);
  const keeperCost = MONSTER_BY_ID[state.save.goalkeeper]?.cost || 0;
  return fieldCost + keeperCost;
}

function tutorialCompetitiveLoadout() {
  return {
    playerTeam: ["andreas-pereira-tazzo", "alex-sandro-tazzo", "wendell-tazzo"],
    playerGoalkeeper: "goleiro-brasil-alison"
  };
}

function competitiveBattleOptions(stepId) {
  if (!isCurrentTutorialStep(stepId)) return {};
  return {
    ...(teamCost() > 10 ? { ...tutorialCompetitiveLoadout(), preservePlayerLoadout: true } : {}),
    tutorialCompetitiveStep: stepId
  };
}

function teamPower() {
  const fieldPower = state.save.team.reduce((sum, id) => {
    const stats = monsterStats(id);
    return sum + stats.vitality * 0.28 + stats.shot * 0.38 + stats.dribble * 0.48 + stats.speed * 0.42;
  }, 0);
  return fieldPower + (MONSTER_BY_ID[state.save.goalkeeper]?.cost || 0) * 30;
}

function rankedChance(extraDifficulty = 0) {
  const costPenalty = Math.max(0, teamCost() - 8) * 0.035;
  const raw = 0.34 + teamPower() / 950 - costPenalty - extraDifficulty;
  return clamp(raw, 0.22, 0.78);
}

async function runRankedMatch() {
  if (state.server.enabled) {
    await runRankedMatchOnServer();
    return;
  }
  runRankedMatchLocally();
}

function runRankedMatchLocally() {
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  const tutorialReady = isCurrentTutorialStep("ranked");
  if (teamCost() > 10 && !tutorialReady) return;
  const rank = currentRank();
  const opponent = rankedOpponentForCurrentRank();
  const battleOptions = competitiveBattleOptions("ranked");
  progressMission("ranked", 1);
  progressTutorial("ranked");
  state.competitiveLog.unshift(`Ranqueada ${rank.name} iniciada contra ${opponent.name}.`);
  saveGame();
  switchTab("battle");
  newBattle({
    enemyTeam: opponent.team,
    enemyGoalkeeper: opponent.goalkeeper,
    enemyName: opponent.name,
    mode: "ranked",
    matchTime: BATTLE_MODES.ranked.matchTime,
    actionTime: BATTLE_MODES.ranked.actionTime,
    playerPositions: selectedFormationPositions(),
    ranked: { rank: rank.name, opponent: opponent.name },
    logIntro: `Ranqueada ${rank.name}: batalha contra ${opponent.name} comecou.`,
    ...battleOptions
  });
}

async function runRankedMatchOnServer() {
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  if (teamCost() > 10 && !isCurrentTutorialStep("ranked")) return;

  try {
    const payload = await postServerMutation(SERVER_RANKED_START_ENDPOINT, {}, "Ranqueada");
    const opponent = payload.opponent;
    const rank = payload.rank;
    const match = payload.match;
    if (!opponent || !rank || !match) return;
    const battleOptions = competitiveBattleOptions("ranked");
    progressTutorial("ranked");
    state.competitiveLog.unshift(`Ranqueada ${rank.name} iniciada contra ${opponent.name}.`);
    switchTab("battle");
    newBattle({
      enemyTeam: opponent.team,
      enemyGoalkeeper: opponent.goalkeeper,
      enemyName: opponent.name,
      mode: "ranked",
      matchTime: BATTLE_MODES.ranked.matchTime,
      actionTime: BATTLE_MODES.ranked.actionTime,
      playerPositions: selectedFormationPositions(),
      ranked: { rank: rank.name, opponent: opponent.name, matchId: match.id },
      logIntro: `Ranqueada ${rank.name}: batalha contra ${opponent.name} comecou.`,
      ...battleOptions
    });
  } catch (error) {
    renderAll();
  }
}

async function resolveRankedBattle(outcome, reason = "") {
  if (state.server.enabled && state.battle?.ranked?.matchId) {
    return resolveRankedBattleOnServer(outcome, reason);
  }
  return resolveRankedBattleLocally(outcome, reason);
}

function resolveRankedBattleLocally(outcome, reason = "") {
  state.pendingRanked = null;
  state.save.activeCompetitive = null;

  if (outcome === "win") {
    const trophies = 90 + Math.floor(Math.random() * 61);
    state.save.trophies += trophies;
    state.save.rankedWins += 1;
    state.save.merreis += 180;
    state.battle.status = `Vitoria ranqueada! +${trophies} trofeus`;
    state.competitiveLog.unshift(`Vitoria ranqueada${reason ? ` por ${reason}` : ""}: +${trophies} trofeus.`);
    return { rewards: [`+${trophies} trofeus`, "+180 Merreis"] };
  }

  if (outcome === "draw") {
    state.save.merreis += 80;
    state.battle.status = "Empate ranqueado. +80 Merreis";
    state.competitiveLog.unshift(`Empate ranqueado${reason ? ` por ${reason}` : ""}.`);
    return { rewards: ["Sem perda de trofeus", "+80 Merreis"] };
  }

  const loss = 28 + Math.floor(Math.random() * 31);
  state.save.trophies = Math.max(0, state.save.trophies - loss);
  state.save.rankedLosses += 1;
  state.save.merreis += 45;
  state.battle.status = `Derrota ranqueada. -${loss} trofeus`;
  state.competitiveLog.unshift(`Derrota ranqueada${reason ? ` por ${reason}` : ""}: -${loss} trofeus.`);
  return { rewards: [`-${loss} trofeus`, "+45 Merreis"] };
}

async function resolveRankedBattleOnServer(outcome, reason = "") {
  try {
    const payload = await postServerMutation(SERVER_COMPETITIVE_RESOLVE_ENDPOINT, {
      matchId: state.battle.ranked.matchId,
      outcome,
      reason
    }, "Resultado");
    const result = payload.result || { rewards: [] };
    state.pendingRanked = null;
    state.battle.status = result.status || state.battle.status;
    if (result.log) state.competitiveLog.unshift(result.log);
    return { rewards: result.rewards || [] };
  } catch (error) {
    return resolveRankedBattleLocally(outcome, reason);
  }
}

async function runTournament(tournamentId) {
  if (state.server.enabled) {
    await runTournamentOnServer(tournamentId);
    return;
  }
  runTournamentLocally(tournamentId);
}

function runTournamentLocally(tournamentId) {
  const tournament = TOURNAMENTS.find((item) => item.id === tournamentId);
  const tutorialReady = isCurrentTutorialStep("tournament");
  if (!tournament || (!tutorialReady && (teamCost() > 10 || state.save.merreis < tournament.entry))) return;
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }

  if (!tutorialReady) {
    state.save.merreis -= tournament.entry;
  }
  const battleOptions = competitiveBattleOptions("tournament");
  progressMission("tournament", 1);
  progressTutorial("tournament");
  state.competitiveLog.unshift(`Torneio ${tournament.name} iniciado${tutorialReady && state.save.merreis < tournament.entry ? " pelo tutorial" : ""}. Resolva na arena.`);
  saveGame();
  const opponent = TOURNAMENT_OPPONENTS[tournament.id];
  switchTab("battle");
  newBattle({
    enemyTeam: opponent.team,
    enemyGoalkeeper: opponent.goalkeeper,
    enemyName: opponent.name,
    mode: "tournament",
    matchTime: BATTLE_MODES.tournament.matchTime,
    actionTime: BATTLE_MODES.tournament.actionTime,
    playerPositions: selectedFormationPositions(),
    tournamentId: tournament.id,
    logIntro: `Torneio ${tournament.name}: batalha contra ${opponent.name} comecou.`,
    ...battleOptions
  });
}

async function runTournamentOnServer(tournamentId) {
  const tutorialReady = isCurrentTutorialStep("tournament");
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  if (teamCost() > 10 && !tutorialReady) return;

  try {
    const payload = await postServerMutation(SERVER_TOURNAMENT_START_ENDPOINT, { tournamentId }, "Torneio");
    const tournament = payload.tournament;
    const opponent = payload.opponent;
    const match = payload.match;
    if (!tournament || !opponent || !match) return;
    const battleOptions = competitiveBattleOptions("tournament");
    progressTutorial("tournament");
    state.competitiveLog.unshift(`Torneio ${tournament.name} iniciado. Resolva na arena.`);
    switchTab("battle");
    newBattle({
      enemyTeam: opponent.team,
      enemyGoalkeeper: opponent.goalkeeper,
      enemyName: opponent.name,
      mode: "tournament",
      matchTime: BATTLE_MODES.tournament.matchTime,
      actionTime: BATTLE_MODES.tournament.actionTime,
      playerPositions: selectedFormationPositions(),
      tournamentId: tournament.id,
      competitiveMatchId: match.id,
      logIntro: `Torneio ${tournament.name}: batalha contra ${opponent.name} comecou.`,
      ...battleOptions
    });
  } catch (error) {
    renderAll();
  }
}

async function resolveTournamentBattle(won, reason = "") {
  if (state.server.enabled && state.battle?.competitiveMatchId) {
    return resolveTournamentBattleOnServer(won, reason);
  }
  return resolveTournamentBattleLocally(won, reason);
}

function resolveTournamentBattleLocally(won, reason = "") {
  const tournament = TOURNAMENTS.find((item) => item.id === state.battle.tournamentId);
  if (!tournament) return { rewards: [], packReward: false };

  state.pendingTournament = null;
  state.save.activeCompetitive = null;
  if (won) {
    const rewards = ["+70 trofeus"];
    state.save.tournamentWins += 1;
    state.save.trophies += 70;
    if (tournament.id === "event") {
      state.save.merreis += 100;
      grantTournamentPack();
      state.battle.status = "Campeao do Evento! Pacotinho Recheado enviado.";
      rewards.push("+100 Merreis", "Pacotinho Recheado");
      state.competitiveLog.unshift(`Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}.`);
      return { rewards, packReward: true };
    } else {
      state.save.merreis += tournament.reward;
      rewards.push(`+${formatNumber(tournament.reward)} Merreis`);
      if (tournament.id === "weekly") state.save.fragments += 24;
      if (tournament.id === "weekly") rewards.push("+24 fragmentos");
      state.battle.status = `Campeao do torneio ${tournament.name}! +${formatNumber(tournament.reward)} Merreis`;
    }
    state.competitiveLog.unshift(`Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}.`);
    return { rewards, packReward: false };
  }

  const refund = Math.floor(tournament.entry * 0.25);
  state.save.merreis += refund;
  state.battle.status = `Eliminado no torneio ${tournament.name}. Reembolso ${formatNumber(refund)} Merreis.`;
  state.competitiveLog.unshift(`Eliminado no torneio ${tournament.name}${reason ? ` por ${reason}` : ""}.`);
  return { rewards: [`+${formatNumber(refund)} Merreis reembolso`], packReward: false };
}

async function resolveTournamentBattleOnServer(won, reason = "") {
  try {
    const payload = await postServerMutation(SERVER_COMPETITIVE_RESOLVE_ENDPOINT, {
      matchId: state.battle.competitiveMatchId,
      won,
      reason
    }, "Resultado");
    const result = payload.result || { rewards: [], packReward: false };
    state.pendingTournament = null;
    state.battle.status = result.status || state.battle.status;
    if (result.log) state.competitiveLog.unshift(result.log);
    if (result.packReward && result.pulls?.length) {
      grantTournamentPackFromServer(result.pulls, result.pack);
    }
    return {
      rewards: result.rewards || [],
      packReward: Boolean(result.packReward)
    };
  } catch (error) {
    return resolveTournamentBattleLocally(won, reason);
  }
}

function grantTournamentPack() {
  const pack = PACKS.find((item) => item.id === "recheado");
  state.packReveal = drawPackPulls(pack);
  state.packOpening = {
    packId: pack.id,
    packName: pack.name,
    stage: "opening"
  };
  schedulePackOpening();
}

function grantTournamentPackFromServer(pulls, serverPack) {
  const pack = PACKS.find((item) => item.id === (serverPack?.id || "recheado")) || PACKS.find((item) => item.id === "recheado");
  state.packReveal = pulls.map((pull) => ({ ...pull, revealed: false }));
  state.packOpening = {
    packId: pack.id,
    packName: pack.name,
    stage: "opening"
  };
  schedulePackOpening();
}

async function buyShopItem(itemId) {
  if (state.server.enabled) {
    await buyShopItemOnServer(itemId);
    return;
  }
  buyShopItemLocally(itemId);
}

function buyShopItemLocally(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return;

  if (state.save.cosmetics[item.id]) {
    state.save.selectedCosmetic = item.id;
    state.shopMessage = `${item.name} ativado.`;
    saveGame();
    renderAll();
    return;
  }

  if (state.save.merreis < item.cost) return;
  state.save.merreis -= item.cost;
  state.save.cosmetics[item.id] = true;
  state.save.selectedCosmetic = item.id;
  state.shopMessage = `${item.name} comprado.`;
  saveGame();
  renderAll();
}

async function buyShopItemOnServer(itemId) {
  try {
    const payload = await postServerMutation(SERVER_SHOP_ENDPOINT, { itemId }, "Comprando");
    if (payload?.message) state.shopMessage = payload.message;
    renderAll();
  } catch (error) {
    renderAll();
  }
}

function setTeamSlot(monsterId) {
  if (!state.save.collection[monsterId] || isGoalkeeper(monsterId)) return;
  const team = [...state.save.team];
  const currentIndex = team.indexOf(monsterId);
  if (currentIndex >= 0) {
    team[currentIndex] = team[state.selectedSlot];
  }
  team[state.selectedSlot] = monsterId;
  state.save.team = normalizeTeam(team);
  progressTutorial("team");
  saveGame();
  if (activeLockedBattle()) {
    renderAll();
    return;
  }
  if (state.battle && !state.battle.over) {
    clearTurnTimer();
    clearMatchTimer();
    state.battle = null;
    state.battleSceneOpen = false;
  }
  renderAll();
}

function setGoalkeeper(monsterId) {
  if (!MONSTER_BY_ID[monsterId] || !isGoalkeeper(monsterId)) return;
  if (!state.save.collection[monsterId]) return;
  state.save.goalkeeper = monsterId;
  progressTutorial("team");
  saveGame();
  if (activeLockedBattle()) {
    renderAll();
    return;
  }
  if (state.battle && !state.battle.over) {
    clearTurnTimer();
    clearMatchTimer();
    state.battle = null;
    state.battleSceneOpen = false;
  }
  renderAll();
}

async function doTrade() {
  const duplicates = MONSTERS.filter((monster) => (state.save.collection[monster.id] || 0) > 1);
  const missing = MONSTERS.filter((monster) => !state.save.collection[monster.id]);
  if (!duplicates.length || !missing.length || state.save.merreis < 60) return;

  const offered = MONSTER_BY_ID[state.selectedTrade.offer] || duplicates[0];
  const received = MONSTER_BY_ID[state.selectedTrade.wish] || missing[0];
  if (!offered || !received || (state.save.collection[offered.id] || 0) <= 1 || state.save.collection[received.id]) return;

  if (state.server.enabled) {
    try {
      const payload = await postServerMutation(SERVER_TRADE_ENDPOINT, {
        offerId: offered.id,
        wishId: received.id
      }, "Trocando");
      state.tradeLog.unshift(payload.message || `${offered.name} virou ${received.name}.`);
      progressTutorial("trade");
      renderAll();
    } catch (error) {
      state.tradeLog.unshift(error.message || "Troca indisponivel no servidor.");
      renderTrade();
    }
    return;
  }

  state.save.collection[offered.id] -= 1;
  state.save.collection[received.id] = 1;
  state.save.merreis -= 60;
  state.tradeLog.unshift(`${offered.name} virou ${received.name}.`);
  progressMission("trade", 1);
  progressTutorial("trade");
  saveGame();
  renderAll();
}

async function sendFriendGift(friendId) {
  const friend = FRIENDS.find((item) => item.id === friendId);
  if (!friend) return;
  if (!state.save.friendGifts[TODAY_KEY]) state.save.friendGifts[TODAY_KEY] = {};
  if (state.save.friendGifts[TODAY_KEY][friendId]) return;

  if (state.server.enabled) {
    try {
      const payload = await postServerMutation(SERVER_FRIEND_GIFT_ENDPOINT, {
        friendId
      }, "Enviando presente");
      state.tradeLog.unshift(payload.message || `Presente enviado para ${friend.name}: +80 Merreis.`);
      renderAll();
    } catch (error) {
      state.tradeLog.unshift(error.message || "Presente indisponivel no servidor.");
      renderTrade();
    }
    return;
  }

  state.save.friendGifts[TODAY_KEY][friendId] = true;
  state.save.merreis += 80;
  state.tradeLog.unshift(`Presente enviado para ${friend.name}: +80 Merreis.`);
  progressMission("gift", 1);
  saveGame();
  renderAll();
}

function challengeFriend(friendId) {
  const friend = FRIENDS.find((item) => item.id === friendId);
  if (!friend) return;
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  switchTab("battle");
  newBattle({
    enemyTeam: friend.team,
    enemyGoalkeeper: friend.goalkeeper,
    enemyName: friend.name,
    mode: "friend",
    matchTime: BATTLE_MODES.friend.matchTime,
    actionTime: BATTLE_MODES.friend.actionTime,
    playerPositions: selectedFormationPositions(),
    logIntro: `Desafio contra ${friend.name} comecou.`
  });
}

async function claimMission(id) {
  if (state.server.enabled) {
    await claimMissionOnServer(id);
    return;
  }
  claimMissionLocally(id);
}

function claimMissionLocally(id) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission) return;
  if (!state.save.missions[id]) {
    state.save.missions[id] = { progress: 0, claimed: false };
  }
  const status = missionStatus(mission);
  if (status.claimed || status.progress < mission.target) return;
  state.save.missions[id].claimed = true;
  state.save.merreis += mission.reward;
  saveGame();
  renderAll();
}

async function claimMissionOnServer(id) {
  try {
    await postServerMutation(SERVER_CLAIM_MISSION_ENDPOINT, { missionId: id }, "Resgatando");
    renderAll();
  } catch (error) {
    renderAll();
  }
}

function progressMission(id, amount) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission || mission.scope === "album") return;
  if (!state.save.missions[id]) {
    state.save.missions[id] = { progress: 0, claimed: false };
  }
  state.save.missions[id].progress = clamp(state.save.missions[id].progress + amount, 0, mission.target);
  saveGame();
}

function progressTutorial(id) {
  if (!state.save.tutorial || state.save.tutorial[id]) return;
  queueTutorialResult(id);
}

function claimTutorialReward() {
  const complete = TUTORIAL_STEPS.every((step) => state.save.tutorial[step.id]);
  if (!complete || state.save.tutorialRewardClaimed) return;
  state.save.tutorialRewardClaimed = true;
  state.save.merreis += 500;
  state.save.fragments += 25;
  saveGame();
  renderAll();
}

function resetSave() {
  const confirmed = window.confirm("Reiniciar Merreis, colecao, time, liga e missoes?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  state.save = defaultSave();
  state.pendingTournament = null;
  state.pendingRanked = null;
  state.tutorialResult = null;
  clearPackOpeningTimers();
  state.packOpening = null;
  state.packPurchasePending = false;
  state.packReveal = [];
  state.tradeLog = [];
  state.competitiveLog = [];
  state.shopMessage = "Itens sem vantagem direta";
  state.selectedTrade = { offer: "", wish: "" };
  clearTurnTimer();
  clearMatchTimer();
  state.battle = null;
  state.battleSceneOpen = false;
  saveGame();
  renderAll();
}

document.addEventListener("DOMContentLoaded", setup);
