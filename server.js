const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const vm = require("node:vm");
const { DatabaseSync } = require("node:sqlite");
const { URL } = require("node:url");

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 8025;
const HOST = process.env.HOST || (IS_PRODUCTION ? "0.0.0.0" : "127.0.0.1");
const ROOT_DIR = __dirname;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH)
  : path.join(ROOT_DIR, "server-data");
const SAVES_DIR = path.join(DATA_DIR, "saves");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");
const LOBBIES_FILE = path.join(DATA_DIR, "lobbies.json");
const DB_FILE = path.join(DATA_DIR, "kick-tazzos.db");
const ROOT_PREFIX = `${ROOT_DIR}${path.sep}`;
const PLAYER_COOKIE = "kick_tazzos_player";
const MAX_SAVE_BYTES = 1024 * 1024 * 2;
const ONLINE_LOBBY_CAPACITY = 2;
const ONLINE_LOBBY_TTL_MS = 45 * 60 * 1000;
const ONLINE_PLAYER_IDLE_MS = 8 * 60 * 1000;
const ONLINE_PLAYER_AWAY_MS = Number(process.env.ONLINE_PLAYER_AWAY_MS) || 15000;
const ONLINE_FORFEIT_GRACE_MS = Number(process.env.ONLINE_FORFEIT_GRACE_MS) || 60000;
const FIREBASE_AUTH_PROVIDER_LABELS = {
  google: "Google",
  facebook: "Facebook"
};
const FIREBASE_SDK_VERSION = "12.13.0";
const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const FIREBASE_DEFAULT_AUTH_PROVIDERS = "google";
const FIREBASE_DEFAULT_CONFIG = Object.freeze({
  apiKey: "AIzaSyC6B8mrDr1FMEgL1ihqLV3ERwUUNVqAqDs",
  authDomain: "tazzostrike.firebaseapp.com",
  projectId: "tazzostrike",
  appId: "1:877449815393:web:e29c45423b8f81d7aa1120",
  messagingSenderId: "877449815393",
  storageBucket: "tazzostrike.firebasestorage.app"
});
const LEGENDARY_BOOST_TAZZOS = 50;
const LEGENDARY_BOOST_MAX_TAZZOS = 100;
const LEGENDARY_BOOST_MULTIPLIER = 2;
const LEGENDARY_BOOST_MAX_MULTIPLIER = 4;
const ONLINE_TARGET_ACTIONS = new Set(["move", "retreat", "swap", "dribble", "shot", "pressure"]);
const ONLINE_ACTION_LABELS = {
  pass: "passou",
  move: "moveu",
  retreat: "recuou",
  swap: "trocou",
  dribble: "driblou",
  shot: "chutou",
  pressure: "pressionou",
  keeper: "usou goleiro",
  forfeit: "desistiu"
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf"
};

function loadGameData() {
  const source = require("node:fs").readFileSync(path.join(ROOT_DIR, "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "data.js" });
  return sandbox.window.TAZZOMON_DATA;
}

const GAME_DATA = loadGameData();
const {
  MONSTERS,
  MONSTER_BY_ID,
  RARITIES,
  RANKS,
  TOURNAMENTS,
  PACKS,
  SHOP_ITEMS,
  MISSIONS,
  FRIENDS,
  BATTLE_MODES,
  BATTLE_FORMATIONS,
  RANKED_OPPONENTS,
  TOURNAMENT_OPPONENTS,
  TUTORIAL_STEPS
} = GAME_DATA;
const onlineLobbies = new Map();
const wsClients = new Set();
let storageDb = null;
let onlineLobbiesPersistQueue = Promise.resolve();
let onlineLobbiesWriteId = 0;
let onlineHeartbeat = null;
let onlineTurnHeartbeat = null;
let shuttingDown = false;
let firebaseCertCache = { certs: null, expiresAt: 0 };

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((entry) => {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    return [rawKey, decodeURIComponent(rawValue.join("=") || "")];
  }).filter(([key]) => key));
}

function isValidPlayerId(value) {
  return /^[a-f0-9-]{36}$/i.test(String(value || ""));
}

function getPlayer(req) {
  const cookies = parseCookies(req.headers.cookie);
  const existingId = cookies[PLAYER_COOKIE];
  const playerId = isValidPlayerId(existingId) ? existingId : crypto.randomUUID();
  const isNew = playerId !== existingId;
  return { playerId, isNew };
}

function playerCookie(playerId) {
  return `${PLAYER_COOKIE}=${encodeURIComponent(playerId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function clearPlayerCookie() {
  return `${PLAYER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function savePath(playerId) {
  return path.join(SAVES_DIR, `${playerId}.json`);
}

function db() {
  if (!storageDb) throw new Error("Banco de dados ainda nao inicializado.");
  return storageDb;
}

function jsonFromDb(value, fallback = null) {
  try {
    return JSON.parse(String(value || ""));
  } catch (error) {
    return fallback;
  }
}

function runInTransaction(fn) {
  const database = db();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function getMeta(key) {
  const row = db().prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return row?.value || "";
}

function setMeta(key, value) {
  db().prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(key, String(value));
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function initializeStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  storageDb = new DatabaseSync(DB_FILE);
  storageDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      profile_key TEXT PRIMARY KEY,
      player_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saves (
      player_id TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL,
      save_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lobbies (
      id TEXT PRIMARY KEY,
      updated_at INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_lobbies_updated_at ON lobbies(updated_at);
  `);
  await migrateJsonStorageToDatabase();
}

function closeStorage() {
  if (!storageDb) return;
  try {
    storageDb.close();
  } catch (error) {
    console.error("Erro ao fechar banco de dados.", error);
  } finally {
    storageDb = null;
  }
}

async function migrateJsonStorageToDatabase() {
  if (getMeta("json_migrated_v1")) return;
  const profiles = await readJsonFile(PROFILES_FILE, { version: 1, profiles: {} });
  const saveFiles = await fs.readdir(SAVES_DIR).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const lobbySnapshot = await readJsonFile(LOBBIES_FILE, { version: 1, lobbies: [] });
  runInTransaction((database) => {
    const insertProfile = database.prepare(`
      INSERT OR IGNORE INTO profiles (profile_key, player_id, name, data_json)
      VALUES (?, ?, ?, ?)
    `);
    Object.entries(profiles.profiles || {}).forEach(([key, profile]) => {
      if (!profile || !isValidPlayerId(profile.playerId)) return;
      insertProfile.run(key, profile.playerId, String(profile.name || "Visitante").slice(0, 24), JSON.stringify(profile));
    });

    const insertSave = database.prepare(`
      INSERT OR IGNORE INTO saves (player_id, updated_at, save_json)
      VALUES (?, ?, ?)
    `);
    saveFiles.forEach((file) => {
      if (!file.endsWith(".json")) return;
      const playerId = file.replace(/\.json$/, "");
      if (!isValidPlayerId(playerId)) return;
      try {
        const raw = require("node:fs").readFileSync(path.join(SAVES_DIR, file), "utf8");
        const record = JSON.parse(raw.replace(/^\uFEFF/, ""));
        insertSave.run(playerId, record.updatedAt || new Date().toISOString(), JSON.stringify(record.save || {}));
      } catch (error) {
        // Ignore corrupt legacy save files; the DB should still boot.
      }
    });

    const insertLobby = database.prepare(`
      INSERT OR IGNORE INTO lobbies (id, updated_at, data_json)
      VALUES (?, ?, ?)
    `);
    (Array.isArray(lobbySnapshot.lobbies) ? lobbySnapshot.lobbies : []).forEach((lobby) => {
      const sanitized = sanitizeStoredOnlineLobby(lobby);
      if (!sanitized) return;
      insertLobby.run(sanitized.id, sanitized.updatedAt, JSON.stringify(sanitized));
    });
    database.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run("json_migrated_v1", new Date().toISOString());
  });
}

function profileKey(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function cleanProfileName(name) {
  return String(name || "")
    .replace(/[<>"&]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function validateProfileInput(name, pin) {
  const displayName = cleanProfileName(name);
  const key = profileKey(displayName);
  const safePin = String(pin || "").trim();
  if (key.length < 3 || displayName.length < 3) {
    const error = new Error("Nome precisa ter pelo menos 3 caracteres.");
    error.status = 400;
    throw error;
  }
  if (safePin.length < 4 || safePin.length > 32) {
    const error = new Error("PIN precisa ter entre 4 e 32 caracteres.");
    error.status = 400;
    throw error;
  }
  return { displayName, key, pin: safePin };
}

function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString("hex");
}

function configuredFirebaseProviders() {
  const raw = process.env.FIREBASE_AUTH_PROVIDERS || FIREBASE_DEFAULT_AUTH_PROVIDERS;
  const providers = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => FIREBASE_AUTH_PROVIDER_LABELS[item]);
  return [...new Set(providers)];
}

function firebaseConfigValue(envName, configName) {
  return process.env[envName] || FIREBASE_DEFAULT_CONFIG[configName] || "";
}

function firebaseProjectId() {
  return firebaseConfigValue("FIREBASE_PROJECT_ID", "projectId");
}

function firebaseClientConfig() {
  const config = {
    apiKey: firebaseConfigValue("FIREBASE_API_KEY", "apiKey"),
    authDomain: firebaseConfigValue("FIREBASE_AUTH_DOMAIN", "authDomain"),
    projectId: firebaseProjectId(),
    appId: firebaseConfigValue("FIREBASE_APP_ID", "appId"),
    messagingSenderId: firebaseConfigValue("FIREBASE_MESSAGING_SENDER_ID", "messagingSenderId"),
    storageBucket: firebaseConfigValue("FIREBASE_STORAGE_BUCKET", "storageBucket")
  };
  const publicConfig = Object.fromEntries(Object.entries(config).filter(([, value]) => value));
  return {
    enabled: Boolean(config.apiKey && config.authDomain && config.projectId && config.appId),
    config: publicConfig,
    providers: configuredFirebaseProviders(),
    sdkVersion: FIREBASE_SDK_VERSION
  };
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

function parseJwtPart(value) {
  return JSON.parse(base64UrlDecode(value).toString("utf8"));
}

async function firebasePublicCerts() {
  if (firebaseCertCache.certs && firebaseCertCache.expiresAt > Date.now()) {
    return firebaseCertCache.certs;
  }
  const response = await fetch(FIREBASE_CERTS_URL, { cache: "no-store" });
  if (!response.ok) {
    const error = new Error("Nao foi possivel buscar certificados do Firebase.");
    error.status = 503;
    throw error;
  }
  const certs = await response.json();
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1]) || 3600;
  firebaseCertCache = {
    certs,
    expiresAt: Date.now() + Math.max(60, maxAge - 60) * 1000
  };
  return certs;
}

async function verifyFirebaseIdToken(idToken) {
  const token = String(idToken || "").trim();
  const projectId = firebaseProjectId();
  if (!token) {
    const error = new Error("Token Firebase ausente.");
    error.status = 400;
    throw error;
  }
  if (!projectId) {
    const error = new Error("Firebase nao configurado no servidor.");
    error.status = 503;
    throw error;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Formato JWT invalido.");
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = parseJwtPart(encodedHeader);
    const payload = parseJwtPart(encodedPayload);
    if (header.alg !== "RS256" || !header.kid) throw new Error("Cabecalho JWT invalido.");

    const certs = await firebasePublicCerts();
    const cert = certs[header.kid];
    if (!cert) throw new Error("Certificado Firebase nao encontrado.");

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();
    if (!verifier.verify(cert, base64UrlDecode(encodedSignature))) {
      throw new Error("Assinatura Firebase invalida.");
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== projectId) throw new Error("Audiencia Firebase invalida.");
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Emissor Firebase invalido.");
    if (!payload.sub || typeof payload.sub !== "string" || payload.sub.length > 128) throw new Error("Usuario Firebase invalido.");
    if (Number(payload.exp) <= now) throw new Error("Token Firebase expirado.");
    if (Number(payload.iat) > now + 300) throw new Error("Token Firebase emitido no futuro.");

    return { ...payload, uid: payload.sub };
  } catch (error) {
    const authError = new Error("Login Firebase invalido ou expirado.");
    authError.status = 401;
    throw authError;
  }
}

function firebaseProfileKey(uid) {
  return `firebase-${crypto.createHash("sha256").update(String(uid)).digest("hex").slice(0, 24)}`;
}

function firebaseDisplayName(decodedToken) {
  const emailName = String(decodedToken.email || "").split("@")[0];
  const displayName = cleanProfileName(decodedToken.name || emailName || `Jogador ${String(decodedToken.uid || "").slice(0, 6)}`);
  return displayName.length >= 3 ? displayName : `Jogador ${String(decodedToken.uid || "").slice(0, 6) || "Firebase"}`;
}

function firebaseAuthProfile(decodedToken, now = new Date().toISOString()) {
  return {
    uid: String(decodedToken.uid || ""),
    email: String(decodedToken.email || "").slice(0, 160),
    emailVerified: Boolean(decodedToken.email_verified),
    provider: String(decodedToken.firebase?.sign_in_provider || "firebase").slice(0, 40),
    picture: String(decodedToken.picture || "").slice(0, 500),
    lastLoginAt: now
  };
}

function firebaseProfileEntry(profiles, uid) {
  return Object.entries(profiles.profiles || {}).find(([, profile]) => (
    profile?.authProviders?.firebase?.uid === uid
  )) || null;
}

function safeProfileImageUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href.slice(0, 500) : "";
  } catch (error) {
    return "";
  }
}

function profileEntryForPlayer(profiles, playerId) {
  return Object.entries(profiles.profiles || {}).find(([, profile]) => (
    profile?.playerId === playerId
  )) || null;
}

function publicProfile(profile) {
  if (!profile) return null;
  const firebaseAuth = profile.authProviders?.firebase || null;
  return {
    playerId: profile.playerId,
    name: profile.name,
    createdAt: profile.createdAt,
    lastLoginAt: profile.lastLoginAt || profile.createdAt,
    authProvider: firebaseAuth ? "firebase" : "pin",
    authLabel: firebaseAuth ? "Google" : "Nome/PIN",
    authEmail: firebaseAuth ? safeText(firebaseAuth.email, "", 160) : "",
    authEmailVerified: firebaseAuth ? Boolean(firebaseAuth.emailVerified) : false,
    authPicture: firebaseAuth ? safeProfileImageUrl(firebaseAuth.picture) : ""
  };
}

async function readProfiles() {
  const rows = db().prepare("SELECT profile_key, data_json FROM profiles").all();
  const profiles = {};
  rows.forEach((row) => {
    const profile = jsonFromDb(row.data_json, null);
    if (profile && profile.key) profiles[profile.key] = profile;
    else if (profile) profiles[row.profile_key] = { ...profile, key: row.profile_key };
  });
  return { version: 1, profiles };
}

async function writeProfiles(data) {
  const profiles = data?.profiles && typeof data.profiles === "object" ? data.profiles : {};
  runInTransaction((database) => {
    database.exec("DELETE FROM profiles");
    const insertProfile = database.prepare(`
      INSERT INTO profiles (profile_key, player_id, name, data_json)
      VALUES (?, ?, ?, ?)
    `);
    Object.entries(profiles).forEach(([key, profile]) => {
      if (!profile || !isValidPlayerId(profile.playerId)) return;
      insertProfile.run(key, profile.playerId, String(profile.name || "Visitante").slice(0, 24), JSON.stringify({ ...profile, key }));
    });
  });
}

function safeJsonClone(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch (error) {
    return fallback;
  }
}

function numericTimestamp(value, fallback = Date.now()) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function safeText(value, fallback = "", limit = 180) {
  return String(value || fallback).replace(/[<>"&]/g, "").slice(0, limit);
}

function serializeOnlineLobbies() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    lobbies: [...onlineLobbies.values()].map((lobby) => ({
      id: lobby.id,
      hostPlayerId: lobby.hostPlayerId,
      createdAt: lobby.createdAt,
      updatedAt: lobby.updatedAt,
      lastMatchSummary: safeJsonClone(lobby.lastMatchSummary, null),
      rematchVotes: safeJsonClone(lobby.rematchVotes || {}, {}),
      players: lobby.players.map((player) => ({
        playerId: player.playerId,
        name: player.name,
        loadout: player.loadout,
        ready: Boolean(player.ready),
        joinedAt: player.joinedAt,
        lastSeenAt: player.lastSeenAt,
        awaySince: player.awaySince || null
      })),
      match: lobby.match ? {
        ...safeJsonClone(lobby.match, {}),
        forfeitResolving: undefined
      } : null
    }))
  };
}

async function persistOnlineLobbies() {
  onlineLobbiesPersistQueue = onlineLobbiesPersistQueue.catch(() => {}).then(async () => {
    const snapshot = serializeOnlineLobbies();
    runInTransaction((database) => {
      database.exec("DELETE FROM lobbies");
      const insertLobby = database.prepare(`
        INSERT INTO lobbies (id, updated_at, data_json)
        VALUES (?, ?, ?)
      `);
      snapshot.lobbies.forEach((lobby) => {
        insertLobby.run(lobby.id, Number(lobby.updatedAt) || Date.now(), JSON.stringify(lobby));
      });
      database.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run("lobbies_updated_at", snapshot.updatedAt);
    });
  });
  return onlineLobbiesPersistQueue;
}

function persistOnlineLobbiesSoon() {
  persistOnlineLobbies().catch(() => {});
}

async function readStoredOnlineLobbies() {
  const rows = db().prepare("SELECT data_json FROM lobbies ORDER BY updated_at DESC").all();
  return rows.map((row) => jsonFromDb(row.data_json, null)).filter(Boolean);
}

function sanitizeStoredOnlinePlayer(player, fallbackTime) {
  if (!player || !isValidPlayerId(player.playerId)) return null;
  return {
    playerId: player.playerId,
    name: safeText(player.name, `Visitante ${String(player.playerId).slice(0, 4).toUpperCase()}`, 24),
    loadout: sanitizeOnlineLoadout(player.loadout || defaultServerSave()),
    ready: Boolean(player.ready),
    joinedAt: numericTimestamp(player.joinedAt, fallbackTime),
    lastSeenAt: numericTimestamp(player.lastSeenAt, fallbackTime),
    awaySince: player.awaySince ? numericTimestamp(player.awaySince, fallbackTime) : null
  };
}

function sanitizeStoredOnlineMatchParticipant(entry, fallback) {
  const source = entry && typeof entry === "object" ? entry : fallback || {};
  if (!isValidPlayerId(source.playerId)) return null;
  const slot = source.slot === "away" ? "away" : "home";
  return {
    slot,
    playerId: source.playerId,
    name: safeText(source.name, `Visitante ${String(source.playerId).slice(0, 4).toUpperCase()}`, 24),
    loadout: sanitizeOnlineLoadout(source.loadout || defaultServerSave())
  };
}

function sanitizeStoredOnlineMatch(match, players, fallbackTime) {
  if (!match || typeof match !== "object") return null;
  const participants = (Array.isArray(match.players) ? match.players : [])
    .map((entry, index) => sanitizeStoredOnlineMatchParticipant(entry, {
      ...players[index],
      slot: onlineSlotForIndex(index)
    }))
    .filter(Boolean);
  if (participants.length < ONLINE_LOBBY_CAPACITY) {
    players.slice(0, ONLINE_LOBBY_CAPACITY).forEach((player, index) => {
      if (!participants.some((entry) => entry.playerId === player.playerId)) {
        participants.push(sanitizeStoredOnlineMatchParticipant({
          ...player,
          slot: onlineSlotForIndex(index)
        }));
      }
    });
  }
  if (participants.length < ONLINE_LOBBY_CAPACITY) return null;
  const battleState = match.battleState && Array.isArray(match.battleState.pieces)
    ? safeJsonClone(match.battleState, null)
    : createOnlineBattleState({ players: participants, match: { players: participants } });
  const over = Boolean(battleState?.over);
  const actionTime = onlineActionDurationSeconds(match);
  const restored = {
    id: isValidPlayerId(match.id) ? match.id : crypto.randomUUID(),
    status: over ? "finished" : safeText(match.status, "ready", 32),
    createdAt: numericTimestamp(match.createdAt, fallbackTime),
    updatedAt: numericTimestamp(match.updatedAt, fallbackTime),
    finishedAt: match.finishedAt ? numericTimestamp(match.finishedAt, fallbackTime) : null,
    resolvedAt: match.resolvedAt || null,
    round: Math.max(1, Math.floor(Number(match.round)) || 1),
    sequence: Math.max(0, Math.floor(Number(match.sequence)) || 0),
    lastAction: safeJsonClone(match.lastAction, null),
    battleState,
    turnPlayerId: isValidPlayerId(match.turnPlayerId) ? match.turnPlayerId : participants[0].playerId,
    actionTime,
    actionDeadlineAt: match.actionDeadlineAt ? numericTimestamp(match.actionDeadlineAt, fallbackTime + actionTime * 1000) : null,
    score: {
      home: Math.max(0, Math.floor(Number(match.score?.home)) || 0),
      away: Math.max(0, Math.floor(Number(match.score?.away)) || 0)
    },
    message: safeText(match.message, "Partida online restaurada.", 220),
    log: Array.isArray(match.log) ? match.log.map((item) => safeText(item, "", 220)).filter(Boolean).slice(-25) : [],
    players: participants.slice(0, ONLINE_LOBBY_CAPACITY),
    results: match.results && typeof match.results === "object" ? safeJsonClone(match.results, {}) : {}
  };
  if (over || restored.status === "finished") {
    restored.actionDeadlineAt = null;
  } else if (!restored.actionDeadlineAt) {
    restored.actionDeadlineAt = Date.now() + restored.actionTime * 1000;
  }
  return restored;
}

function sanitizeStoredRematchVotes(raw, players, fallbackTime) {
  if (!raw || typeof raw !== "object") return {};
  const playerIds = new Set(players.map((player) => player.playerId));
  return Object.fromEntries(Object.entries(raw)
    .filter(([playerId]) => playerIds.has(playerId))
    .map(([playerId, votedAt]) => [playerId, numericTimestamp(votedAt, fallbackTime)]));
}

function sanitizeStoredOnlineLobby(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(id)) return null;
  const now = Date.now();
  const players = (Array.isArray(raw.players) ? raw.players : [])
    .map((player) => sanitizeStoredOnlinePlayer(player, now))
    .filter(Boolean)
    .slice(0, ONLINE_LOBBY_CAPACITY);
  if (!players.length) return null;
  const hostPlayerId = players.some((player) => player.playerId === raw.hostPlayerId)
    ? raw.hostPlayerId
    : players[0].playerId;
  const lobby = {
    id,
    hostPlayerId,
    createdAt: numericTimestamp(raw.createdAt, now),
    updatedAt: numericTimestamp(raw.updatedAt, now),
    lastMatchSummary: raw.lastMatchSummary && typeof raw.lastMatchSummary === "object" ? safeJsonClone(raw.lastMatchSummary, null) : null,
    rematchVotes: sanitizeStoredRematchVotes(raw.rematchVotes, players, now),
    players
  };
  lobby.match = sanitizeStoredOnlineMatch(raw.match, players, lobby.updatedAt);
  return lobby;
}

async function loadOnlineLobbies() {
  const stored = await readStoredOnlineLobbies();
  onlineLobbies.clear();
  stored
    .map(sanitizeStoredOnlineLobby)
    .filter(Boolean)
    .forEach((lobby) => {
      onlineLobbies.set(lobby.id, lobby);
    });
  cleanupOnlineLobbies({ persist: false });
  await persistOnlineLobbies();
  return onlineLobbies.size;
}

async function profileForPlayer(playerId) {
  const profiles = await readProfiles();
  return Object.values(profiles.profiles).find((profile) => profile.playerId === playerId) || null;
}

async function requireProfileForPlayer(playerId) {
  const profile = await profileForPlayer(playerId);
  if (!profile) {
    const error = new Error("Entre em uma conta antes de jogar.");
    error.status = 401;
    throw error;
  }
  return profile;
}

function profilesByPlayerId(profiles) {
  return Object.fromEntries(Object.values(profiles.profiles).map((profile) => [profile.playerId, profile]));
}

function lobbyCode() {
  let code = "";
  do {
    code = crypto.randomBytes(3).toString("hex").toUpperCase();
  } while (onlineLobbies.has(code));
  return code;
}

function cleanupOnlineLobbies(options = {}) {
  const now = Date.now();
  let changed = false;
  for (const [id, lobby] of onlineLobbies) {
    refreshOnlineLobbyPresence(lobby);
    const keepIdlePlayers = Boolean(lobby.match && !lobby.match.battleState?.over);
    const playerCount = lobby.players.length;
    lobby.players = lobby.players.filter((player) => keepIdlePlayers || now - player.lastSeenAt < ONLINE_PLAYER_IDLE_MS);
    if (!lobby.players.length || now - lobby.updatedAt > ONLINE_LOBBY_TTL_MS) {
      onlineLobbies.delete(id);
      changed = true;
      continue;
    }
    if (lobby.players.length !== playerCount) changed = true;
    changed = pruneOnlineRematchVotes(lobby) || changed;
    if (!lobby.players.some((player) => player.playerId === lobby.hostPlayerId)) {
      lobby.hostPlayerId = lobby.players[0].playerId;
      changed = true;
    }
    changed = syncOnlineLobbyMatch(lobby) || changed;
  }
  if (changed && options.persist !== false) persistOnlineLobbiesSoon();
  return changed;
}

function pruneOnlineRematchVotes(lobby) {
  if (!lobby?.rematchVotes || typeof lobby.rematchVotes !== "object") {
    if (lobby) lobby.rematchVotes = {};
    return false;
  }
  const liveIds = new Set(lobby.players.map((player) => player.playerId));
  let changed = false;
  Object.keys(lobby.rematchVotes).forEach((playerId) => {
    if (!liveIds.has(playerId)) {
      delete lobby.rematchVotes[playerId];
      changed = true;
    }
  });
  return changed;
}

function onlinePlayerHasSocket(playerId) {
  return [...wsClients].some((client) => client.playerId === playerId && !client.socket.destroyed);
}

function refreshOnlineLobbyPresence(lobby) {
  if (!lobby) return;
  const now = Date.now();
  lobby.players.forEach((player) => {
    const present = onlinePlayerHasSocket(player.playerId) || (!player.awaySince && now - player.lastSeenAt <= ONLINE_PLAYER_AWAY_MS);
    if (present) {
      player.awaySince = null;
    } else if (!player.awaySince) {
      player.awaySince = Math.max(player.lastSeenAt + ONLINE_PLAYER_AWAY_MS, player.lastSeenAt);
    }
  });
}

function onlinePlayerPresence(player) {
  const now = Date.now();
  const online = onlinePlayerHasSocket(player.playerId) || (!player.awaySince && now - player.lastSeenAt <= ONLINE_PLAYER_AWAY_MS);
  return {
    online,
    away: !online,
    awaySince: online || !player.awaySince ? null : new Date(player.awaySince).toISOString(),
    lastSeenAt: new Date(player.lastSeenAt).toISOString()
  };
}

function markOnlinePlayerConnectionChanged(playerId) {
  let changed = false;
  for (const lobby of onlineLobbies.values()) {
    const player = lobby.players.find((item) => item.playerId === playerId);
    if (!player) continue;
    if (onlinePlayerHasSocket(playerId)) {
      player.awaySince = null;
    } else {
      player.awaySince = Date.now();
    }
    lobby.updatedAt = Date.now();
    changed = true;
  }
  if (changed) persistOnlineLobbiesSoon();
}

function currentLobbyForPlayer(playerId) {
  cleanupOnlineLobbies();
  return [...onlineLobbies.values()].find((lobby) => lobby.players.some((player) => player.playerId === playerId)) || null;
}

function removePlayerFromOnlineLobbies(playerId) {
  for (const [id, lobby] of onlineLobbies) {
    const originalLength = lobby.players.length;
    const keepFinishedMatch = Boolean(lobby.match?.battleState?.over);
    lobby.players = lobby.players.filter((player) => player.playerId !== playerId);
    if (lobby.players.length === originalLength) continue;
    lobby.updatedAt = Date.now();
    if (!lobby.players.length) {
      onlineLobbies.delete(id);
    } else if (lobby.hostPlayerId === playerId) {
      lobby.hostPlayerId = lobby.players[0].playerId;
      pruneOnlineRematchVotes(lobby);
      lobby.players.forEach((player) => {
        player.ready = false;
      });
      if (!keepFinishedMatch) lobby.match = null;
    } else {
      pruneOnlineRematchVotes(lobby);
      lobby.players.forEach((player) => {
        player.ready = false;
      });
      if (!keepFinishedMatch) lobby.match = null;
    }
  }
}

async function onlinePlayerName(playerId) {
  const profile = await profileForPlayer(playerId);
  return profile?.name || `Visitante ${String(playerId).slice(0, 4).toUpperCase()}`;
}

function sanitizeOnlineLoadout(save = {}) {
  const normalized = normalizeServerSave(save || defaultServerSave());
  const fieldTeam = Array.isArray(normalized.team)
    ? normalized.team.filter((id) => MONSTER_BY_ID[id] && !isGoalkeeper(MONSTER_BY_ID[id])).slice(0, 3)
    : [];
  const fallbackTeam = defaultServerSave().team;
  const team = [...fieldTeam, ...fallbackTeam].filter((id, index, list) => list.indexOf(id) === index).slice(0, 3);
  const goalkeeper = MONSTER_BY_ID[normalized.goalkeeper] && isGoalkeeper(MONSTER_BY_ID[normalized.goalkeeper])
    ? normalized.goalkeeper
    : defaultServerSave().goalkeeper;
  const positions = BATTLE_FORMATIONS.center.positions.map((pos) => ({ ...pos }));
  const upgrades = Object.fromEntries(team.map((id) => [
    id,
    clamp(Number(normalized.upgrades?.[id]) || 0, 0, 2)
  ]));
  return { team, goalkeeper, positions, upgrades };
}

async function onlinePlayerLoadout(playerId) {
  const record = await readOrCreateSave(playerId);
  return sanitizeOnlineLoadout(record.save);
}

async function updateOnlinePlayerLoadout(lobby, playerId) {
  const player = lobby.players.find((item) => item.playerId === playerId);
  if (!player) return;
  player.loadout = await onlinePlayerLoadout(playerId);
}

function publicOnlineLobby(lobby, viewerId) {
  refreshOnlineLobbyPresence(lobby);
  const readyCount = lobby.players.filter((player) => player.ready).length;
  const matchFinished = Boolean(lobby.match?.battleState?.over);
  const status = lobby.match
    ? matchFinished ? "finished" : "playing"
    : lobby.players.length < ONLINE_LOBBY_CAPACITY
    ? "waiting"
    : readyCount === ONLINE_LOBBY_CAPACITY
    ? "ready"
    : "forming";
  return {
    id: lobby.id,
    capacity: ONLINE_LOBBY_CAPACITY,
    playerCount: lobby.players.length,
    readyCount,
    status,
    canStart: !lobby.match && status === "ready",
    createdAt: new Date(lobby.createdAt).toISOString(),
    updatedAt: new Date(lobby.updatedAt).toISOString(),
    lastMatchSummary: lobby.lastMatchSummary || null,
    rematch: publicOnlineRematch(lobby, viewerId),
    match: lobby.match ? publicOnlineMatch(lobby, viewerId) : null,
    players: lobby.players.map((player) => {
      const presence = onlinePlayerPresence(player);
      return {
        name: player.name,
        ready: player.ready,
        isHost: player.playerId === lobby.hostPlayerId,
        isCurrent: player.playerId === viewerId,
        online: presence.online,
        away: presence.away,
        awaySince: presence.awaySince,
        lastSeenAt: presence.lastSeenAt
      };
    })
  };
}

function publicOnlineRematch(lobby, viewerId) {
  if (!lobby.match?.battleState?.over) {
    return {
      canRequest: false,
      requestedByYou: false,
      requestedCount: 0,
      requiredCount: ONLINE_LOBBY_CAPACITY,
      waitingFor: []
    };
  }
  const participants = onlineMatchParticipants(lobby).filter((player) => player.playerId);
  const votes = lobby.rematchVotes && typeof lobby.rematchVotes === "object" ? lobby.rematchVotes : {};
  const requested = participants.filter((player) => votes[player.playerId]);
  const waitingFor = participants
    .filter((player) => !votes[player.playerId])
    .map((player) => player.name);
  return {
    canRequest: true,
    requestedByYou: Boolean(votes[viewerId]),
    requestedCount: requested.length,
    requiredCount: Math.max(ONLINE_LOBBY_CAPACITY, participants.length),
    waitingFor
  };
}

function publicOnlineMatch(lobby, viewerId) {
  const viewerSlot = onlineSlotForPlayer(lobby, viewerId);
  const opponentSlot = viewerSlot === "home" ? "away" : "home";
  const turnPlayer = onlineMatchEntryForPlayer(lobby, lobby.match.turnPlayerId);
  const viewer = onlineMatchEntryForSlot(lobby, viewerSlot) || onlineMatchEntryForPlayer(lobby, viewerId) || onlineMatchParticipants(lobby)[0];
  const opponent = onlineMatchEntryForSlot(lobby, opponentSlot) || onlineMatchParticipants(lobby).find((player) => player.playerId !== viewer?.playerId) || viewer;
  const viewerLoadout = viewer?.loadout || sanitizeOnlineLoadout(defaultServerSave());
  const opponentLoadout = opponent?.loadout || sanitizeOnlineLoadout(defaultServerSave());
  const finished = Boolean(lobby.match.battleState?.over);
  const rematch = publicOnlineRematch(lobby, viewerId);
  return {
    id: lobby.match.id,
    status: lobby.match.status,
    round: lobby.match.round,
    score: lobby.match.score,
    message: rematch.requestedCount ? lobby.match.message : publicOnlineMessage(lobby, lobby.match.lastAction, viewerId) || lobby.match.message,
    sequence: lobby.match.sequence || 0,
    rematch,
    actionDeadlineAt: lobby.match.actionDeadlineAt ? new Date(lobby.match.actionDeadlineAt).toISOString() : null,
    actionSecondsRemaining: onlineActionSecondsRemaining(lobby.match),
    log: publicOnlineLog(lobby, viewerId),
    lastAction: publicOnlineAction(lobby, viewerId),
    battleState: publicOnlineBattleState(lobby, viewerId),
    turnName: finished ? "Partida encerrada" : turnPlayer?.name || "Jogador",
    isYourTurn: !finished && lobby.match.turnPlayerId === viewerId,
    playerSlot: viewerSlot,
    opponentName: opponent?.name || "Visitante",
    absence: publicOnlineAbsence(lobby, viewerId),
    playerTeam: viewerLoadout.team,
    playerGoalkeeper: viewerLoadout.goalkeeper,
    playerPositions: viewerLoadout.positions,
    enemyTeam: opponentLoadout.team,
    enemyGoalkeeper: opponentLoadout.goalkeeper,
    enemyPositions: mirrorPositions(opponentLoadout.positions),
    matchTime: BATTLE_MODES.friend.matchTime,
    actionTime: onlineActionDurationSeconds(lobby.match),
    createdAt: new Date(lobby.match.createdAt).toISOString(),
    finishedAt: lobby.match.finishedAt ? new Date(lobby.match.finishedAt).toISOString() : null
  };
}

function onlineActionDurationSeconds(match = null) {
  const matchSeconds = Math.floor(Number(match?.actionTime));
  const envSeconds = Math.floor(Number(process.env.ONLINE_ACTION_TIME_SECONDS));
  const defaultSeconds = Math.floor(Number(BATTLE_MODES.friend.actionTime)) || 20;
  return Math.max(1, matchSeconds || envSeconds || defaultSeconds);
}

function setOnlineActionDeadline(lobby, now = Date.now()) {
  if (!lobby?.match) return null;
  const match = lobby.match;
  if (match.battleState?.over || match.status === "finished" || !match.turnPlayerId) {
    match.actionDeadlineAt = null;
    return null;
  }
  match.actionTime = onlineActionDurationSeconds(match);
  match.actionDeadlineAt = now + match.actionTime * 1000;
  return match.actionDeadlineAt;
}

function onlineActionSecondsRemaining(match, now = Date.now()) {
  if (!match?.actionDeadlineAt || match.battleState?.over || match.status === "finished") return 0;
  const deadline = Number(match.actionDeadlineAt);
  if (!Number.isFinite(deadline) || deadline <= 0) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function publicOnlineAction(lobby, viewerId) {
  const action = lobby.match?.lastAction;
  if (!action) return null;
  const actor = onlineMatchEntryForPlayer(lobby, action.playerId);
  const viewerSlot = onlineSlotForPlayer(lobby, viewerId);
  const isYours = action.playerId === viewerId;
  return {
    sequence: action.sequence,
    action: action.action,
    target: action.target ? publicCellForSlot(action.target, viewerSlot) : null,
    isYours,
    actorName: actor?.name || "Jogador",
    message: publicOnlineMessage(lobby, action, viewerId) || action.message,
    createdAt: new Date(action.createdAt).toISOString()
  };
}

function publicOnlineLog(lobby, viewerId) {
  const state = lobby.match?.battleState;
  if (state?.log?.length) return state.log.slice(-25);
  return lobby.match?.log || [];
}

function publicOnlineMessage(lobby, action, viewerId) {
  if (!action) return "";
  if (!action.target && action.message) return action.message;
  const actor = onlineMatchEntryForPlayer(lobby, action.playerId);
  const next = onlineMatchEntryForPlayer(lobby, action.nextPlayerId);
  const viewerSlot = onlineSlotForPlayer(lobby, viewerId);
  const label = ONLINE_ACTION_LABELS[action.action] || "jogou";
  const target = action.target ? publicCellForSlot(action.target, viewerSlot) : null;
  const targetText = target ? ` em Casa ${target.x + 1}, ${target.y + 1}` : "";
  const turnText = next ? ` Turno de ${next.name}.` : lobby.match?.battleState?.over ? " Partida encerrada." : "";
  return `${actor?.name || "Jogador"} ${label}${targetText}.${turnText}`;
}

function publicOnlineBattleState(lobby, viewerId) {
  const state = lobby.match?.battleState;
  if (!state) return null;
  const viewerSlot = onlineSlotForPlayer(lobby, viewerId);
  const opponentSlot = viewerSlot === "home" ? "away" : "home";
  return {
    sequence: state.sequence || 0,
    round: state.round,
    activeId: state.activeId,
    activeSide: state.activeSlot === viewerSlot ? "player" : "cpu",
    status: state.status,
    over: Boolean(state.over),
    winnerSide: state.winnerSlot === "draw" ? "draw" : state.winnerSlot ? state.winnerSlot === viewerSlot ? "player" : "cpu" : null,
    result: publicOnlineResult(lobby, viewerId),
    damageByPlayer: state.damage?.[viewerSlot] || 0,
    damageByCpu: state.damage?.[opponentSlot] || 0,
    effects: {
      player: cloneOnlineEffects(state.effects?.[viewerSlot]),
      cpu: cloneOnlineEffects(state.effects?.[opponentSlot])
    },
    goalkeepers: {
      player: publicOnlineGoalkeeper(state.goalkeepers?.[viewerSlot], "player"),
      cpu: publicOnlineGoalkeeper(state.goalkeepers?.[opponentSlot], "cpu")
    },
    pieces: state.pieces.map((piece) => ({
      id: piece.id,
      monsterId: piece.monsterId,
      side: piece.slot === viewerSlot ? "player" : "cpu",
      x: publicCellForSlot(piece, viewerSlot).x,
      y: piece.y,
      hp: piece.hp,
      maxHp: piece.maxHp,
      shot: piece.shot,
      dribble: piece.dribble,
      speed: piece.speed,
      acted: Boolean(piece.acted)
    })),
    log: state.log || []
  };
}

function publicOnlineAbsence(lobby, viewerId, options = {}) {
  if (!lobby.match || lobby.match.battleState?.over) {
    return { opponentAway: false, canClaimForfeit: false, secondsUntilForfeit: 0 };
  }
  refreshOnlineLobbyPresence(lobby);
  const viewerSlot = onlineSlotForPlayer(lobby, viewerId);
  const opponentSlot = viewerSlot === "home" ? "away" : "home";
  const opponent = onlineMatchEntryForSlot(lobby, opponentSlot);
  const liveOpponent = lobby.players.find((player) => player.playerId === opponent?.playerId);
  if (!opponent) return { opponentAway: false, canClaimForfeit: false, secondsUntilForfeit: 0 };
  if (!liveOpponent) {
    const absence = {
      opponentAway: true,
      opponentName: opponent.name,
      awayForSeconds: Math.ceil(ONLINE_FORFEIT_GRACE_MS / 1000),
      secondsUntilForfeit: 0,
      canClaimForfeit: true
    };
    if (options.includePlayerId) absence.opponentPlayerId = opponent.playerId;
    return absence;
  }
  const presence = onlinePlayerPresence(liveOpponent);
  const awaySince = liveOpponent.awaySince || (presence.away ? Date.now() : null);
  const awayForMs = awaySince ? Date.now() - awaySince : 0;
  const secondsUntilForfeit = presence.away
    ? Math.max(0, Math.ceil((ONLINE_FORFEIT_GRACE_MS - awayForMs) / 1000))
    : 0;
  const absence = {
    opponentAway: presence.away,
    opponentName: opponent.name,
    awaySince: presence.awaySince,
    awayForSeconds: Math.max(0, Math.floor(awayForMs / 1000)),
    secondsUntilForfeit,
    canClaimForfeit: presence.away && secondsUntilForfeit <= 0
  };
  if (options.includePlayerId) absence.opponentPlayerId = opponent.playerId;
  return absence;
}

function publicOnlineResult(lobby, viewerId) {
  const result = lobby.match?.results?.[viewerId];
  if (!result) return null;
  return {
    online: true,
    winner: result.outcome === "win" ? "player" : result.outcome === "loss" ? "cpu" : "draw",
    title: result.title,
    reason: result.reason,
    status: result.status,
    rewards: result.rewards || [],
    onlineTrophiesDelta: result.onlineTrophiesDelta || 0,
    merreisDelta: result.merreisDelta || 0
  };
}

function publicOnlineGoalkeeper(goalkeeper, side) {
  return goalkeeper ? {
    monsterId: goalkeeper.monsterId,
    side,
    used: Boolean(goalkeeper.used)
  } : null;
}

function mirrorPositions(positions = BATTLE_FORMATIONS.center.positions) {
  return positions.map((pos) => ({ x: 6 - pos.x, y: pos.y }));
}

function mirrorCell(cell) {
  return { x: 6 - cell.x, y: cell.y };
}

function publicCellForSlot(cell, viewerSlot) {
  return viewerSlot === "away" ? mirrorCell(cell) : { x: cell.x, y: cell.y };
}

function onlineMatchParticipants(lobby) {
  const entries = Array.isArray(lobby.match?.players) && lobby.match.players.length
    ? lobby.match.players
    : lobby.players.map((player, index) => ({
      slot: onlineSlotForIndex(index),
      playerId: player.playerId,
      name: player.name,
      loadout: player.loadout
    }));
  return entries.map((entry, index) => {
    const live = lobby.players.find((player) => player.playerId === entry.playerId) || lobby.players[index] || null;
    return {
      slot: entry.slot || onlineSlotForIndex(index),
      playerId: entry.playerId || live?.playerId || "",
      name: entry.name || live?.name || "Visitante",
      loadout: entry.loadout || live?.loadout || sanitizeOnlineLoadout(defaultServerSave())
    };
  });
}

function onlineMatchEntryForSlot(lobby, slot) {
  return onlineMatchParticipants(lobby).find((player) => player.slot === slot) || null;
}

function onlineMatchEntryForPlayer(lobby, playerId) {
  if (!playerId) return null;
  return onlineMatchParticipants(lobby).find((player) => player.playerId === playerId) || null;
}

function onlineSlotForPlayer(lobby, playerId) {
  const participant = onlineMatchEntryForPlayer(lobby, playerId);
  if (participant?.slot) return participant.slot;
  return lobby.players[0]?.playerId === playerId ? "home" : "away";
}

function onlinePlayerForSlot(lobby, slot) {
  const entry = onlineMatchEntryForSlot(lobby, slot);
  return lobby.players.find((player) => player.playerId === entry?.playerId) || entry || null;
}

function onlineSlotForIndex(index) {
  return index === 0 ? "home" : "away";
}

function cloneOnlineEffects(effects = {}) {
  return {
    fullShot: Math.max(0, Number(effects.fullShot) || 0),
    freeSwap: Boolean(effects.freeSwap),
    substitution: Boolean(effects.substitution),
    extraTurnId: effects.extraTurnId || null
  };
}

function createOnlineBattleState(lobby) {
  const [home, away] = lobby.players;
  const homeLoadout = home.loadout || sanitizeOnlineLoadout(defaultServerSave());
  const awayLoadout = away.loadout || sanitizeOnlineLoadout(defaultServerSave());
  const pieces = [
    ...createOnlineBattlePieces("home", homeLoadout, homeLoadout.positions),
    ...createOnlineBattlePieces("away", awayLoadout, mirrorPositions(awayLoadout.positions))
  ];
  const activeSlot = "home";
  const activeId = firstAliveOnlinePiece({ pieces }, activeSlot)?.id || pieces[0]?.id || null;
  return {
    sequence: 0,
    round: 1,
    activeSlot,
    activeId,
    status: `Turno de ${home.name}.`,
    over: false,
    winnerSlot: null,
    damage: { home: 0, away: 0 },
    effects: {
      home: cloneOnlineEffects(),
      away: cloneOnlineEffects()
    },
    goalkeepers: {
      home: createOnlineGoalkeeperState(homeLoadout.goalkeeper, "home"),
      away: createOnlineGoalkeeperState(awayLoadout.goalkeeper, "away")
    },
    pieces,
    log: [
      "Partida online pronta.",
      `Turno de ${home.name}.`
    ]
  };
}

function createOnlineBattlePieces(slot, loadout, positions) {
  return loadout.team.map((monsterId, index) => {
    const pos = positions[index] || BATTLE_FORMATIONS.center.positions[index] || { x: 0, y: index + 1 };
    const stats = onlineMonsterStats(monsterId, loadout);
    return {
      id: `${slot}-${index}`,
      slot,
      monsterId,
      x: pos.x,
      y: pos.y,
      hp: stats.vitality,
      maxHp: stats.vitality,
      shot: stats.shot,
      dribble: stats.dribble,
      speed: stats.speed,
      acted: false
    };
  });
}

function createOnlineGoalkeeperState(monsterId, slot) {
  const monster = MONSTER_BY_ID[monsterId];
  return monster && isGoalkeeper(monster) ? {
    monsterId,
    slot,
    used: false
  } : null;
}

function onlineMonsterStats(monsterId, loadout = {}) {
  const monster = MONSTER_BY_ID[monsterId];
  if (!monster || isGoalkeeper(monster)) return { vitality: 0, shot: 0, dribble: 0, speed: 0 };
  const level = clamp(Number(loadout.upgrades?.[monsterId]) || 0, 0, 2);
  const multiplier = 1 + level * 0.1;
  return {
    vitality: Math.round(monster.vitality * multiplier),
    shot: Math.round(monster.shot * multiplier),
    dribble: Math.round(monster.dribble * multiplier),
    speed: Math.round(monster.speed * multiplier)
  };
}

function onlineAlivePieces(battleState) {
  return battleState.pieces.filter((piece) => piece.hp > 0);
}

function onlinePieceAt(battleState, x, y) {
  return battleState.pieces.find((piece) => piece.hp > 0 && piece.x === x && piece.y === y);
}

function onlineActivePiece(battleState) {
  return battleState.pieces.find((piece) => piece.id === battleState.activeId && piece.hp > 0);
}

function firstAliveOnlinePiece(battleState, slot) {
  return battleState.pieces.find((piece) => piece.slot === slot && piece.hp > 0) || null;
}

function onlineLog(battleState, text) {
  battleState.log = [
    ...(battleState.log || []),
    text
  ].slice(-25);
}

function onlineValidTargetsFor(battleState, piece, action) {
  if (!piece || piece.hp <= 0) return [];
  if (action === "move") return onlineMoveCells(battleState, piece).map((cell) => ({ ...cell, action }));
  if (action === "retreat") return onlineRetreatCells(battleState, piece).map((cell) => ({ ...cell, action }));
  if (action === "dribble") return onlineAdjacentEnemies(battleState, piece).map((enemy) => ({ x: enemy.x, y: enemy.y, action }));
  if (action === "pressure") return onlineAdjacentEnemies(battleState, piece).map((enemy) => ({ x: enemy.x, y: enemy.y, action }));
  if (action === "swap") {
    const effects = battleState.effects[piece.slot] || {};
    const allies = effects.freeSwap || effects.substitution
      ? onlineAlivePieces(battleState).filter((ally) => ally.slot === piece.slot && ally.id !== piece.id)
      : onlineAdjacentAllies(battleState, piece);
    return allies.map((ally) => ({ x: ally.x, y: ally.y, action }));
  }
  if (action === "shot") return onlineDashEnemies(battleState, piece).map((enemy) => ({ x: enemy.x, y: enemy.y, action }));
  return [];
}

function onlineMoveCells(battleState, piece) {
  const cells = onlineMovementCells(battleState, piece, onlineMovementFor(piece.speed));
  if (!onlineIsMarked(battleState, piece)) return cells;
  return cells.filter((cell) => onlineAdjacentEnemiesAt(battleState, piece.slot, cell.x, cell.y).length > 0);
}

function onlineMovementCells(battleState, piece, maxSteps) {
  const visited = new Set([onlineCoordKey(piece.x, piece.y)]);
  const queue = [{ x: piece.x, y: piece.y, steps: 0 }];
  const results = [];
  while (queue.length) {
    const current = queue.shift();
    if (current.steps >= maxSteps) continue;
    onlineOrthogonalNeighbors(current.x, current.y).forEach((next) => {
      const key = onlineCoordKey(next.x, next.y);
      if (visited.has(key) || onlinePieceAt(battleState, next.x, next.y)) return;
      visited.add(key);
      results.push({ x: next.x, y: next.y });
      queue.push({ ...next, steps: current.steps + 1 });
    });
  }
  return results;
}

function onlineRetreatCells(battleState, piece) {
  const adjacent = onlineAdjacentEnemies(battleState, piece);
  const cells = onlineMovementCells(battleState, piece, Math.ceil(onlineMovementFor(piece.speed) / 2));
  if (!adjacent.length) return cells;
  const currentDistance = Math.min(...adjacent.map((enemy) => onlineDistance(piece, enemy)));
  return cells.filter((cell) => {
    const nextDistance = Math.min(...adjacent.map((enemy) => onlineDistance(cell, enemy)));
    return nextDistance > currentDistance && onlineAdjacentEnemiesAt(battleState, piece.slot, cell.x, cell.y).length === 0;
  });
}

function onlineDashEnemies(battleState, piece) {
  const maxDistance = onlineDashFor(piece.speed);
  return onlineAlivePieces(battleState).filter((enemy) => {
    if (enemy.slot === piece.slot) return false;
    const dx = enemy.x - piece.x;
    const dy = enemy.y - piece.y;
    const aligned = dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    return aligned && dist <= maxDistance && dist > 0 && onlinePathClear(battleState, piece, enemy);
  });
}

function onlinePathClear(battleState, from, to) {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x + dx;
  let y = from.y + dy;
  while (x !== to.x || y !== to.y) {
    if (onlinePieceAt(battleState, x, y)) return false;
    x += dx;
    y += dy;
  }
  return true;
}

function onlineExecuteAction(battleState, piece, target) {
  const action = target.action;
  if (action === "move" || action === "retreat") {
    piece.x = target.x;
    piece.y = target.y;
    onlineLog(battleState, `${MONSTER_BY_ID[piece.monsterId].name} ${action === "retreat" ? "recuou" : "moveu"}.`);
  }

  if (action === "swap") {
    const ally = onlinePieceAt(battleState, target.x, target.y);
    if (!ally) return;
    const old = { x: piece.x, y: piece.y };
    piece.x = ally.x;
    piece.y = ally.y;
    ally.x = old.x;
    ally.y = old.y;
    const effects = battleState.effects[piece.slot];
    if (effects?.freeSwap && !effects?.substitution) effects.freeSwap = false;
    onlineLog(battleState, `${MONSTER_BY_ID[piece.monsterId].name} trocou posicao com ${MONSTER_BY_ID[ally.monsterId].name}.`);
  }

  if (action === "dribble") {
    const defender = onlinePieceAt(battleState, target.x, target.y);
    if (defender) onlineBasicAttack(battleState, piece, defender, false);
  }

  if (action === "shot") {
    const defender = onlinePieceAt(battleState, target.x, target.y);
    if (defender) {
      onlineMoveDashAttacker(battleState, piece, defender);
      onlineBasicAttack(battleState, piece, defender, true);
    }
  }

  if (action === "pressure") {
    const defender = onlinePieceAt(battleState, target.x, target.y);
    if (defender) {
      onlinePushPiece(battleState, defender, piece, 1);
      onlineLog(battleState, `${MONSTER_BY_ID[piece.monsterId].name} pressionou ${MONSTER_BY_ID[defender.monsterId].name}.`);
    }
  }
}

function onlineBasicAttack(battleState, attacker, defender, isDash) {
  const damage = onlineCalculateDamage(battleState, attacker, defender, isDash);
  onlineApplyDamage(battleState, defender, damage, attacker.slot, { precalculated: true });
  const actionName = isDash ? "chutou contra" : "driblou";
  onlineLog(battleState, `${MONSTER_BY_ID[attacker.monsterId].name} ${actionName} ${MONSTER_BY_ID[defender.monsterId].name}: ${damage} dano.`);
  if (defender.hp > 0) {
    const force = isDash ? attacker.shot : attacker.dribble;
    const steps = isDash ? (force > defender.speed ? 2 : 1) : (force > defender.speed ? 1 : 0);
    if (steps > 0) onlinePushPiece(battleState, defender, attacker, steps, force);
  }
  if (isDash) onlineConsumeFullShot(battleState, attacker.slot);
}

function onlineCalculateDamage(battleState, attacker, defender, isDash) {
  const fullShot = isDash && onlineFullShotCharges(battleState, attacker.slot) > 0;
  const base = isDash ? attacker.shot * (fullShot ? 1 : 0.5) : attacker.dribble;
  const surrounded = onlineIsSurrounded(battleState, defender) ? 1.25 : 1;
  const matchup = onlineTypeMultiplier(MONSTER_BY_ID[attacker.monsterId].types, MONSTER_BY_ID[defender.monsterId].types);
  const positionalAttack = onlinePositionalMultiplier(attacker, true);
  const positionalDefense = onlinePositionalMultiplier(defender, false);
  return Math.max(1, Math.round(base * surrounded * matchup * positionalAttack * positionalDefense));
}

function onlinePushPiece(battleState, target, attacker, steps, force = attacker.dribble) {
  const dx = Math.sign(target.x - attacker.x);
  const dy = Math.sign(target.y - attacker.y);
  if (dx === 0 && dy === 0) return { moved: 0, collision: false, out: false };
  const result = { moved: 0, collision: false, out: false };
  for (let i = 0; i < steps; i += 1) {
    const next = { x: target.x + dx, y: target.y + dy };
    if (!onlineInsideArena(next.x, next.y)) {
      const damage = onlineIncomingDamageAfterPosition(target, Math.round(force * 0.5));
      onlineApplyDamage(battleState, target, damage, attacker.slot, { precalculated: true });
      onlineLog(battleState, `${MONSTER_BY_ID[target.monsterId].name} bateu na borda: ${damage} dano extra.`);
      result.out = true;
      break;
    }
    const blocker = onlinePieceAt(battleState, next.x, next.y);
    if (blocker) {
      const baseDamage = Math.round(force * 0.25);
      const targetDamage = onlineIncomingDamageAfterPosition(target, baseDamage);
      const blockerDamage = onlineIncomingDamageAfterPosition(blocker, baseDamage);
      onlineApplyDamage(battleState, target, targetDamage, attacker.slot, { precalculated: true });
      onlineApplyDamage(battleState, blocker, blockerDamage, attacker.slot, { precalculated: true });
      onlineLog(battleState, `Colisao entre ${MONSTER_BY_ID[target.monsterId].name} e ${MONSTER_BY_ID[blocker.monsterId].name}: ${targetDamage}/${blockerDamage} dano.`);
      result.collision = true;
      break;
    }
    target.x = next.x;
    target.y = next.y;
    result.moved += 1;
  }
  return result;
}

function onlineApplyDamage(battleState, piece, damage, sourceSlot, options = {}) {
  const finalDamage = options.precalculated ? damage : onlineIncomingDamageAfterPosition(piece, damage);
  piece.hp = Math.max(0, piece.hp - finalDamage);
  battleState.damage[sourceSlot] = (battleState.damage[sourceSlot] || 0) + finalDamage;
  if (piece.hp <= 0) onlineLog(battleState, `${MONSTER_BY_ID[piece.monsterId].name} saiu da arena.`);
}

function onlineCheckVictory(battleState) {
  const homeAlive = onlineAlivePieces(battleState).some((piece) => piece.slot === "home");
  const awayAlive = onlineAlivePieces(battleState).some((piece) => piece.slot === "away");
  if (homeAlive && awayAlive) return null;
  battleState.over = true;
  battleState.winnerSlot = homeAlive ? "home" : awayAlive ? "away" : "draw";
  battleState.status = battleState.winnerSlot === "draw" ? "Empate online." : `${battleState.winnerSlot === "home" ? "Mandante" : "Visitante"} venceu a partida online.`;
  return battleState.winnerSlot;
}

function onlineCanUseKeeperAbility(lobby, slot) {
  const state = lobby.match?.battleState;
  const keeper = state?.goalkeepers?.[slot];
  const monster = keeper ? MONSTER_BY_ID[keeper.monsterId] : null;
  const active = onlineActivePiece(state);
  return Boolean(state && keeper && monster?.keeperAbility && !keeper.used && active?.slot === slot && active.hp > 0);
}

function onlineUseKeeperAbility(lobby, slot) {
  if (!onlineCanUseKeeperAbility(lobby, slot)) {
    const error = new Error("Goleiro online indisponivel agora.");
    error.status = 409;
    throw error;
  }
  const state = lobby.match.battleState;
  const keeper = state.goalkeepers[slot];
  const monster = MONSTER_BY_ID[keeper.monsterId];
  const active = onlineActivePiece(state);
  keeper.used = true;

  if (monster.keeperAbility === "extraTurn") {
    state.effects[slot].extraTurnId = active.id;
    const message = `${monster.name} fechou o gol: ${MONSTER_BY_ID[active.monsterId].name} jogara de novo apos esta acao.`;
    onlineLog(state, message);
    return { keepTurn: true, message };
  }

  if (monster.keeperAbility === "fullShot") {
    state.effects[slot].fullShot = 1;
    const message = `${monster.name} armou o chute perfeito: o proximo chute causa dano cheio.`;
    onlineLog(state, message);
    return { keepTurn: true, message };
  }

  if (monster.keeperAbility === "investidaTotal") {
    state.effects[slot].fullShot = 2;
    const message = `${monster.name} chamou a investida total: os proximos 2 chutes causam dano cheio.`;
    onlineLog(state, message);
    return { keepTurn: true, message };
  }

  if (monster.keeperAbility === "teamHeal") {
    state.pieces
      .filter((ally) => ally.slot === slot && ally.hp > 0)
      .forEach((ally) => {
        ally.hp = ally.maxHp;
      });
    const message = `${monster.name} reorganizou a defesa: o time recuperou toda a vitalidade.`;
    onlineLog(state, message);
    return { keepTurn: false, message };
  }

  if (monster.keeperAbility === "freeSwap") {
    state.effects[slot].freeSwap = true;
    const message = `${monster.name} liberou inversao total: a proxima troca pode ser feita em qualquer lugar.`;
    onlineLog(state, message);
    return { keepTurn: false, message };
  }

  if (monster.keeperAbility === "substitution") {
    state.effects[slot].substitution = true;
    state.effects[slot].freeSwap = true;
    const message = `${monster.name} ativou substituicao: trocas livres ate o fim da partida.`;
    onlineLog(state, message);
    return { keepTurn: false, message };
  }

  return { keepTurn: false, message: `${monster.name} ativou o goleiro.` };
}

async function resolveOnlineMatchRewards(lobby, winnerSlot, finishReason = "normal") {
  if (!lobby?.match || lobby.match.resolvedAt) return;
  const now = new Date().toISOString();
  lobby.match.resolvedAt = now;
  lobby.match.results = {};
  const participants = onlineMatchParticipants(lobby).filter((player) => player.playerId);
  await Promise.all(participants.map(async (player) => {
    const slot = player.slot;
    const outcome = winnerSlot === "draw" ? "draw" : winnerSlot === slot ? "win" : "loss";
    const result = await applyOnlineResultToPlayer(player.playerId, outcome, finishReason);
    lobby.match.results[player.playerId] = {
      ...result,
      resolvedAt: now
    };
  }));
}

async function applyOnlineResultToPlayer(playerId, outcome, finishReason = "normal") {
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  progressServerMission(save, "battle", 1);
  const forfeit = finishReason === "forfeit";

  if (outcome === "win") {
    save.onlineWins += 1;
    save.onlineTrophies += 70;
    save.merreis += 160;
    progressServerMission(save, "win", 1);
    await writeSave(playerId, save);
    return {
      outcome,
      title: forfeit ? "Vitoria por W.O.!" : "Vitoria online!",
      reason: forfeit ? "O rival abandonou a partida online." : "Voce derrubou o trio rival na partida sincronizada.",
      status: forfeit ? "Vitoria por W.O.! +70 trofeus online" : "Vitoria online! +70 trofeus online",
      rewards: ["+70 trofeus online", "+160 Merreis"],
      onlineTrophiesDelta: 70,
      merreisDelta: 160
    };
  }

  if (outcome === "draw") {
    save.onlineDraws += 1;
    save.onlineTrophies += 25;
    save.merreis += 80;
    await writeSave(playerId, save);
    return {
      outcome,
      title: "Empate online",
      reason: "A partida terminou sem vencedor.",
      status: "Empate online. +25 trofeus online",
      rewards: ["+25 trofeus online", "+80 Merreis"],
      onlineTrophiesDelta: 25,
      merreisDelta: 80
    };
  }

  save.onlineLosses += 1;
  save.merreis += 45;
  await writeSave(playerId, save);
  return {
    outcome,
    title: forfeit ? "Derrota por desistência" : "Derrota online",
    reason: forfeit ? "Voce saiu ou ficou ausente durante a partida online." : "O rival levou a melhor nesta partida.",
    status: forfeit ? "Derrota por desistência. +45 Merreis" : "Derrota online. +45 Merreis",
    rewards: ["+45 Merreis"],
    onlineTrophiesDelta: 0,
    merreisDelta: 45
  };
}

function advanceOnlineBattleTurn(lobby, currentIndex) {
  const battleState = lobby.match.battleState;
  if (!battleState || battleState.over) return;
  const nextIndex = (currentIndex + 1) % lobby.players.length;
  const next = lobby.players[nextIndex];
  const nextSlot = onlineSlotForIndex(nextIndex);
  if (nextIndex === 0) lobby.match.round += 1;
  battleState.round = lobby.match.round;
  lobby.match.turnPlayerId = next.playerId;
  battleState.activeSlot = nextSlot;
  battleState.activeId = firstAliveOnlinePiece(battleState, nextSlot)?.id || onlineAlivePieces(battleState)[0]?.id || null;
  battleState.status = `Turno de ${next.name}.`;
  setOnlineActionDeadline(lobby);
  return next;
}

function keepOnlineBattleTurn(lobby, player, slot, active, message = "") {
  const battleState = lobby.match.battleState;
  lobby.match.turnPlayerId = player.playerId;
  battleState.activeSlot = slot;
  battleState.activeId = active?.hp > 0 ? active.id : firstAliveOnlinePiece(battleState, slot)?.id || onlineAlivePieces(battleState)[0]?.id || null;
  battleState.status = message || `Turno de ${player.name}.`;
  setOnlineActionDeadline(lobby);
  return player;
}

function advanceOnlineBattleAfterAction(lobby, currentIndex, slot, active, options = {}) {
  const current = lobby.players[currentIndex];
  if (options.keepTurn) return keepOnlineBattleTurn(lobby, current, slot, active, options.message);
  if (!options.ignoreExtraTurn && active && lobby.match.battleState.effects?.[slot]?.extraTurnId === active.id) {
    lobby.match.battleState.effects[slot].extraTurnId = null;
    return keepOnlineBattleTurn(lobby, current, slot, active, `${current.name} ganhou um turno extra.`);
  }
  if (options.ignoreExtraTurn && active && lobby.match.battleState.effects?.[slot]?.extraTurnId === active.id) {
    lobby.match.battleState.effects[slot].extraTurnId = null;
  }
  return advanceOnlineBattleTurn(lobby, currentIndex);
}

function canonicalTargetForPlayer(target, slot) {
  return slot === "away" ? mirrorCell(target) : target;
}

function onlineFullShotCharges(battleState, slot) {
  return Math.max(0, Number(battleState.effects?.[slot]?.fullShot) || 0);
}

function onlineConsumeFullShot(battleState, slot) {
  const charges = onlineFullShotCharges(battleState, slot);
  if (!charges || !battleState.effects?.[slot]) return;
  battleState.effects[slot].fullShot = Math.max(0, charges - 1);
}

function onlineMoveDashAttacker(battleState, attacker, defender) {
  const dx = Math.sign(defender.x - attacker.x);
  const dy = Math.sign(defender.y - attacker.y);
  const beforeTarget = { x: defender.x - dx, y: defender.y - dy };
  if (onlineInsideArena(beforeTarget.x, beforeTarget.y) && !onlinePieceAt(battleState, beforeTarget.x, beforeTarget.y)) {
    attacker.x = beforeTarget.x;
    attacker.y = beforeTarget.y;
  }
}

function onlineTypeMultiplier(attackerTypes = [], defenderTypes = []) {
  const advantages = {
    Atacante: "Meia",
    Meia: "Defensor",
    Defensor: "Atacante"
  };
  return attackerTypes.some((type) => defenderTypes.includes(advantages[type])) ? 1.25 : 1;
}

function onlinePositionalMultiplier(piece, attacking) {
  const monster = MONSTER_BY_ID[piece.monsterId];
  const bonus = onlinePositionalBonusType(piece);
  if (!monster || !bonus || !monster.types.includes(bonus)) return 1;
  return attacking ? 1.1 : 0.9;
}

function onlineIncomingDamageAfterPosition(piece, damage) {
  return Math.max(1, Math.round(damage * onlinePositionalMultiplier(piece, false)));
}

function onlinePositionalBonusType(piece) {
  const ownArea = piece.slot === "home" ? piece.x <= 1 : piece.x >= 5;
  const enemyArea = piece.slot === "home" ? piece.x >= 5 : piece.x <= 1;
  if (ownArea) return "Defensor";
  if (enemyArea) return "Atacante";
  return "Meia";
}

function onlineAdjacentEnemies(battleState, piece) {
  return onlineAlivePieces(battleState).filter((other) => other.slot !== piece.slot && onlineAdjacent(piece, other));
}

function onlineAdjacentEnemiesAt(battleState, slot, x, y) {
  return onlineAlivePieces(battleState).filter((other) => other.slot !== slot && Math.max(Math.abs(x - other.x), Math.abs(y - other.y)) === 1);
}

function onlineAdjacentAllies(battleState, piece) {
  return onlineAlivePieces(battleState).filter((other) => other.slot === piece.slot && other.id !== piece.id && onlineAdjacent(piece, other));
}

function onlineIsMarked(battleState, piece) {
  return onlineAdjacentEnemies(battleState, piece).length > 0;
}

function onlineIsSurrounded(battleState, piece) {
  return onlineAdjacentEnemies(battleState, piece).length >= 2;
}

function onlineAdjacent(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
}

function onlineMovementFor(speed) {
  if (speed >= 100) return 4;
  if (speed >= 70) return 3;
  if (speed >= 40) return 2;
  return 1;
}

function onlineDashFor(speed) {
  if (speed >= 100) return 5;
  if (speed >= 70) return 4;
  if (speed >= 40) return 3;
  return 2;
}

function onlineInsideArena(x, y) {
  return x >= 0 && x < 7 && y >= 0 && y < 5;
}

function onlineOrthogonalNeighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ].filter((cell) => onlineInsideArena(cell.x, cell.y));
}

function onlineDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function onlineCoordKey(x, y) {
  return `${x},${y}`;
}

function syncOnlineLobbyMatch(lobby) {
  if (!lobby) return false;
  const full = lobby.players.length === ONLINE_LOBBY_CAPACITY;
  const ready = full && lobby.players.every((player) => player.ready);
  if (!ready) {
    if (lobby.match?.status === "ready") {
      lobby.match = null;
      return true;
    }
    return false;
  }
  if (lobby.match) return false;
  const [home, away] = lobby.players;
  const battleState = createOnlineBattleState(lobby);
  const now = Date.now();
  lobby.rematchVotes = {};
  lobby.match = {
    id: crypto.randomUUID(),
    status: "ready",
    createdAt: now,
    updatedAt: now,
    round: 1,
    sequence: 0,
    lastAction: null,
    battleState,
    turnPlayerId: home.playerId,
    actionTime: onlineActionDurationSeconds(),
    actionDeadlineAt: null,
    score: { home: 0, away: 0 },
    message: "Os dois jogadores estao prontos. Batalha online pronta para iniciar.",
    log: battleState.log,
    players: [
      { slot: "home", playerId: home.playerId, name: home.name, loadout: home.loadout },
      { slot: "away", playerId: away.playerId, name: away.name, loadout: away.loadout }
    ]
  };
  setOnlineActionDeadline(lobby, now);
  return true;
}

function onlineLobbyForMatch(matchId) {
  cleanupOnlineLobbies();
  resolveOnlineTurnTimeouts();
  return [...onlineLobbies.values()].find((lobby) => lobby.match?.id === matchId) || null;
}

async function applyOnlineMatchAction(playerId, payload = {}) {
  await requireProfileForPlayer(playerId);
  const matchId = String(payload.matchId || "");
  const action = String(payload.action || "");
  const rawTarget = normalizeOnlineActionTarget(payload.target);
  const lobby = onlineLobbyForMatch(matchId);
  if (!lobby || !lobby.match) {
    const error = new Error("Partida online nao encontrada.");
    error.status = 404;
    throw error;
  }
  if (!lobby.match.battleState) {
    lobby.match.battleState = createOnlineBattleState(lobby);
  }
  if (lobby.match.battleState.over) {
    const error = new Error("Partida online encerrada.");
    error.status = 409;
    throw error;
  }
  if (action !== "pass" && action !== "keeper" && !ONLINE_TARGET_ACTIONS.has(action)) {
    const error = new Error("Acao online ainda nao habilitada.");
    error.status = 400;
    throw error;
  }
  if (action !== "pass" && action !== "keeper" && !rawTarget) {
    const error = new Error("Alvo online invalido.");
    error.status = 400;
    throw error;
  }
  if (lobby.match.turnPlayerId !== playerId) {
    const error = new Error("Ainda nao e seu turno.");
    error.status = 409;
    throw error;
  }

  const currentIndex = lobby.players.findIndex((player) => player.playerId === playerId);
  if (currentIndex < 0) {
    const error = new Error("Jogador nao esta nesta partida.");
    error.status = 403;
    throw error;
  }
  const currentSlot = onlineSlotForIndex(currentIndex);
  const current = lobby.players[currentIndex];
  const battleState = lobby.match.battleState;
  const active = onlineActivePiece(battleState);
  if (!active || active.slot !== currentSlot) {
    const error = new Error("O estado da batalha online ainda nao esta no seu turno.");
    error.status = 409;
    throw error;
  }

  let target = null;
  let keeperResult = null;
  if (action === "keeper") {
    keeperResult = onlineUseKeeperAbility(lobby, currentSlot);
  } else if (action !== "pass") {
    target = canonicalTargetForPlayer(rawTarget, currentSlot);
    const resolvedTarget = onlineValidTargetsFor(battleState, active, action)
      .find((item) => item.x === target.x && item.y === target.y);
    if (!resolvedTarget) {
      const error = new Error("Alvo online nao esta valido agora.");
      error.status = 400;
      throw error;
    }
    onlineExecuteAction(battleState, active, resolvedTarget);
  } else {
    onlineLog(battleState, `${MONSTER_BY_ID[active.monsterId].name} passou.`);
  }

  const winnerSlot = onlineCheckVictory(battleState);
  if (winnerSlot) {
    await resolveOnlineMatchRewards(lobby, winnerSlot);
    lobby.match.status = "finished";
    lobby.match.finishedAt = Date.now();
    lobby.match.actionDeadlineAt = null;
  }
  const next = winnerSlot
    ? null
    : advanceOnlineBattleAfterAction(lobby, currentIndex, currentSlot, active, {
      keepTurn: keeperResult?.keepTurn,
      message: keeperResult?.message,
      ignoreExtraTurn: action === "pass" || action === "keeper"
    });
  lobby.match.sequence = (Number(lobby.match.sequence) || 0) + 1;
  battleState.sequence = lobby.match.sequence;
  lobby.match.updatedAt = Date.now();
  lobby.updatedAt = lobby.match.updatedAt;
  const label = ONLINE_ACTION_LABELS[action] || "jogou";
  const actorTarget = rawTarget || target;
  const targetText = actorTarget ? ` em Casa ${actorTarget.x + 1}, ${actorTarget.y + 1}` : "";
  lobby.match.message = winnerSlot
    ? `${current.name} ${label}${targetText}. Partida encerrada.`
    : keeperResult?.message && keeperResult.keepTurn
    ? `${current.name} ${label}. ${keeperResult.message}`
    : `${current.name} ${label}${targetText}. Turno de ${next.name}.`;
  lobby.match.lastAction = {
    sequence: lobby.match.sequence,
    playerId,
    nextPlayerId: next?.playerId || null,
    action,
    target,
    message: lobby.match.message,
    createdAt: lobby.match.updatedAt
  };
  battleState.status = lobby.match.message;
  onlineLog(battleState, lobby.match.message);
  lobby.match.log = [
    ...(battleState.log || [])
  ].slice(-20);
  return lobby;
}

function applyOnlineTurnTimeout(lobby) {
  const match = lobby?.match;
  const battleState = match?.battleState;
  if (!match || !battleState || battleState.over || match.status === "finished") return false;

  const currentIndex = lobby.players.findIndex((player) => player.playerId === match.turnPlayerId);
  const current = lobby.players[currentIndex];
  const currentSlot = onlineSlotForIndex(currentIndex);
  const active = onlineActivePiece(battleState);
  if (currentIndex < 0 || !current || !active || active.slot !== currentSlot) {
    setOnlineActionDeadline(lobby);
    return false;
  }

  onlineLog(battleState, `${MONSTER_BY_ID[active.monsterId].name} perdeu o tempo e passou.`);
  const next = advanceOnlineBattleAfterAction(lobby, currentIndex, currentSlot, active, { ignoreExtraTurn: true });
  const now = Date.now();
  match.sequence = (Number(match.sequence) || 0) + 1;
  battleState.sequence = match.sequence;
  match.updatedAt = now;
  lobby.updatedAt = now;
  match.message = `${current.name} passou por tempo. Turno de ${next?.name || "rival"}.`;
  match.lastAction = {
    sequence: match.sequence,
    playerId: current.playerId,
    nextPlayerId: next?.playerId || null,
    action: "pass",
    target: null,
    message: match.message,
    createdAt: now
  };
  battleState.status = match.message;
  onlineLog(battleState, match.message);
  match.log = [
    ...(battleState.log || [])
  ].slice(-20);
  return true;
}

function resolveOnlineTurnTimeouts(now = Date.now()) {
  let changed = false;
  for (const lobby of onlineLobbies.values()) {
    const match = lobby.match;
    if (!match || match.battleState?.over || match.status === "finished" || !match.actionDeadlineAt) continue;
    if (Number(match.actionDeadlineAt) > now) continue;
    changed = applyOnlineTurnTimeout(lobby) || changed;
  }
  if (changed) persistOnlineLobbiesSoon();
  return changed;
}

function normalizeOnlineActionTarget(target) {
  if (!target || typeof target !== "object") return null;
  const x = Number(target.x);
  const y = Number(target.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || x > 6 || y < 0 || y > 4) return null;
  return { x, y };
}

async function onlineLobbyPayload(playerId) {
  cleanupOnlineLobbies();
  resolveOnlineTurnTimeouts();
  const currentLobby = currentLobbyForPlayer(playerId);
  if (currentLobby) {
    const player = currentLobby.players.find((item) => item.playerId === playerId);
    if (player) {
      player.lastSeenAt = Date.now();
      player.awaySince = null;
    }
    currentLobby.updatedAt = Date.now();
    persistOnlineLobbiesSoon();
  }
  const profile = await profileForPlayer(playerId);
  const includeSave = Boolean(currentLobby?.match?.results?.[playerId]);
  const record = includeSave ? await readSave(playerId) : null;
  const lobbies = [...onlineLobbies.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((lobby) => publicOnlineLobby(lobby, playerId));
  return {
    ok: true,
    playerId,
    profile: publicProfile(profile),
    save: record?.save || null,
    currentLobby: currentLobby ? publicOnlineLobby(currentLobby, playerId) : null,
    lobbies
  };
}

async function createOnlineLobby(playerId) {
  await requireProfileForPlayer(playerId);
  cleanupOnlineLobbies();
  removePlayerFromOnlineLobbies(playerId);
  const now = Date.now();
  const lobby = {
    id: lobbyCode(),
    hostPlayerId: playerId,
    createdAt: now,
    updatedAt: now,
    rematchVotes: {},
    players: [{
      playerId,
      name: await onlinePlayerName(playerId),
      loadout: await onlinePlayerLoadout(playerId),
      ready: false,
      joinedAt: now,
      lastSeenAt: now
    }]
  };
  onlineLobbies.set(lobby.id, lobby);
  return lobby;
}

async function joinOnlineLobby(playerId, lobbyId) {
  await requireProfileForPlayer(playerId);
  cleanupOnlineLobbies();
  const id = String(lobbyId || "").trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(id)) {
    const error = new Error("Codigo de sala invalido.");
    error.status = 400;
    throw error;
  }
  const lobby = onlineLobbies.get(id);
  if (!lobby) {
    const error = new Error("Sala online nao encontrada.");
    error.status = 404;
    throw error;
  }
  const existing = lobby.players.find((player) => player.playerId === playerId);
  if (existing) {
    existing.lastSeenAt = Date.now();
    existing.awaySince = null;
    existing.loadout = await onlinePlayerLoadout(playerId);
    pruneOnlineRematchVotes(lobby);
    lobby.updatedAt = Date.now();
    return lobby;
  }
  if (lobby.players.length >= ONLINE_LOBBY_CAPACITY) {
    const error = new Error("Sala online cheia.");
    error.status = 409;
    throw error;
  }
  removePlayerFromOnlineLobbies(playerId);
  const now = Date.now();
  lobby.players.push({
    playerId,
    name: await onlinePlayerName(playerId),
    loadout: await onlinePlayerLoadout(playerId),
    ready: false,
    joinedAt: now,
    lastSeenAt: now
  });
  pruneOnlineRematchVotes(lobby);
  lobby.updatedAt = now;
  return lobby;
}

async function leaveOnlineLobby(playerId) {
  cleanupOnlineLobbies();
  const lobby = currentLobbyForPlayer(playerId);
  if (lobby?.match && !lobby.match.battleState?.over) {
    const absence = publicOnlineAbsence(lobby, playerId);
    if (absence.opponentAway) {
      lobby.match = null;
      lobby.players.forEach((player) => {
        player.ready = false;
      });
      lobby.updatedAt = Date.now();
    } else {
      await finishOnlineMatchByForfeit(lobby, playerId, "forfeit");
    }
  }
  removePlayerFromOnlineLobbies(playerId);
}

async function setOnlineLobbyReady(playerId, ready) {
  await requireProfileForPlayer(playerId);
  cleanupOnlineLobbies();
  const lobby = currentLobbyForPlayer(playerId);
  if (!lobby) {
    const error = new Error("Voce nao esta em uma sala online.");
    error.status = 404;
    throw error;
  }
  const player = lobby.players.find((item) => item.playerId === playerId);
  await updateOnlinePlayerLoadout(lobby, playerId);
  player.ready = Boolean(ready);
  if (!lobby.match?.battleState?.over) lobby.rematchVotes = {};
  player.lastSeenAt = Date.now();
  player.awaySince = null;
  lobby.updatedAt = Date.now();
  syncOnlineLobbyMatch(lobby);
  return lobby;
}

function resetOnlineLobbyMatch(playerId) {
  cleanupOnlineLobbies();
  const lobby = currentLobbyForPlayer(playerId);
  if (!lobby) {
    const error = new Error("Voce nao esta em uma sala online.");
    error.status = 404;
    throw error;
  }
  if (!lobby.match) {
    const error = new Error("Nao existe partida online para reiniciar.");
    error.status = 404;
    throw error;
  }
  if (!lobby.match.battleState?.over) {
    const error = new Error("A partida online ainda esta em andamento.");
    error.status = 409;
    throw error;
  }

  const participants = onlineMatchParticipants(lobby).filter((player) => player.playerId);
  const liveParticipantIds = new Set(lobby.players.map((player) => player.playerId));
  if (participants.some((player) => !liveParticipantIds.has(player.playerId))) {
    const error = new Error("O rival saiu da sala. Crie ou entre em outra sala para jogar de novo.");
    error.status = 409;
    throw error;
  }

  lobby.rematchVotes = lobby.rematchVotes && typeof lobby.rematchVotes === "object" ? lobby.rematchVotes : {};
  lobby.rematchVotes[playerId] = Date.now();
  const voted = participants.filter((player) => lobby.rematchVotes[player.playerId]);
  lobby.updatedAt = Date.now();

  if (voted.length < participants.length) {
    const player = lobby.players.find((item) => item.playerId === playerId);
    lobby.match.message = `${player?.name || "Jogador"} pediu revanche. Aguardando o rival aceitar.`;
    lobby.match.updatedAt = lobby.updatedAt;
    return lobby;
  }

  const finishedAt = lobby.match.finishedAt || lobby.match.updatedAt || Date.now();
  lobby.lastMatchSummary = {
    matchId: lobby.match.id,
    finishedAt: new Date(finishedAt).toISOString(),
    message: lobby.match.message,
    round: lobby.match.round,
    winnerSlot: lobby.match.battleState.winnerSlot || null
  };
  lobby.match = null;
  lobby.rematchVotes = {};
  const now = Date.now();
  lobby.players.forEach((player) => {
    player.ready = true;
    player.lastSeenAt = now;
    player.awaySince = null;
  });
  lobby.updatedAt = now;
  syncOnlineLobbyMatch(lobby);
  return lobby;
}

async function claimOnlineForfeit(playerId) {
  await requireProfileForPlayer(playerId);
  cleanupOnlineLobbies();
  const lobby = currentLobbyForPlayer(playerId);
  if (!lobby) {
    const error = new Error("Voce nao esta em uma sala online.");
    error.status = 404;
    throw error;
  }
  if (!lobby.match || lobby.match.battleState?.over) {
    const error = new Error("Nao existe partida online em andamento.");
    error.status = 404;
    throw error;
  }
  const absence = publicOnlineAbsence(lobby, playerId, { includePlayerId: true });
  if (!absence.opponentAway) {
    const error = new Error("O rival ainda esta conectado.");
    error.status = 409;
    throw error;
  }
  if (!absence.canClaimForfeit) {
    const error = new Error(`Aguarde ${absence.secondsUntilForfeit}s para pedir W.O.`);
    error.status = 409;
    throw error;
  }
  await finishOnlineMatchByForfeit(lobby, absence.opponentPlayerId, "forfeit");
  return lobby;
}

async function finishOnlineMatchByForfeit(lobby, loserPlayerId, finishReason = "forfeit") {
  if (!lobby?.match || lobby.match.battleState?.over || lobby.match.forfeitResolving) return lobby;
  lobby.match.forfeitResolving = true;
  const loser = onlineMatchEntryForPlayer(lobby, loserPlayerId) || onlineMatchParticipants(lobby)[0];
  const winner = onlineMatchParticipants(lobby).find((player) => player.playerId && player.playerId !== loser?.playerId);
  if (!loser || !winner) {
    lobby.match.forfeitResolving = false;
    return lobby;
  }
  const battleState = lobby.match.battleState || createOnlineBattleState(lobby);
  const now = Date.now();
  const message = `${loser.name} desistiu. ${winner.name} venceu por W.O.`;
  battleState.over = true;
  battleState.winnerSlot = winner.slot;
  battleState.status = message;
  lobby.match.sequence = (Number(lobby.match.sequence) || 0) + 1;
  battleState.sequence = lobby.match.sequence;
  lobby.match.status = "finished";
  lobby.match.turnPlayerId = null;
  lobby.match.actionDeadlineAt = null;
  lobby.match.updatedAt = now;
  lobby.match.finishedAt = now;
  lobby.updatedAt = now;
  lobby.match.message = message;
  lobby.match.lastAction = {
    sequence: lobby.match.sequence,
    playerId: loser.playerId,
    nextPlayerId: null,
    action: "forfeit",
    target: null,
    message,
    createdAt: now
  };
  onlineLog(battleState, message);
  lobby.match.log = [
    ...(battleState.log || [])
  ].slice(-20);
  try {
    await resolveOnlineMatchRewards(lobby, winner.slot, finishReason);
  } finally {
    lobby.match.forfeitResolving = false;
  }
  return lobby;
}

function webSocketAcceptKey(key) {
  return crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
}

function writeWebSocketFrame(socket, payload, opcode = 1) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
  let header;
  if (data.length < 126) {
    header = Buffer.from([0x80 | opcode, data.length]);
  } else if (data.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }
  socket.write(Buffer.concat([header, data]));
}

function sendWebSocketJson(client, payload) {
  if (client.socket.destroyed) return;
  writeWebSocketFrame(client.socket, JSON.stringify(payload));
}

async function sendOnlineUpdateToClient(client) {
  sendWebSocketJson(client, {
    type: "online:update",
    ...(await onlineLobbyPayload(client.playerId))
  });
}

async function broadcastOnlineLobbies() {
  if (!wsClients.size) return;
  await Promise.all([...wsClients].map(async (client) => {
    try {
      await sendOnlineUpdateToClient(client);
    } catch (error) {
      closeWebSocketClient(client);
    }
  }));
}

function closeWebSocketClient(client) {
  wsClients.delete(client);
  if (!client.socket.destroyed) client.socket.destroy();
}

function readWebSocketFrames(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);
  const frames = [];
  let offset = 0;
  while (offset + 2 <= client.buffer.length) {
    const first = client.buffer[offset];
    const second = client.buffer[offset + 1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let headerLength = 2;

    if (length === 126) {
      if (offset + 4 > client.buffer.length) break;
      length = client.buffer.readUInt16BE(offset + 2);
      headerLength = 4;
    } else if (length === 127) {
      if (offset + 10 > client.buffer.length) break;
      const bigLength = client.buffer.readBigUInt64BE(offset + 2);
      if (bigLength > BigInt(MAX_SAVE_BYTES)) throw new Error("Mensagem WebSocket grande demais.");
      length = Number(bigLength);
      headerLength = 10;
    }

    const maskLength = masked ? 4 : 0;
    const frameEnd = offset + headerLength + maskLength + length;
    if (frameEnd > client.buffer.length) break;

    let payload = client.buffer.subarray(offset + headerLength + maskLength, frameEnd);
    if (masked) {
      const mask = client.buffer.subarray(offset + headerLength, offset + headerLength + 4);
      payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
    }
    frames.push({ opcode, payload });
    offset = frameEnd;
  }
  client.buffer = client.buffer.subarray(offset);
  return frames;
}

async function handleWebSocketMessage(client, message) {
  let payload = {};
  try {
    payload = JSON.parse(message);
  } catch (error) {
    return;
  }
  if (payload.type === "online:get" || payload.type === "hello") {
    await sendOnlineUpdateToClient(client);
    return;
  }
  if (payload.type === "online:action") {
    try {
      await applyOnlineMatchAction(client.playerId, payload);
      await persistOnlineLobbies();
      await broadcastOnlineLobbies();
    } catch (error) {
      sendWebSocketJson(client, {
        type: "online:error",
        error: error.message || "Acao online recusada."
      });
    }
  }
}

function handleWebSocketData(client, chunk) {
  let frames;
  try {
    frames = readWebSocketFrames(client, chunk);
  } catch (error) {
    closeWebSocketClient(client);
    return;
  }

  frames.forEach((frame) => {
    if (frame.opcode === 0x1) {
      handleWebSocketMessage(client, frame.payload.toString("utf8")).catch(() => closeWebSocketClient(client));
    } else if (frame.opcode === 0x8) {
      closeWebSocketClient(client);
    } else if (frame.opcode === 0x9) {
      writeWebSocketFrame(client.socket, frame.payload, 0xA);
    }
  });
}

function handleWebSocketUpgrade(req, socket) {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  if (url.pathname !== "/ws/lobbies") {
    socket.destroy();
    return;
  }
  const key = req.headers["sec-websocket-key"];
  const cookies = parseCookies(req.headers.cookie);
  const playerId = cookies[PLAYER_COOKIE];
  if (!key || !isValidPlayerId(playerId)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${webSocketAcceptKey(key)}`,
    "\r\n"
  ].join("\r\n"));

  const client = { socket, playerId, buffer: Buffer.alloc(0) };
  wsClients.add(client);
  markOnlinePlayerConnectionChanged(playerId);
  socket.on("data", (chunk) => handleWebSocketData(client, chunk));
  socket.on("close", () => {
    wsClients.delete(client);
    markOnlinePlayerConnectionChanged(playerId);
    broadcastOnlineLobbies().catch(() => {});
  });
  socket.on("error", () => closeWebSocketClient(client));
  sendOnlineUpdateToClient(client)
    .then(() => broadcastOnlineLobbies())
    .catch(() => closeWebSocketClient(client));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_SAVE_BYTES) {
      const error = new Error("Save muito grande.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readSave(playerId) {
  if (!isValidPlayerId(playerId)) return null;
  const row = db().prepare("SELECT updated_at, save_json FROM saves WHERE player_id = ?").get(playerId);
  if (!row) return null;
  return {
    updatedAt: row.updated_at,
    save: normalizeServerSave(jsonFromDb(row.save_json, {}))
  };
}

async function writeSave(playerId, save) {
  if (!isValidPlayerId(playerId)) {
    const error = new Error("Jogador invalido.");
    error.status = 400;
    throw error;
  }
  const updatedAt = new Date().toISOString();
  const normalizedSave = normalizeServerSave(save);
  db().prepare(`
    INSERT OR REPLACE INTO saves (player_id, updated_at, save_json)
    VALUES (?, ?, ?)
  `).run(playerId, updatedAt, JSON.stringify(normalizedSave));
  return { updatedAt, save: normalizedSave };
}

async function readOrCreateSave(playerId) {
  const record = await readSave(playerId);
  if (record) return record;
  return writeSave(playerId, defaultServerSave());
}

async function deleteSave(playerId) {
  if (!isValidPlayerId(playerId)) return;
  db().prepare("DELETE FROM saves WHERE player_id = ?").run(playerId);
}

async function registerProfile({ currentPlayerId, name, pin }) {
  const input = validateProfileInput(name, pin);
  const profiles = await readProfiles();
  if (profiles.profiles[input.key]) {
    const error = new Error("Ja existe um jogador com esse nome.");
    error.status = 409;
    throw error;
  }

  const playerId = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  const profile = {
    playerId,
    name: input.displayName,
    key: input.key,
    pinSalt: salt,
    pinHash: hashPin(input.pin, salt),
    createdAt: now,
    lastLoginAt: now
  };
  profiles.profiles[input.key] = profile;
  await writeProfiles(profiles);

  const currentRecord = currentPlayerId ? await readOrCreateSave(currentPlayerId) : null;
  const profileSave = normalizeServerSave(currentRecord?.save || defaultServerSave());
  await writeSave(playerId, profileSave);
  return { profile, save: profileSave };
}

async function loginProfile({ name, pin }) {
  const input = validateProfileInput(name, pin);
  const profiles = await readProfiles();
  const profile = profiles.profiles[input.key];
  if (!profile || hashPin(input.pin, profile.pinSalt) !== profile.pinHash) {
    const error = new Error("Nome ou PIN incorreto.");
    error.status = 401;
    throw error;
  }

  profile.lastLoginAt = new Date().toISOString();
  profiles.profiles[input.key] = profile;
  await writeProfiles(profiles);

  const record = await readSave(profile.playerId);
  const save = normalizeServerSave(record?.save || defaultServerSave());
  if (!record) await writeSave(profile.playerId, save);
  return { profile, save };
}

async function loginFirebaseProfile({ currentPlayerId, decodedToken }) {
  const uid = String(decodedToken?.uid || "");
  if (!uid) {
    const error = new Error("Usuario Firebase invalido.");
    error.status = 401;
    throw error;
  }

  const profiles = await readProfiles();
  const now = new Date().toISOString();
  const authData = firebaseAuthProfile(decodedToken, now);
  const existingFirebaseEntry = firebaseProfileEntry(profiles, uid);
  const currentProfileEntry = currentPlayerId ? profileEntryForPlayer(profiles, currentPlayerId) : null;
  const entry = existingFirebaseEntry || currentProfileEntry;

  if (entry) {
    const [key, storedProfile] = entry;
    const profile = {
      ...storedProfile,
      name: cleanProfileName(storedProfile.name) || firebaseDisplayName(decodedToken),
      authProviders: {
        ...(storedProfile.authProviders || {}),
        firebase: authData
      },
      lastLoginAt: now
    };
    profiles.profiles[key] = profile;
    await writeProfiles(profiles);

    const record = await readSave(profile.playerId);
    let save = normalizeServerSave(record?.save || defaultServerSave());
    let migratedGuestSave = false;

    if (existingFirebaseEntry && !currentProfileEntry && currentPlayerId && currentPlayerId !== profile.playerId) {
      const guestRecord = await readSave(currentPlayerId);
      const guestSave = normalizeServerSave(guestRecord?.save || defaultServerSave());
      if (guestRecord && hasServerEconomyProgress(guestSave) && (!record || !hasServerEconomyProgress(save))) {
        save = { ...guestSave, migratedFromLocalAt: now };
        await writeSave(profile.playerId, save);
        migratedGuestSave = true;
      }
    }

    if (!record && !migratedGuestSave) await writeSave(profile.playerId, save);
    return { profile, save, migratedGuestSave };
  }

  let key = firebaseProfileKey(uid);
  const baseKey = key;
  let suffix = 2;
  while (profiles.profiles[key]) {
    key = `${baseKey}-${suffix}`;
    suffix += 1;
  }

  const playerId = crypto.randomUUID();
  const profile = {
    playerId,
    name: firebaseDisplayName(decodedToken),
    key,
    authProviders: { firebase: authData },
    createdAt: now,
    lastLoginAt: now
  };
  profiles.profiles[key] = profile;
  await writeProfiles(profiles);

  const currentRecord = currentPlayerId ? await readOrCreateSave(currentPlayerId) : null;
  const save = normalizeServerSave(currentRecord?.save || defaultServerSave());
  const migratedGuestSave = Boolean(currentRecord && hasServerEconomyProgress(save));
  if (migratedGuestSave) save.migratedFromLocalAt = now;
  await writeSave(playerId, save);
  return { profile, save, migratedGuestSave };
}

function defaultServerSave() {
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
    migratedFromLocalAt: null,
    tutorial: Object.fromEntries(TUTORIAL_STEPS.map((step) => [step.id, false])),
    tutorialRewardClaimed: false,
    missionDate: new Date().toISOString().slice(0, 10),
    missions: Object.fromEntries(MISSIONS.map((mission) => [
      mission.id,
      { progress: mission.id === "login" ? 1 : 0, claimed: false }
    ]))
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeServerId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeServerRarity(rarity, fallback = "Comum") {
  if (rarity === "Mitico") return "Mistico";
  return RARITIES[rarity] ? rarity : fallback;
}

function sanitizeServerCustomCatalog(items = []) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items.map((item) => {
    if (!item || typeof item !== "object") return null;
    const id = sanitizeServerId(item.id || item.name);
    if (!id || seen.has(id) || MONSTER_BY_ID[id]) return null;
    seen.add(id);

    const rawTypes = Array.isArray(item.types) ? item.types : [item.type || item.role];
    const validTypes = rawTypes
      .map((type) => String(type || "").trim())
      .filter((type) => type === "Goleiro" || GAME_DATA.TYPES?.[type])
      .slice(0, 2);
    const keeper = item.isGoalkeeper === true || item.role === "Goleiro" || validTypes.includes("Goleiro") || Boolean(item.keeperAbility);
    const types = keeper ? ["Goleiro"] : validTypes.filter((type) => type !== "Goleiro");
    const rarity = normalizeServerRarity(item.rarity);
    const stat = (value, fallback) => clamp(Math.round(Number(value)) || fallback, 1, 999);

    return {
      ...item,
      id,
      number: clamp(Math.floor(Number(item.number)) || 999, 1, 9999),
      name: safeText(item.name, "Novo Tazzo", 48),
      types: types.length ? types : ["Atacante"],
      rarity,
      vitality: keeper ? 0 : stat(item.vitality, 90),
      shot: keeper ? 0 : stat(item.shot, 70),
      dribble: keeper ? 0 : stat(item.dribble, 70),
      speed: keeper ? 0 : stat(item.speed, 70),
      role: keeper ? "Goleiro" : safeText(item.role, types[0] || "Atacante", 36),
      keeperAbility: keeper ? safeText(item.keeperAbility, "extraTurn", 32) : null,
      cost: clamp(Math.round(Number(item.cost)) || RARITIES[rarity]?.cost || 1, 1, 99),
      custom: true
    };
  }).filter(Boolean);
}

function serverCatalogForSave(save = {}) {
  const catalog = new Map(MONSTERS.map((monster) => [monster.id, monster]));
  sanitizeServerCustomCatalog(save.customTazzos || []).forEach((custom) => {
    catalog.set(custom.id, custom);
  });
  return catalog;
}

function isServerGoalkeeperMonster(monster) {
  return Boolean(monster?.keeperAbility || monster?.role === "Goleiro" || monster?.types?.includes("Goleiro"));
}

function normalizeServerTeam(team, collection, catalog, fallbackTeam) {
  const picked = Array.isArray(team) ? team : [];
  const fallback = Array.isArray(fallbackTeam) ? fallbackTeam : [];
  return [...picked, ...fallback]
    .filter((id, index, array) => array.indexOf(id) === index)
    .filter((id) => collection[id] > 0 && catalog.has(id) && !isServerGoalkeeperMonster(catalog.get(id)))
    .slice(0, 3);
}

function normalizeServerGoalkeeper(goalkeeper, collection, catalog, fallbackGoalkeeper) {
  const candidates = [goalkeeper, fallbackGoalkeeper, ...catalog.keys()];
  return candidates.find((id) => collection[id] > 0 && catalog.has(id) && isServerGoalkeeperMonster(catalog.get(id))) || "";
}

function normalizeServerSave(rawSave = {}) {
  const fresh = defaultServerSave();
  const save = rawSave && typeof rawSave === "object" ? rawSave : {};
  const customTazzos = sanitizeServerCustomCatalog(save.customTazzos || []);
  const catalog = serverCatalogForSave({ ...save, customTazzos });
  const musicVolume = Number(save.musicVolume ?? fresh.musicVolume);
  const migratedFromLocalAt = safeText(save.migratedFromLocalAt, "", 64) || null;
  const collection = {};
  Object.entries({ ...fresh.collection, ...(save.collection || {}) }).forEach(([id, count]) => {
    if (catalog.has(id)) collection[id] = Math.max(0, Math.floor(Number(count)) || 0);
  });
  const missions = Object.fromEntries(MISSIONS.map((mission) => [
    mission.id,
    {
      ...fresh.missions[mission.id],
      ...((save.missions || {})[mission.id] || {})
    }
  ]));
  const tutorial = Object.fromEntries(TUTORIAL_STEPS.map((step) => [
    step.id,
    Boolean((save.tutorial || fresh.tutorial)[step.id])
  ]));

  return {
    ...fresh,
    ...save,
    merreis: Math.max(0, Math.floor(Number(save.merreis ?? fresh.merreis)) || 0),
    fragments: Math.max(0, Math.floor(Number(save.fragments ?? fresh.fragments)) || 0),
    trophies: Math.max(0, Math.floor(Number(save.trophies ?? fresh.trophies)) || 0),
    rankedWins: Math.max(0, Math.floor(Number(save.rankedWins ?? fresh.rankedWins)) || 0),
    rankedLosses: Math.max(0, Math.floor(Number(save.rankedLosses ?? fresh.rankedLosses)) || 0),
    tournamentWins: Math.max(0, Math.floor(Number(save.tournamentWins ?? fresh.tournamentWins)) || 0),
    onlineTrophies: Math.max(0, Math.floor(Number(save.onlineTrophies ?? fresh.onlineTrophies)) || 0),
    onlineWins: Math.max(0, Math.floor(Number(save.onlineWins ?? fresh.onlineWins)) || 0),
    onlineLosses: Math.max(0, Math.floor(Number(save.onlineLosses ?? fresh.onlineLosses)) || 0),
    onlineDraws: Math.max(0, Math.floor(Number(save.onlineDraws ?? fresh.onlineDraws)) || 0),
    collection,
    customTazzos,
    team: normalizeServerTeam(save.team || fresh.team, collection, catalog, fresh.team),
    goalkeeper: normalizeServerGoalkeeper(save.goalkeeper || fresh.goalkeeper, collection, catalog, fresh.goalkeeper),
    missions,
    tutorial,
    upgrades: save.upgrades && typeof save.upgrades === "object" ? save.upgrades : fresh.upgrades,
    cosmetics: save.cosmetics && typeof save.cosmetics === "object" ? save.cosmetics : fresh.cosmetics,
    friendGifts: save.friendGifts && typeof save.friendGifts === "object" ? save.friendGifts : fresh.friendGifts,
    packPity: sanitizePackPity(save.packPity || fresh.packPity),
    musicTrackIndex: Math.max(0, Math.floor(Number(save.musicTrackIndex ?? fresh.musicTrackIndex)) || 0),
    musicVolume: Number.isFinite(musicVolume) ? clamp(musicVolume, 0, 1) : fresh.musicVolume,
    migratedFromLocalAt
  };
}

function economicSaveFingerprint(save) {
  const normalized = normalizeServerSave(save);
  return JSON.stringify({
    merreis: normalized.merreis,
    fragments: normalized.fragments,
    collection: normalized.collection,
    customTazzos: normalized.customTazzos,
    upgrades: normalized.upgrades,
    packPity: normalized.packPity,
    trophies: normalized.trophies,
    rankedWins: normalized.rankedWins,
    rankedLosses: normalized.rankedLosses,
    tournamentWins: normalized.tournamentWins,
    onlineTrophies: normalized.onlineTrophies,
    onlineWins: normalized.onlineWins,
    onlineLosses: normalized.onlineLosses,
    onlineDraws: normalized.onlineDraws,
    activeCompetitive: normalized.activeCompetitive,
    cosmetics: normalized.cosmetics,
    friendGifts: normalized.friendGifts,
    missions: normalized.missions,
    tutorialRewardClaimed: normalized.tutorialRewardClaimed
  });
}

function hasServerEconomyProgress(save) {
  return economicSaveFingerprint(save) !== economicSaveFingerprint(defaultServerSave());
}

const PROTECTED_SAVE_FIELDS = [
  "createdAt",
  "merreis",
  "fragments",
  "collection",
  "customTazzos",
  "upgrades",
  "packPity",
  "trophies",
  "rankedWins",
  "rankedLosses",
  "tournamentWins",
  "onlineTrophies",
  "onlineWins",
  "onlineLosses",
  "onlineDraws",
  "activeCompetitive",
  "cosmetics",
  "friendGifts",
  "missions",
  "tutorialRewardClaimed",
  "migratedFromLocalAt"
];

function changedProtectedFields(currentSave, incomingSave = {}) {
  if (!incomingSave || typeof incomingSave !== "object" || Array.isArray(incomingSave)) return [];
  const current = normalizeServerSave(currentSave);
  const incoming = normalizeServerSave({ ...current, ...incomingSave });
  return PROTECTED_SAVE_FIELDS.filter((field) => {
    if (!Object.prototype.hasOwnProperty.call(incomingSave, field)) return false;
    return JSON.stringify(current[field]) !== JSON.stringify(incoming[field]);
  });
}

function mergeClientSafeSave(currentSave, incomingSave = {}) {
  const current = normalizeServerSave(currentSave);
  const incoming = incomingSave && typeof incomingSave === "object" && !Array.isArray(incomingSave) ? incomingSave : {};
  const next = normalizeServerSave(current);
  const catalog = serverCatalogForSave(next);

  if (Array.isArray(incoming.team)) {
    next.team = normalizeServerTeam(incoming.team, next.collection, catalog, next.team);
  }
  if (Object.prototype.hasOwnProperty.call(incoming, "goalkeeper")) {
    next.goalkeeper = normalizeServerGoalkeeper(incoming.goalkeeper, next.collection, catalog, next.goalkeeper);
  }
  if (Object.prototype.hasOwnProperty.call(incoming, "selectedCosmetic")) {
    const selected = String(incoming.selectedCosmetic || "");
    const exists = SHOP_ITEMS.some((item) => item.id === selected);
    next.selectedCosmetic = selected && exists && next.cosmetics?.[selected] ? selected : null;
  }
  if (Object.prototype.hasOwnProperty.call(incoming, "musicTrackIndex")) {
    next.musicTrackIndex = Math.max(0, Math.floor(Number(incoming.musicTrackIndex)) || 0);
  }
  if (Object.prototype.hasOwnProperty.call(incoming, "musicVolume")) {
    const volume = Number(incoming.musicVolume);
    next.musicVolume = Number.isFinite(volume) ? clamp(volume, 0, 1) : next.musicVolume;
  }
  if (incoming.tutorial && typeof incoming.tutorial === "object" && !Array.isArray(incoming.tutorial)) {
    next.tutorial = Object.fromEntries(TUTORIAL_STEPS.map((step) => [
      step.id,
      Boolean(current.tutorial?.[step.id] || incoming.tutorial?.[step.id])
    ]));
  }

  return next;
}

async function updateSafeSaveForPlayer(playerId, incomingSave) {
  const record = await readOrCreateSave(playerId);
  const ignoredFields = changedProtectedFields(record.save, incomingSave);
  const safeSave = mergeClientSafeSave(record.save, incomingSave);
  const saved = await writeSave(playerId, safeSave);
  return { ...saved, ignoredFields };
}

async function migrateSaveForPlayer(playerId, incomingSave) {
  if (!incomingSave || typeof incomingSave !== "object" || Array.isArray(incomingSave)) {
    const error = new Error("Save de migracao invalido.");
    error.status = 400;
    throw error;
  }
  const profile = await profileForPlayer(playerId);
  if (profile) {
    const error = new Error("Perfil online ja vinculado. A migracao inicial nao esta mais disponivel.");
    error.status = 409;
    throw error;
  }

  const record = await readSave(playerId);
  const currentSave = record?.save || defaultServerSave();
  if (currentSave.migratedFromLocalAt || (record && hasServerEconomyProgress(currentSave))) {
    const error = new Error("Este jogador ja tem progresso no servidor. A importacao local foi ignorada.");
    error.status = 409;
    error.save = currentSave;
    throw error;
  }

  const migrated = normalizeServerSave(incomingSave);
  migrated.migratedFromLocalAt = new Date().toISOString();
  return writeSave(playerId, migrated);
}

function sanitizePackPity(packPity = {}) {
  return {
    sinceLegendaryPlus: clamp(Math.floor(Number(packPity.sinceLegendaryPlus)) || 0, 0, LEGENDARY_BOOST_MAX_TAZZOS)
  };
}

function rarityIndex(rarity) {
  return Object.keys(RARITIES).indexOf(rarity);
}

function isAtLeastRarity(rarity, minRarity) {
  return rarityIndex(rarity) >= rarityIndex(minRarity);
}

function rarityAtLeast(minRarity) {
  const order = Object.keys(RARITIES);
  return order.slice(Math.max(0, order.indexOf(minRarity)));
}

function randomFloat() {
  return crypto.randomInt(0, 1_000_000_000) / 1_000_000_000;
}

function randomItem(items) {
  return items[crypto.randomInt(0, items.length)];
}

function legendaryBoostMultiplier(count) {
  if (count >= LEGENDARY_BOOST_MAX_TAZZOS) return LEGENDARY_BOOST_MAX_MULTIPLIER;
  if (count >= LEGENDARY_BOOST_TAZZOS) return LEGENDARY_BOOST_MULTIPLIER;
  return 1;
}

function weightedRarityChoice(entries) {
  const safeEntries = entries.length ? entries : Object.entries(RARITIES);
  const total = safeEntries.reduce((sum, [, rarity]) => sum + rarity.chance, 0);
  let roll = randomFloat() * total;
  for (const [name, data] of safeEntries) {
    roll -= data.chance;
    if (roll <= 0) return name;
  }
  return "Comum";
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
    if (!regularEntries.length || randomFloat() < boostedLegendaryChance) {
      return weightedRarityChoice(legendaryEntries);
    }
    return weightedRarityChoice(regularEntries);
  }
  return weightedRarityChoice(entries);
}

function randomMonster(minRarity, options = {}) {
  const allowedRarities = minRarity ? rarityAtLeast(minRarity) : Object.keys(RARITIES);
  const rarity = rollRarityFrom(allowedRarities, options);
  const pool = MONSTERS.filter((monster) => allowedRarities.includes(monster.rarity));
  const rarityPool = MONSTERS.filter((monster) => monster.rarity === rarity);
  const safePool = rarityPool.length ? rarityPool : pool.length ? pool : MONSTERS;
  return randomItem(safePool);
}

function nextPackPity(previousPity, monster) {
  return isAtLeastRarity(monster.rarity, "Lendario")
    ? 0
    : previousPity.sinceLegendaryPlus + 1;
}

function progressServerMission(save, id, amount) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission || mission.scope === "album") return;
  if (!save.missions[id]) save.missions[id] = { progress: 0, claimed: false };
  save.missions[id].progress = clamp((Number(save.missions[id].progress) || 0) + amount, 0, mission.target);
}

function isGoalkeeper(monsterOrId) {
  const monster = typeof monsterOrId === "string" ? MONSTER_BY_ID[monsterOrId] : monsterOrId;
  return monster?.role === "Goleiro" || monster?.types?.includes("Goleiro");
}

function upgradeLevel(save, monsterId) {
  return clamp(Number(save.upgrades?.[monsterId]) || 0, 0, 2);
}

function upgradeCost(monsterId, level) {
  const monster = MONSTER_BY_ID[monsterId];
  const rarityFragments = RARITIES[monster?.rarity]?.fragments || 3;
  return {
    fragments: Math.round(rarityFragments * (2 + level)),
    merreis: Math.round((220 + level * 180) * (monster?.cost || 1))
  };
}

function albumMissionProgress(save, mission) {
  const [from, to] = mission.range || [0, -1];
  return MONSTERS
    .filter((monster) => monster.number >= from && monster.number <= to)
    .filter((monster) => (save.collection[monster.id] || 0) > 0)
    .length;
}

function missionStatus(save, mission) {
  const saved = save.missions[mission.id] || { progress: 0, claimed: false };
  if (mission.scope === "album") {
    return {
      progress: albumMissionProgress(save, mission),
      claimed: Boolean(saved.claimed)
    };
  }
  return {
    progress: Number(saved.progress) || 0,
    claimed: Boolean(saved.claimed)
  };
}

function serverTeamCost(save) {
  const catalog = serverCatalogForSave(save);
  const fieldCost = (save.team || []).reduce((sum, id) => sum + (catalog.get(id)?.cost || 0), 0);
  const keeperCost = catalog.get(save.goalkeeper)?.cost || 0;
  return fieldCost + keeperCost;
}

function currentRankForSave(save) {
  return [...RANKS].reverse().find((rank) => (Number(save.trophies) || 0) >= rank.min) || RANKS[0];
}

function rankedOpponentForSave(save) {
  const rank = currentRankForSave(save);
  return RANKED_OPPONENTS.find((opponent) => opponent.rank === rank.name) || RANKED_OPPONENTS[0];
}

function activeCompetitiveMatch(type, extra = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    startedAt: new Date().toISOString(),
    resolved: false,
    ...extra
  };
}

function ownedCollectionCount(save) {
  const catalog = serverCatalogForSave(save);
  return [...catalog.keys()].filter((id) => (save.collection?.[id] || 0) > 0).length;
}

async function leaderboardRows(limit = 20) {
  const profiles = profilesByPlayerId(await readProfiles());
  const rowsFromDb = db().prepare("SELECT player_id, updated_at, save_json FROM saves").all();
  const rows = [];
  for (const row of rowsFromDb) {
    const playerId = row.player_id;
    try {
      const save = normalizeServerSave(jsonFromDb(row.save_json, {}));
      const profile = profiles[playerId];
      rows.push({
        playerId,
        name: profile?.name || "Visitante",
        trophies: Number(save.trophies) || 0,
        rankedWins: Number(save.rankedWins) || 0,
        rankedLosses: Number(save.rankedLosses) || 0,
        tournamentWins: Number(save.tournamentWins) || 0,
        onlineTrophies: Number(save.onlineTrophies) || 0,
        onlineWins: Number(save.onlineWins) || 0,
        onlineLosses: Number(save.onlineLosses) || 0,
        onlineDraws: Number(save.onlineDraws) || 0,
        album: ownedCollectionCount(save),
        albumTotal: MONSTERS.length + sanitizeServerCustomCatalog(save.customTazzos || []).length,
        rank: currentRankForSave(save).name,
        updatedAt: row.updated_at || profile?.lastLoginAt || profile?.createdAt || null,
        guest: !profile
      });
    } catch (error) {
      // Ignore a single corrupt save row so the leaderboard still loads.
    }
  }
  return rows
    .sort((a, b) => b.onlineTrophies - a.onlineTrophies || b.trophies - a.trophies || b.onlineWins - a.onlineWins || b.album - a.album)
    .slice(0, limit);
}

function drawPackPulls(save, pack) {
  const pulls = [];
  const pity = sanitizePackPity(save.packPity);
  for (let index = 0; index < pack.cards; index += 1) {
    const guaranteed = pack.id === "recheado" && index === pack.cards - 1 ? "Raro" : null;
    const monster = randomMonster(guaranteed, {
      legendaryBoostMultiplier: legendaryBoostMultiplier(pity.sinceLegendaryPlus)
    });
    const isNew = !save.collection[monster.id];
    save.collection[monster.id] = (save.collection[monster.id] || 0) + 1;
    const fragments = isNew ? 0 : RARITIES[monster.rarity].fragments;
    save.fragments += fragments;
    pulls.push({ monsterId: monster.id, isNew, fragments, revealed: false });
    pity.sinceLegendaryPlus = nextPackPity(pity, monster);
  }
  save.packPity = pity;
  return pulls;
}

async function openPackForPlayer(playerId, packId) {
  await requireProfileForPlayer(playerId);
  const pack = PACKS.find((item) => item.id === packId);
  if (!pack) {
    const error = new Error("Pacotinho nao encontrado.");
    error.status = 404;
    throw error;
  }
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if (save.merreis < pack.cost) {
    const error = new Error("Merreis insuficientes.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.merreis -= pack.cost;
  const pulls = drawPackPulls(save, pack);
  if (pack.id === "familia") save.fragments += 8;
  progressServerMission(save, "pack", 1);
  await writeSave(playerId, save);
  return { save, pulls, pack };
}

async function buyShopItemForPlayer(playerId, itemId) {
  await requireProfileForPlayer(playerId);
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) {
    const error = new Error("Item da loja nao encontrado.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  save.cosmetics = save.cosmetics || {};

  let message = "";
  if (save.cosmetics[item.id]) {
    save.selectedCosmetic = item.id;
    message = `${item.name} ativado.`;
  } else {
    if (save.merreis < item.cost) {
      const error = new Error("Merreis insuficientes.");
      error.status = 400;
      error.save = save;
      throw error;
    }
    save.merreis -= item.cost;
    save.cosmetics[item.id] = true;
    save.selectedCosmetic = item.id;
    message = `${item.name} comprado.`;
  }

  await writeSave(playerId, save);
  return { save, item, message };
}

async function upgradeMonsterForPlayer(playerId, monsterId) {
  await requireProfileForPlayer(playerId);
  const monster = MONSTER_BY_ID[monsterId];
  if (!monster || isGoalkeeper(monster)) {
    const error = new Error("Tazzo nao pode ser melhorado.");
    error.status = 400;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if (!save.collection[monsterId]) {
    const error = new Error("Tazzo ainda nao obtido.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.upgrades = save.upgrades || {};
  const level = upgradeLevel(save, monsterId);
  if (level >= 2) {
    const error = new Error("Tazzo ja esta no nivel maximo.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  const cost = upgradeCost(monsterId, level);
  if (save.fragments < cost.fragments || save.merreis < cost.merreis) {
    const error = new Error("Recursos insuficientes.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.fragments -= cost.fragments;
  save.merreis -= cost.merreis;
  save.upgrades[monsterId] = level + 1;
  progressServerMission(save, "evolve", 1);
  await writeSave(playerId, save);
  return { save, monster, level: level + 1, cost };
}

async function claimMissionForPlayer(playerId, missionId) {
  await requireProfileForPlayer(playerId);
  const mission = MISSIONS.find((item) => item.id === missionId);
  if (!mission) {
    const error = new Error("Missao nao encontrada.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if (!save.missions[mission.id]) save.missions[mission.id] = { progress: 0, claimed: false };
  const status = missionStatus(save, mission);
  if (status.claimed) {
    const error = new Error("Missao ja resgatada.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  if (status.progress < mission.target) {
    const error = new Error("Missao ainda incompleta.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.missions[mission.id].claimed = true;
  save.merreis += mission.reward;
  await writeSave(playerId, save);
  return { save, mission };
}

async function tradeForPlayer(playerId, offerId, wishId) {
  await requireProfileForPlayer(playerId);
  const offered = MONSTER_BY_ID[offerId];
  const received = MONSTER_BY_ID[wishId];
  if (!offered || !received || offered.id === received.id) {
    const error = new Error("Troca invalida.");
    error.status = 400;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if ((save.collection[offered.id] || 0) <= 1 || save.collection[received.id]) {
    const error = new Error("Troca indisponivel para essa colecao.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  if (save.merreis < 60) {
    const error = new Error("Merreis insuficientes para trocar.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.collection[offered.id] -= 1;
  save.collection[received.id] = 1;
  save.merreis -= 60;
  progressServerMission(save, "trade", 1);
  await writeSave(playerId, save);
  return {
    save,
    offered,
    received,
    message: `${offered.name} virou ${received.name}.`
  };
}

async function sendFriendGiftForPlayer(playerId, friendId) {
  await requireProfileForPlayer(playerId);
  const friend = FRIENDS.find((item) => item.id === friendId);
  if (!friend) {
    const error = new Error("Amigo nao encontrado.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  const today = new Date().toISOString().slice(0, 10);
  save.friendGifts = save.friendGifts && typeof save.friendGifts === "object" ? save.friendGifts : {};
  save.friendGifts[today] = save.friendGifts[today] && typeof save.friendGifts[today] === "object" ? save.friendGifts[today] : {};
  if (save.friendGifts[today][friend.id]) {
    const error = new Error("Presente ja enviado hoje.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.friendGifts[today][friend.id] = true;
  save.merreis += 80;
  progressServerMission(save, "gift", 1);
  await writeSave(playerId, save);
  return {
    save,
    friend,
    reward: 80,
    message: `Presente enviado para ${friend.name}: +80 Merreis.`
  };
}

async function startRankedForPlayer(playerId) {
  await requireProfileForPlayer(playerId);
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if (save.activeCompetitive && !save.activeCompetitive.resolved) {
    const error = new Error("Ja existe uma partida competitiva ativa.");
    error.status = 409;
    error.save = save;
    throw error;
  }
  if (serverTeamCost(save) > 10) {
    const error = new Error("Time acima do custo competitivo.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  const rank = currentRankForSave(save);
  const opponent = rankedOpponentForSave(save);
  const match = activeCompetitiveMatch("ranked", {
    rank: rank.name,
    opponent: opponent.name
  });
  save.activeCompetitive = match;
  progressServerMission(save, "ranked", 1);
  await writeSave(playerId, save);
  return { save, match, rank, opponent };
}

async function startTournamentForPlayer(playerId, tournamentId) {
  await requireProfileForPlayer(playerId);
  const tournament = TOURNAMENTS.find((item) => item.id === tournamentId);
  if (!tournament) {
    const error = new Error("Torneio nao encontrado.");
    error.status = 404;
    throw error;
  }
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if (save.activeCompetitive && !save.activeCompetitive.resolved) {
    const error = new Error("Ja existe uma partida competitiva ativa.");
    error.status = 409;
    error.save = save;
    throw error;
  }
  if (serverTeamCost(save) > 10) {
    const error = new Error("Time acima do custo competitivo.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  if (save.merreis < tournament.entry) {
    const error = new Error("Merreis insuficientes para entrar no torneio.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.merreis -= tournament.entry;
  const opponent = TOURNAMENT_OPPONENTS[tournament.id];
  const match = activeCompetitiveMatch("tournament", {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    opponent: opponent.name
  });
  save.activeCompetitive = match;
  progressServerMission(save, "tournament", 1);
  await writeSave(playerId, save);
  return { save, match, tournament, opponent };
}

function rankedResolution(save, outcome, reason = "") {
  if (outcome === "win") {
    const trophies = 90 + crypto.randomInt(0, 61);
    save.trophies += trophies;
    save.rankedWins += 1;
    save.merreis += 180;
    return {
      status: `Vitoria ranqueada! +${trophies} trofeus`,
      log: `Vitoria ranqueada${reason ? ` por ${reason}` : ""}: +${trophies} trofeus.`,
      rewards: [`+${trophies} trofeus`, "+180 Merreis"]
    };
  }

  if (outcome === "draw") {
    save.merreis += 80;
    return {
      status: "Empate ranqueado. +80 Merreis",
      log: `Empate ranqueado${reason ? ` por ${reason}` : ""}.`,
      rewards: ["Sem perda de trofeus", "+80 Merreis"]
    };
  }

  const loss = 28 + crypto.randomInt(0, 31);
  save.trophies = Math.max(0, save.trophies - loss);
  save.rankedLosses += 1;
  save.merreis += 45;
  return {
    status: `Derrota ranqueada. -${loss} trofeus`,
    log: `Derrota ranqueada${reason ? ` por ${reason}` : ""}: -${loss} trofeus.`,
    rewards: [`-${loss} trofeus`, "+45 Merreis"]
  };
}

function tournamentResolution(save, tournament, won, reason = "") {
  if (won) {
    const rewards = ["+70 trofeus"];
    save.tournamentWins += 1;
    save.trophies += 70;
    if (tournament.id === "event") {
      save.merreis += 100;
      const pack = PACKS.find((item) => item.id === "recheado");
      const pulls = drawPackPulls(save, pack);
      rewards.push("+100 Merreis", "Pacotinho Recheado");
      return {
        status: "Campeao do Evento! Pacotinho Recheado enviado.",
        log: `Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}.`,
        rewards,
        packReward: true,
        pack: { id: pack.id, name: pack.name },
        pulls
      };
    }

    save.merreis += tournament.reward;
    rewards.push(`+${tournament.reward.toLocaleString("pt-BR")} Merreis`);
    if (tournament.id === "weekly") {
      save.fragments += 24;
      rewards.push("+24 fragmentos");
    }
    return {
      status: `Campeao do torneio ${tournament.name}! +${tournament.reward.toLocaleString("pt-BR")} Merreis`,
      log: `Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}.`,
      rewards,
      packReward: false
    };
  }

  const refund = Math.floor(tournament.entry * 0.25);
  save.merreis += refund;
  return {
    status: `Eliminado no torneio ${tournament.name}. Reembolso ${refund.toLocaleString("pt-BR")} Merreis.`,
    log: `Eliminado no torneio ${tournament.name}${reason ? ` por ${reason}` : ""}.`,
    rewards: [`+${refund.toLocaleString("pt-BR")} Merreis reembolso`],
    packReward: false
  };
}

async function resolveCompetitiveForPlayer(playerId, payload = {}) {
  await requireProfileForPlayer(playerId);
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  const match = save.activeCompetitive;
  if (!match || match.resolved || match.id !== payload.matchId) {
    const error = new Error("Partida competitiva nao encontrada.");
    error.status = 409;
    error.save = save;
    throw error;
  }

  const reason = String(payload.reason || "").slice(0, 80);
  let result;
  if (match.type === "ranked") {
    const outcome = ["win", "draw", "loss"].includes(payload.outcome) ? payload.outcome : "loss";
    result = rankedResolution(save, outcome, reason);
  } else if (match.type === "tournament") {
    const tournament = TOURNAMENTS.find((item) => item.id === match.tournamentId);
    if (!tournament) {
      const error = new Error("Torneio da partida nao encontrado.");
      error.status = 404;
      error.save = save;
      throw error;
    }
    result = tournamentResolution(save, tournament, Boolean(payload.won), reason);
  } else {
    const error = new Error("Tipo competitivo invalido.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.activeCompetitive = null;
  await writeSave(playerId, save);
  return { save, match, result };
}

async function handleApi(req, res, url) {
  const { playerId, isNew } = getPlayer(req);
  const headers = isNew ? { "Set-Cookie": playerCookie(playerId) } : {};

  if (url.pathname === "/api/health") {
    json(res, 200, {
      ok: true,
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: IS_PRODUCTION ? "production" : "development",
      storage: "sqlite"
    }, headers);
    return;
  }

  if (url.pathname === "/api/firebase/config") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    const firebase = firebaseClientConfig();
    json(res, 200, {
      ok: true,
      enabled: firebase.enabled,
      config: firebase.enabled ? firebase.config : null,
      providers: firebase.enabled ? firebase.providers : [],
      providerLabels: FIREBASE_AUTH_PROVIDER_LABELS,
      sdkVersion: firebase.sdkVersion
    }, headers);
    return;
  }

  if (url.pathname === "/api/profile") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    const profile = await profileForPlayer(playerId);
    json(res, 200, {
      ok: true,
      playerId,
      profile: publicProfile(profile)
    }, headers);
    return;
  }

  if (url.pathname === "/api/leaderboard") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    const limit = clamp(Math.floor(Number(url.searchParams.get("limit"))) || 20, 1, 50);
    const profile = await profileForPlayer(playerId);
    json(res, 200, {
      ok: true,
      playerId,
      profile: publicProfile(profile),
      rows: await leaderboardRows(limit)
    }, headers);
    return;
  }

  if (url.pathname === "/api/lobbies") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    json(res, 200, await onlineLobbyPayload(playerId), headers);
    return;
  }

  if (url.pathname === "/api/lobbies/create") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    await readBody(req);
    await createOnlineLobby(playerId);
    const payload = await onlineLobbyPayload(playerId);
    await persistOnlineLobbies();
    json(res, 200, payload, headers);
    broadcastOnlineLobbies().catch(() => {});
    return;
  }

  if (url.pathname === "/api/lobbies/join") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      await joinOnlineLobby(playerId, payload.lobbyId);
      const result = await onlineLobbyPayload(playerId);
      await persistOnlineLobbies();
      json(res, 200, result, headers);
      broadcastOnlineLobbies().catch(() => {});
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao entrar na sala online."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/lobbies/leave") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      await leaveOnlineLobby(playerId);
      const payload = await onlineLobbyPayload(playerId);
      await persistOnlineLobbies();
      json(res, 200, payload, headers);
      broadcastOnlineLobbies().catch(() => {});
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao sair da sala online."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/lobbies/ready") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      await setOnlineLobbyReady(playerId, payload.ready);
      const result = await onlineLobbyPayload(playerId);
      await persistOnlineLobbies();
      json(res, 200, result, headers);
      broadcastOnlineLobbies().catch(() => {});
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao marcar pronto."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/lobbies/rematch") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      await requireProfileForPlayer(playerId);
      resetOnlineLobbyMatch(playerId);
      const result = await onlineLobbyPayload(playerId);
      await persistOnlineLobbies();
      json(res, 200, result, headers);
      broadcastOnlineLobbies().catch(() => {});
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao preparar revanche online."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/lobbies/forfeit") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      await claimOnlineForfeit(playerId);
      const result = await onlineLobbyPayload(playerId);
      await persistOnlineLobbies();
      json(res, 200, result, headers);
      broadcastOnlineLobbies().catch(() => {});
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao pedir W.O. online."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/lobbies/action") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      await applyOnlineMatchAction(playerId, payload);
      const result = await onlineLobbyPayload(playerId);
      await persistOnlineLobbies();
      json(res, 200, result, headers);
      broadcastOnlineLobbies().catch(() => {});
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao executar acao online."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/profile/register") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await registerProfile({
        currentPlayerId: playerId,
        name: payload.name,
        pin: payload.pin
      });
      json(res, 200, {
        ok: true,
        playerId: result.profile.playerId,
        profile: publicProfile(result.profile),
        save: result.save,
        migratedGuestSave: Boolean(result.migratedGuestSave)
      }, { "Set-Cookie": playerCookie(result.profile.playerId) });
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao criar jogador."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/profile/login") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await loginProfile({
        name: payload.name,
        pin: payload.pin
      });
      json(res, 200, {
        ok: true,
        playerId: result.profile.playerId,
        profile: publicProfile(result.profile),
        save: result.save,
        migratedGuestSave: Boolean(result.migratedGuestSave)
      }, { "Set-Cookie": playerCookie(result.profile.playerId) });
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao entrar."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/profile/firebase") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const decodedToken = await verifyFirebaseIdToken(payload.idToken);
      const result = await loginFirebaseProfile({
        currentPlayerId: playerId,
        decodedToken
      });
      json(res, 200, {
        ok: true,
        playerId: result.profile.playerId,
        profile: publicProfile(result.profile),
        save: result.save
      }, { "Set-Cookie": playerCookie(result.profile.playerId) });
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao entrar com Firebase."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/profile/logout") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    json(res, 200, { ok: true }, { "Set-Cookie": clearPlayerCookie() });
    return;
  }

  if (url.pathname === "/api/trade") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await tradeForPlayer(playerId, payload.offerId, payload.wishId);
      json(res, 200, {
        ok: true,
        playerId,
        save: result.save,
        offered: { id: result.offered.id, name: result.offered.name },
        received: { id: result.received.id, name: result.received.name },
        message: result.message
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao trocar tazzos.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/friend-gift") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await sendFriendGiftForPlayer(playerId, payload.friendId);
      json(res, 200, {
        ok: true,
        playerId,
        save: result.save,
        friend: { id: result.friend.id, name: result.friend.name },
        reward: result.reward,
        message: result.message
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao enviar presente.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/open-pack") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await openPackForPlayer(playerId, payload.packId);
      json(res, 200, {
        ok: true,
        playerId,
        pack: { id: result.pack.id, name: result.pack.name },
        pulls: result.pulls,
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao abrir pacotinho.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/shop") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await buyShopItemForPlayer(playerId, payload.itemId);
      json(res, 200, {
        ok: true,
        playerId,
        item: { id: result.item.id, name: result.item.name },
        message: result.message,
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro na loja.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/upgrade") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await upgradeMonsterForPlayer(playerId, payload.monsterId);
      json(res, 200, {
        ok: true,
        playerId,
        monster: { id: result.monster.id, name: result.monster.name },
        level: result.level,
        cost: result.cost,
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao melhorar tazzo.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/claim-mission") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await claimMissionForPlayer(playerId, payload.missionId);
      json(res, 200, {
        ok: true,
        playerId,
        mission: { id: result.mission.id, title: result.mission.title },
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao resgatar missao.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/ranked/start") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await startRankedForPlayer(playerId);
      json(res, 200, {
        ok: true,
        playerId,
        save: result.save,
        match: result.match,
        rank: result.rank,
        opponent: result.opponent
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao iniciar ranqueada.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/tournament/start") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await startTournamentForPlayer(playerId, payload.tournamentId);
      json(res, 200, {
        ok: true,
        playerId,
        save: result.save,
        match: result.match,
        tournament: result.tournament,
        opponent: result.opponent
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao iniciar torneio.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/competitive/resolve") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const result = await resolveCompetitiveForPlayer(playerId, payload);
      json(res, 200, {
        ok: true,
        playerId,
        save: result.save,
        match: result.match,
        result: result.result
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao resolver competitivo.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/save/migrate") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const record = await migrateSaveForPlayer(playerId, payload.save);
      const profile = await profileForPlayer(playerId);
      json(res, 200, {
        ok: true,
        playerId,
        profile: publicProfile(profile),
        save: record.save,
        updatedAt: record.updatedAt,
        migrated: true
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Migracao local recusada.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname !== "/api/save") {
    json(res, 404, { ok: false, error: "API nao encontrada." }, headers);
    return;
  }

  if (req.method === "GET") {
    const record = await readOrCreateSave(playerId);
    const profile = await profileForPlayer(playerId);
    json(res, 200, {
      ok: true,
      playerId,
      profile: publicProfile(profile),
      exists: Boolean(record),
      save: record?.save || null,
      updatedAt: record?.updatedAt || null
    }, headers);
    return;
  }

  if (req.method === "PUT") {
    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : {};
    if (!payload || typeof payload.save !== "object" || Array.isArray(payload.save)) {
      json(res, 400, { ok: false, error: "Payload de save invalido." }, headers);
      return;
    }
    await requireProfileForPlayer(playerId);
    const record = await updateSafeSaveForPlayer(playerId, payload.save);
    const profile = await profileForPlayer(playerId);
    json(res, 200, {
      ok: true,
      playerId,
      profile: publicProfile(profile),
      save: record.save,
      updatedAt: record.updatedAt,
      ignoredProtectedFields: record.ignoredFields,
      message: record.ignoredFields.length
        ? "Campos protegidos foram ignorados; use as acoes do servidor para progresso."
        : "Preferencias salvas."
    }, headers);
    return;
  }

  if (req.method === "DELETE") {
    await requireProfileForPlayer(playerId);
    await deleteSave(playerId);
    json(res, 200, { ok: true, playerId }, headers);
    return;
  }

  json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
    ...headers,
    Allow: "GET, PUT, DELETE"
  });
}

async function serveStatic(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Metodo nao permitido.");
    return;
  }

  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (filePath !== ROOT_DIR && !filePath.startsWith(ROOT_PREFIX)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      res.writeHead(302, { Location: "/" });
      res.end();
      return;
    }
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const cacheControl = contentType.startsWith("text/html") ? "no-store" : "public, max-age=3600";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Cache-Control": cacheControl
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const data = await fs.readFile(filePath);
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    const status = error.status || 500;
    if (req.url?.startsWith("/api/")) {
      json(res, status, { ok: false, error: error.message || "Erro interno." });
      return;
    }
    res.writeHead(status);
    res.end(error.message || "Erro interno.");
  }
});

server.on("upgrade", handleWebSocketUpgrade);

function shutdownServer(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Recebido ${signal}. Encerrando servidor Kick Tazzos...`);
  if (onlineHeartbeat) clearInterval(onlineHeartbeat);
  if (onlineTurnHeartbeat) clearInterval(onlineTurnHeartbeat);
  for (const client of [...wsClients]) closeWebSocketClient(client);
  const forceExit = setTimeout(() => {
    closeStorage();
    process.exit(1);
  }, 5000);
  forceExit.unref?.();
  server.close(() => {
    clearTimeout(forceExit);
    closeStorage();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdownServer("SIGINT"));
process.on("SIGTERM", () => shutdownServer("SIGTERM"));

async function startServer() {
  await initializeStorage();
  await loadOnlineLobbies();
  onlineHeartbeat = setInterval(() => {
    cleanupOnlineLobbies();
    broadcastOnlineLobbies().catch(() => {});
  }, 30000);
  onlineHeartbeat.unref?.();
  onlineTurnHeartbeat = setInterval(() => {
    if (resolveOnlineTurnTimeouts()) broadcastOnlineLobbies().catch(() => {});
  }, 1000);
  onlineTurnHeartbeat.unref?.();

  server.listen(PORT, HOST, () => {
    console.log(`Kick Tazzos server rodando em http://${HOST}:${PORT}/ (${IS_PRODUCTION ? "producao" : "local"})`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
