const crypto = require("node:crypto");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const vm = require("node:vm");
const { DatabaseSync } = require("node:sqlite");
const { URL } = require("node:url");

const ROOT_DIR = __dirname;

function loadLocalEnvFiles(rootDir) {
  const initialEnvKeys = new Set(Object.keys(process.env));
  [".env", ".env.local", ".env.crypto.local"].forEach((fileName) => {
    const filePath = path.join(rootDir, fileName);
    if (!fsSync.existsSync(filePath)) return;
    const text = fsSync.readFileSync(filePath, "utf8");
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index <= 0) return;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!initialEnvKeys.has(key) || !String(process.env[key] || "").trim()) {
        process.env[key] = value;
      }
    });
  });
}

loadLocalEnvFiles(ROOT_DIR);

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 8025;
const HOST = process.env.HOST || (IS_PRODUCTION ? "0.0.0.0" : "127.0.0.1");
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
const PLAYER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_SAVE_BYTES = 1024 * 1024 * 2;
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Math.floor(Number(process.env.RATE_LIMIT_WINDOW_MS)) || 60000);
const RATE_LIMIT_MAX = Math.max(1, Math.floor(Number(process.env.RATE_LIMIT_MAX)) || 240);
const RATE_LIMIT_SENSITIVE_MAX = Math.max(1, Math.floor(Number(process.env.RATE_LIMIT_SENSITIVE_MAX)) || 40);
const RATE_LIMIT_BUCKET_LIMIT = 10000;
const ONLINE_LOBBY_CAPACITY = 2;
const ONLINE_LOBBY_TTL_MS = 45 * 60 * 1000;
const ONLINE_PLAYER_IDLE_MS = 8 * 60 * 1000;
const ONLINE_PLAYER_AWAY_MS = Number(process.env.ONLINE_PLAYER_AWAY_MS) || 15000;
const ONLINE_FORFEIT_GRACE_MS = Number(process.env.ONLINE_FORFEIT_GRACE_MS) || 60000;
const TAZZO_CLASH_BASE_CHANCE = 0.25;
const TAZZO_CLASH_PERFECT_CHANCE = 0.3;
const TAZZO_CLASH_PERFECT_SCORE = 0.88;
const ACCOUNT_EVENT_RETENTION = Math.max(50, Math.floor(Number(process.env.ACCOUNT_EVENT_RETENTION) || 500));
const ACCOUNT_EVENT_DATA_BYTES = 4096;
const MERCADO_PAGO_ACCESS_TOKEN = String(process.env.MERCADO_PAGO_ACCESS_TOKEN || "").trim();
const MERCADO_PAGO_WEBHOOK_SECRET = String(process.env.MERCADO_PAGO_WEBHOOK_SECRET || "").trim();
const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";
const COMPETITIVE_MATCHMAKING_TIMEOUT_MS = 40000;
const COMPETITIVE_MATCHMAKING_RANK_WINDOWS = Object.freeze([
  { waitMs: 0, trophies: 120 },
  { waitMs: 12000, trophies: 260 },
  { waitMs: 25000, trophies: 520 },
  { waitMs: 35000, trophies: Infinity }
]);
const COMPETITIVE_WIN_POINTS = 10;
const COMPETITIVE_LOSS_POINTS = 5;
const COMPETITIVE_STREAK_BONUSES = Object.freeze({
  2: 2,
  3: 4,
  4: 6,
  5: 8
});
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
const STARTER_FIELD_SLOTS = [
  { label: "Atacante", test: (monster) => monster.types.includes("Atacante") },
  { label: "Meia", test: (monster) => monster.types.includes("Meia") },
  { label: "Zagueiro", test: (monster) => monster.role === "Zagueiro" || monster.types.includes("Defensor") }
];
const MISSION_PERIODS = ["daily", "weekly", "monthly"];
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
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf"
};

const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
});

const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ORIGIN_CHECK_EXEMPT_PATHS = new Set(["/api/mercadopago/webhook"]);
const SENSITIVE_RATE_LIMIT_PATHS = new Set([
  "/api/admin/login",
  "/api/mercadopago/webhook",
  "/api/open-pack",
  "/api/profile/firebase",
  "/api/profile/login",
  "/api/ranked/start",
  "/api/shop",
  "/api/shop/checkout",
  "/api/starter-pack",
  "/api/tournament/start",
  "/api/upgrade"
]);
const SENSITIVE_RATE_LIMIT_PREFIXES = [
  "/api/competitive/",
  "/api/friends/",
  "/api/lobbies/",
  "/api/social/",
  "/api/training-ai/"
];
const rateLimitBuckets = new Map();
const PLAYER_SESSION_FALLBACK_SECRET = crypto.randomBytes(32).toString("hex");
const ALLOW_LEGACY_PLAYER_COOKIES = !IS_PRODUCTION || ["1", "true", "yes"].includes(
  String(process.env.ALLOW_LEGACY_PLAYER_COOKIES || "").trim().toLowerCase()
);

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
  TAZZO_TRADE_VALUES,
  RANKS,
  TOURNAMENTS,
  TOURNAMENTS_AVAILABLE,
  PACKS,
  SHOP_ITEMS,
  MISSIONS,
  ECONOMY_REWARD_RULES,
  SOCIAL_SHARE_REWARDS,
  FRIENDS,
  BATTLE_MODES,
  BATTLE_FORMATIONS,
  RANKED_OPPONENTS,
  TOURNAMENT_OPPONENTS,
  TUTORIAL_STEPS
} = GAME_DATA;
const onlineLobbies = new Map();
const competitiveMatchmakingQueues = new Map();
const wsClients = new Set();
let storageDb = null;
let onlineLobbiesPersistQueue = Promise.resolve();
let onlineLobbiesWriteId = 0;
let onlineHeartbeat = null;
let onlineTurnHeartbeat = null;
let shuttingDown = false;
let firebaseCertCache = { certs: null, expiresAt: 0 };
const ADMIN_COOKIE = "tazzo-admin-session";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_ADMIN_EMAILS = ["quadskilla@gmail.com"];
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "").trim();

if (IS_PRODUCTION && !configuredPlayerSessionSecret()) {
  console.warn("SESSION_SECRET ou PLAYER_SESSION_SECRET ausente; sessoes de jogador serao invalidadas a cada reinicio.");
}

function missionPeriod(mission) {
  return mission?.period || (mission?.scope === "album" ? "album" : "daily");
}

function missionEvent(mission) {
  return mission?.event || mission?.id;
}

function missionCycleKey(period, date = new Date()) {
  const year = date.getUTCFullYear();
  if (period === "monthly") {
    return `${year}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  if (period === "weekly") {
    const day = date.getUTCDay() || 7;
    const thursday = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate() + 4 - day));
    const weekYear = thursday.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
    const firstDay = firstThursday.getUTCDay() || 7;
    const week = Math.ceil((((thursday - firstThursday) / 86400000) + firstDay) / 7);
    return `${weekYear}-W${String(week).padStart(2, "0")}`;
  }
  return date.toISOString().slice(0, 10);
}

function currentMissionCycles(date = new Date()) {
  return Object.fromEntries(MISSION_PERIODS.map((period) => [period, missionCycleKey(period, date)]));
}

function normalizeMissionCycles(cycles = {}, legacyMissionDate = new Date().toISOString().slice(0, 10)) {
  const current = currentMissionCycles();
  return {
    daily: String(cycles.daily || legacyMissionDate || current.daily),
    weekly: String(cycles.weekly || current.weekly),
    monthly: String(cycles.monthly || current.monthly)
  };
}

function defaultMissionStatuses() {
  return Object.fromEntries(MISSIONS.map((mission) => [
    mission.id,
    { progress: missionEvent(mission) === "login" ? 1 : 0, claimed: false }
  ]));
}

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...securityHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

function decodeCookieValue(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return "";
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((entry) => {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    return [rawKey, decodeCookieValue(rawValue.join("=") || "")];
  }).filter(([key]) => key));
}

function isValidPlayerId(value) {
  return /^[a-f0-9-]{36}$/i.test(String(value || ""));
}

function configuredPlayerSessionSecret() {
  return String(
    process.env.PLAYER_SESSION_SECRET
    || process.env.SESSION_SECRET
    || process.env.ADMIN_SESSION_SECRET
    || ADMIN_TOKEN
    || ""
  ).trim();
}

function playerSessionSecret() {
  return configuredPlayerSessionSecret() || PLAYER_SESSION_FALLBACK_SECRET;
}

function signPlayerSession(playerId) {
  return crypto.createHmac("sha256", playerSessionSecret()).update(`v1.${playerId}`).digest("hex");
}

function encodePlayerSession(playerId) {
  return `v1.${playerId}.${signPlayerSession(playerId)}`;
}

function decodePlayerSession(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const [version, playerId, signature, ...extra] = raw.split(".");
  if (version === "v1" && !extra.length && isValidPlayerId(playerId) && signature) {
    return safeEqualText(signature, signPlayerSession(playerId)) ? { playerId, legacy: false } : null;
  }
  if (ALLOW_LEGACY_PLAYER_COOKIES && isValidPlayerId(raw)) {
    return { playerId: raw, legacy: true };
  }
  return null;
}

function getPlayer(req) {
  const cookies = parseCookies(req.headers.cookie);
  const session = decodePlayerSession(cookies[PLAYER_COOKIE]);
  const playerId = session?.playerId || crypto.randomUUID();
  const isNew = !session || session.legacy;
  return { playerId, isNew };
}

function playerCookieFlags(req, maxAgeSeconds) {
  return [
    "Path=/",
    `Max-Age=${Math.max(0, Math.floor(Number(maxAgeSeconds)) || 0)}`,
    "HttpOnly",
    "SameSite=Lax",
    isHttpsRequest(req) ? "Secure" : ""
  ].filter(Boolean).join("; ");
}

function playerCookie(playerId, req = null) {
  return `${PLAYER_COOKIE}=${encodeURIComponent(encodePlayerSession(playerId))}; ${playerCookieFlags(req, PLAYER_SESSION_TTL_SECONDS)}`;
}

function clearPlayerCookie(req = null) {
  return `${PLAYER_COOKIE}=; ${playerCookieFlags(req, 0)}`;
}

function isHttpsRequest(req) {
  return req.socket?.encrypted || String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}

function securityHeaders(req = null) {
  const headers = { ...SECURITY_HEADERS };
  if (req && isHttpsRequest(req)) {
    headers["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
  }
  return headers;
}

function adminCookieFlags(req, maxAgeSeconds) {
  return [
    "Path=/",
    `Max-Age=${Math.max(0, Math.floor(Number(maxAgeSeconds)) || 0)}`,
    "HttpOnly",
    "SameSite=Lax",
    isHttpsRequest(req) ? "Secure" : ""
  ].filter(Boolean).join("; ");
}

function adminSessionSecret() {
  return String(process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || ADMIN_TOKEN || "").trim();
}

function signAdminSession(issuedAt) {
  const secret = adminSessionSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(String(issuedAt)).digest("hex");
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isValidAdminToken(token) {
  return Boolean(ADMIN_TOKEN) && safeEqualText(String(token || "").trim(), ADMIN_TOKEN);
}

function adminSessionCookie(req) {
  const issuedAt = Date.now();
  const signature = signAdminSession(issuedAt);
  return `${ADMIN_COOKIE}=${encodeURIComponent(`${issuedAt}.${signature}`)}; ${adminCookieFlags(req, ADMIN_SESSION_TTL_MS / 1000)}`;
}

function clearAdminSessionCookie(req) {
  return `${ADMIN_COOKIE}=; ${adminCookieFlags(req, 0)}`;
}

function appendSetCookie(headers = {}, cookie = "") {
  const existing = headers["Set-Cookie"];
  if (!existing) return { ...headers, "Set-Cookie": cookie };
  return {
    ...headers,
    "Set-Cookie": Array.isArray(existing) ? [...existing, cookie] : [existing, cookie]
  };
}

function hasValidAdminSession(req) {
  if (!ADMIN_TOKEN || !adminSessionSecret()) return false;
  const raw = parseCookies(req.headers.cookie)[ADMIN_COOKIE] || "";
  const [issuedAtText, signature] = String(raw).split(".");
  const issuedAt = Number(issuedAtText);
  if (!Number.isFinite(issuedAt) || !signature) return false;
  if (Date.now() - issuedAt > ADMIN_SESSION_TTL_MS || issuedAt > Date.now() + 60000) return false;
  return safeEqualText(signature, signAdminSession(issuedAtText));
}

function configuredAdminEmails() {
  return new Set([
    ...DEFAULT_ADMIN_EMAILS,
    ...String(process.env.ADMIN_EMAILS || "").split(/[,\s]+/)
  ].map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function adminEmailForProfile(profile) {
  return String(profile?.authProviders?.firebase?.email || "").trim().toLowerCase();
}

function isAdminProfile(profile) {
  const email = adminEmailForProfile(profile);
  if (!email || !configuredAdminEmails().has(email)) return false;
  return Boolean(profile?.authProviders?.firebase?.emailVerified);
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
    CREATE TABLE IF NOT EXISTS account_events (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      merreis INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      preference_id TEXT,
      init_point TEXT,
      sandbox_init_point TEXT,
      payment_id TEXT UNIQUE,
      mp_status TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      credited_at TEXT,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lobbies (
      id TEXT PRIMARY KEY,
      updated_at INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      from_player_id TEXT NOT NULL,
      to_player_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS friends (
      player_a TEXT NOT NULL,
      player_b TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (player_a, player_b)
    );
    CREATE TABLE IF NOT EXISTS friend_messages (
      id TEXT PRIMARY KEY,
      from_player_id TEXT NOT NULL,
      to_player_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      message TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS social_trade_offers (
      id TEXT PRIMARY KEY,
      from_player_id TEXT NOT NULL,
      to_player_id TEXT NOT NULL,
      offered_json TEXT NOT NULL,
      requested_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS tazzo_clash_duels (
      id TEXT PRIMARY KEY,
      from_player_id TEXT NOT NULL,
      to_player_id TEXT NOT NULL,
      offered_json TEXT NOT NULL,
      requested_json TEXT NOT NULL,
      status TEXT NOT NULL,
      current_turn_player_id TEXT,
      started_by_player_id TEXT,
      flipped_json TEXT NOT NULL,
      log_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_account_events_player_created ON account_events(player_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_account_events_type_created ON account_events(type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_player_created ON payment_orders(player_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_preference ON payment_orders(preference_id);
    CREATE INDEX IF NOT EXISTS idx_lobbies_updated_at ON lobbies(updated_at);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_to_status ON friend_requests(to_player_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_from_status ON friend_requests(from_player_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_friend_messages_pair_created ON friend_messages(from_player_id, to_player_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_social_trade_inbox ON social_trade_offers(to_player_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_social_trade_outbox ON social_trade_offers(from_player_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tazzo_clash_inbox ON tazzo_clash_duels(to_player_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tazzo_clash_outbox ON tazzo_clash_duels(from_player_id, status, updated_at DESC);
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

function normalizeFirebaseProviderId(provider) {
  const value = String(provider || "").toLowerCase();
  if (value === "google" || value === "google.com") return "google";
  if (value === "facebook" || value === "facebook.com") return "facebook";
  return value.replace(/\.com$/, "");
}

function firebaseProviderLabel(provider) {
  return FIREBASE_AUTH_PROVIDER_LABELS[normalizeFirebaseProviderId(provider)] || "Firebase";
}

function assertFirebaseProviderAllowed(authData) {
  const provider = normalizeFirebaseProviderId(authData?.provider);
  if (!configuredFirebaseProviders().includes(provider)) {
    const error = new Error("Este provedor de login nao esta liberado para criar ou entrar em contas.");
    error.status = 403;
    throw error;
  }
  return provider;
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
    provider: normalizeFirebaseProviderId(decodedToken.firebase?.sign_in_provider || "firebase").slice(0, 40),
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
    authLabel: firebaseAuth ? firebaseProviderLabel(firebaseAuth.provider) : "Perfil antigo",
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

function normalizePublicBaseUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (/^(localhost|127\.|0\.0\.0\.0|\[?::1\]?)$/i.test(url.hostname)) return "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    return "";
  }
}

function configuredPublicBaseUrl() {
  return normalizePublicBaseUrl(
    process.env.PUBLIC_BASE_URL
    || process.env.SITE_URL
    || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "")
    || ""
  );
}

function requestPublicBaseUrl(req) {
  if (!req) return "";
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = forwardedProto || (req.socket?.encrypted ? "https" : "");
  if (proto !== "https") return "";
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || String(req.headers.host || "").trim();
  if (!host) return "";
  return normalizePublicBaseUrl(`https://${host}`);
}

function normalizeOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "null") return "";
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.origin;
  } catch (error) {
    return "";
  }
}

function requestHostOrigin(req) {
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || String(req.headers.host || "").split(",")[0].trim();
  if (!host) return "";
  return normalizeOrigin(`${isHttpsRequest(req) ? "https" : "http"}://${host}`);
}

function allowedRequestOrigins(req) {
  const origins = new Set([
    requestHostOrigin(req),
    normalizeOrigin(configuredPublicBaseUrl()),
    normalizeOrigin(requestPublicBaseUrl(req))
  ].filter(Boolean));
  return origins;
}

function hasAllowedRequestOrigin(req, { allowMissing = !IS_PRODUCTION, useRefererFallback = true } = {}) {
  const origin = normalizeOrigin(req.headers.origin);
  const referer = useRefererFallback ? normalizeOrigin(req.headers.referer) : "";
  const suppliedOrigin = origin || referer;
  if (!suppliedOrigin) return allowMissing;
  return allowedRequestOrigins(req).has(suppliedOrigin);
}

function enforceMutationOrigin(req, url) {
  if (SAFE_HTTP_METHODS.has(req.method) || ORIGIN_CHECK_EXEMPT_PATHS.has(url.pathname)) return;
  if (hasAllowedRequestOrigin(req)) return;
  const error = new Error("Origem da requisicao nao permitida.");
  error.status = 403;
  throw error;
}

function isSensitiveRateLimitPath(pathname) {
  return SENSITIVE_RATE_LIMIT_PATHS.has(pathname)
    || SENSITIVE_RATE_LIMIT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function clientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwardedFor || req.socket?.remoteAddress || "unknown";
}

function pruneRateLimitBuckets(now = Date.now()) {
  if (rateLimitBuckets.size < RATE_LIMIT_BUCKET_LIMIT) return;
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}

function enforceRateLimit(req, url) {
  if (req.method === "OPTIONS") return;
  const now = Date.now();
  const sensitive = !SAFE_HTTP_METHODS.has(req.method) && isSensitiveRateLimitPath(url.pathname);
  const limit = sensitive ? RATE_LIMIT_SENSITIVE_MAX : RATE_LIMIT_MAX;
  const group = sensitive ? url.pathname : "api";
  const key = `${clientIp(req)}:${group}`;
  let bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitBuckets.set(key, bucket);
    pruneRateLimitBuckets(now);
  }
  bucket.count += 1;
  if (bucket.count <= limit) return;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const error = new Error("Muitas tentativas. Tente novamente em instantes.");
  error.status = 429;
  error.headers = { "Retry-After": String(retryAfterSeconds) };
  throw error;
}

function mercadoPagoCheckoutConfig(req = null) {
  const publicBaseUrl = configuredPublicBaseUrl() || requestPublicBaseUrl(req);
  const missing = [];
  if (!MERCADO_PAGO_ACCESS_TOKEN) missing.push("MERCADO_PAGO_ACCESS_TOKEN");
  if (!publicBaseUrl) missing.push("PUBLIC_BASE_URL HTTPS ou acesso por dominio HTTPS");
  return {
    configured: missing.length === 0,
    publicBaseUrl,
    missing
  };
}

function publicMercadoPagoConfig(req = null) {
  const config = mercadoPagoCheckoutConfig(req);
  return {
    configured: config.configured,
    message: config.configured
      ? "Checkout Mercado Pago pronto."
      : `Compra de Merreis indisponivel: configure ${config.missing.join(" e ")}.`
  };
}

function publicMerreisCoinConfig() {
  const chainId = Math.max(0, Math.floor(Number(process.env.MERREISCOIN_CHAIN_ID)) || 84532);
  const decimals = Math.max(0, Math.min(18, Math.floor(Number(process.env.MERREISCOIN_DECIMALS)) || 0));
  const contractAddress = String(process.env.MERREISCOIN_CONTRACT_ADDRESS || "").trim();
  const enabled = String(process.env.MERREISCOIN_TESTNET_ENABLED || "").toLowerCase() === "true"
    && /^0x[a-fA-F0-9]{40}$/.test(contractAddress)
    && chainId > 0;
  const networkName = safeText(process.env.MERREISCOIN_NETWORK || "base-sepolia", "base-sepolia", 48);
  const explorerUrl = safeText(process.env.MERREISCOIN_EXPLORER_URL || "https://sepolia.basescan.org", "", 180);
  return {
    enabled,
    sandbox: true,
    message: enabled
      ? `MerreisCoin testnet pronta em ${networkName}.`
      : "MerreisCoin testnet desligada. Implante o contrato e configure MERREISCOIN_CONTRACT_ADDRESS.",
    network: {
      name: networkName,
      chainId,
      explorerUrl
    },
    token: {
      name: "MerreisCoin",
      symbol: "MER",
      decimals,
      contractAddress
    }
  };
}

function merreisShopPlan(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId && entry.type === "merreis");
  if (!item) return null;
  const merreis = Math.max(0, Math.floor(Number(item.merreis)) || 0);
  const fragments = Math.max(0, Math.floor(Number(item.fragments)) || 0);
  const legendaryCards = Math.max(0, Math.floor(Number(item.legendaryCards)) || 0);
  const amountCents = Math.max(0, Math.floor(Number(item.priceCents)) || 0);
  const currency = String(item.currency || "BRL").toUpperCase();
  if ((!merreis && !fragments && !legendaryCards) || !amountCents || currency !== "BRL") return null;
  return {
    item,
    merreis,
    fragments,
    legendaryCards,
    amountCents,
    currency,
    oneTime: Boolean(item.oneTime)
  };
}

function shopPlanRewards(planOrItem = {}) {
  const item = planOrItem.item || planOrItem;
  return {
    merreis: Math.max(0, Math.floor(Number(planOrItem.merreis ?? item.merreis)) || 0),
    fragments: Math.max(0, Math.floor(Number(planOrItem.fragments ?? item.fragments)) || 0),
    legendaryCards: Math.max(0, Math.floor(Number(planOrItem.legendaryCards ?? item.legendaryCards)) || 0),
    oneTime: Boolean(planOrItem.oneTime ?? item.oneTime)
  };
}

function shopOrderRewards(order) {
  const item = SHOP_ITEMS.find((entry) => entry.id === order?.item_id) || {};
  const dataRewards = paymentOrderData(order).rewards || {};
  return shopPlanRewards({
    item,
    merreis: order?.merreis ?? dataRewards.merreis,
    fragments: dataRewards.fragments ?? item.fragments,
    legendaryCards: dataRewards.legendaryCards ?? item.legendaryCards,
    oneTime: dataRewards.oneTime ?? item.oneTime
  });
}

function paymentOrderPullTokens(order) {
  const pulls = paymentOrderData(order).creditedPulls;
  return Array.isArray(pulls)
    ? pulls.map((pull) => {
      const id = String(pull?.monster?.id || "").trim();
      if (!MONSTER_BY_ID[id]) return "";
      return `${id}:${pull.isNew ? "1" : "0"}`;
    }).filter(Boolean).slice(0, 12)
    : [];
}

function paymentOrderData(row) {
  return jsonFromDb(row?.data_json, {});
}

function publicPaymentOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    merreis: row.merreis,
    fragments: shopOrderRewards(row).fragments,
    legendaryCards: shopOrderRewards(row).legendaryCards,
    oneTime: shopOrderRewards(row).oneTime,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    preferenceId: row.preference_id || "",
    paymentId: row.payment_id || "",
    mpStatus: row.mp_status || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    creditedAt: row.credited_at || ""
  };
}

function normalizePaymentId(value) {
  return String(value || "").trim().replace(/[^0-9]/g, "").slice(0, 32);
}

function normalizeCheckoutIdempotencyKey(playerId, itemId, value) {
  const raw = String(value || "").trim();
  if (/^[a-f0-9-]{16,80}$/i.test(raw)) return `${playerId}:${itemId}:${raw}`.slice(0, 180);
  return `${playerId}:${itemId}:${crypto.randomUUID()}`;
}

function paymentOrderById(orderId) {
  return db().prepare("SELECT * FROM payment_orders WHERE id = ?").get(String(orderId || ""));
}

function paymentOrderByIdempotencyKey(idempotencyKey) {
  return db().prepare("SELECT * FROM payment_orders WHERE idempotency_key = ?").get(String(idempotencyKey || ""));
}

function creditedPaymentOrderForItem(playerId, itemId) {
  return db().prepare(`
    SELECT * FROM payment_orders
    WHERE player_id = ? AND item_id = ? AND status = 'credited'
    ORDER BY credited_at DESC, created_at DESC
    LIMIT 1
  `).get(playerId, itemId);
}

function reusableOneTimePaymentOrder(playerId, itemId) {
  return db().prepare(`
    SELECT * FROM payment_orders
    WHERE player_id = ? AND item_id = ? AND status IN ('pending', 'preference_failed')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(playerId, itemId);
}

function oneTimeShopItemClaimed(playerId, itemId, save = null) {
  return Boolean(save?.oneTimePurchases?.[itemId] || creditedPaymentOrderForItem(playerId, itemId));
}

function insertPendingPaymentOrder(playerId, plan, idempotencyKey) {
  const now = new Date().toISOString();
  const order = {
    id: crypto.randomUUID(),
    playerId,
    itemId: plan.item.id,
    itemName: plan.item.name,
    merreis: plan.merreis,
    amountCents: plan.amountCents,
    currency: plan.currency,
    status: "pending",
    idempotencyKey,
    createdAt: now,
    updatedAt: now
  };
  db().prepare(`
    INSERT INTO payment_orders (
      id, player_id, item_id, item_name, merreis, amount_cents, currency, status,
      idempotency_key, created_at, updated_at, data_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    order.id,
    order.playerId,
    order.itemId,
    order.itemName,
    order.merreis,
    order.amountCents,
    order.currency,
    order.status,
    order.idempotencyKey,
    order.createdAt,
    order.updatedAt,
    JSON.stringify({ rewards: shopPlanRewards(plan) })
  );
  return paymentOrderById(order.id);
}

function updatePaymentOrderPreference(orderId, preference) {
  const data = {
    preference: {
      id: preference.id || "",
      dateCreated: preference.date_created || "",
      collectorId: preference.collector_id || null
    }
  };
  db().prepare(`
    UPDATE payment_orders
    SET preference_id = ?, init_point = ?, sandbox_init_point = ?, updated_at = ?, data_json = ?
    WHERE id = ?
  `).run(
    String(preference.id || ""),
    String(preference.init_point || ""),
    String(preference.sandbox_init_point || ""),
    new Date().toISOString(),
    JSON.stringify(data),
    orderId
  );
  return paymentOrderById(orderId);
}

function markPaymentOrderStatus(orderId, status, details = {}) {
  const row = paymentOrderById(orderId);
  const data = { ...paymentOrderData(row), ...details };
  db().prepare(`
    UPDATE payment_orders
    SET status = ?, mp_status = COALESCE(?, mp_status), updated_at = ?, data_json = ?
    WHERE id = ?
  `).run(
    status,
    details.mpStatus || null,
    new Date().toISOString(),
    JSON.stringify(data),
    orderId
  );
  return paymentOrderById(orderId);
}

async function mercadoPagoRequest(pathname, options = {}) {
  const response = await fetch(`${MERCADO_PAGO_API_BASE}${pathname}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || payload.error || `Mercado Pago respondeu ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function cleanMercadoPagoDeviceId(value) {
  return safeText(value, "", 180)
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 180);
}

function mercadoPagoPayerFromProfile(profile) {
  if (!profile) return null;
  const firebaseAuth = profile.authProviders?.firebase || null;
  const email = safeText(firebaseAuth?.email || "", "", 160).trim();
  const nameParts = safeText(profile.name || "", "", 120)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const payer = {};
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) payer.email = email;
  if (nameParts[0]) payer.name = nameParts[0].slice(0, 80);
  if (nameParts.length > 1) payer.surname = nameParts.slice(1).join(" ").slice(0, 80);
  return Object.keys(payer).length ? payer : null;
}

async function createMercadoPagoPreference(order, req = null, checkoutOptions = {}) {
  const config = mercadoPagoCheckoutConfig(req);
  if (!config.configured) {
    const error = new Error(publicMercadoPagoConfig(req).message);
    error.status = 503;
    throw error;
  }
  const unitPrice = Number((order.amount_cents / 100).toFixed(2));
  const profile = await profileForPlayer(order.player_id);
  const payer = mercadoPagoPayerFromProfile(profile);
  const deviceId = cleanMercadoPagoDeviceId(checkoutOptions.deviceId || req?.headers?.["x-meli-session-id"]);
  const item = SHOP_ITEMS.find((entry) => entry.id === order.item_id) || {};
  const rewards = shopOrderRewards(order);
  const rewardText = [
    rewards.merreis ? `${rewards.merreis.toLocaleString("pt-BR")} Merreis` : "",
    rewards.fragments ? `${rewards.fragments.toLocaleString("pt-BR")} fragmentos` : "",
    rewards.legendaryCards ? `${rewards.legendaryCards.toLocaleString("pt-BR")} tazzos lendarios` : ""
  ].filter(Boolean).join(", ");
  const preference = {
    items: [{
      id: order.item_id,
      title: `${order.item_name} - Kick Tazzos`,
      description: item.note || `Pacote digital com ${rewardText} para usar no Kick Tazzos.`,
      category_id: "games",
      quantity: 1,
      currency_id: order.currency,
      unit_price: unitPrice
    }],
    external_reference: order.id,
    notification_url: `${config.publicBaseUrl}/api/mercadopago/webhook`,
    back_urls: {
      success: `${config.publicBaseUrl}/api/mercadopago/return?order_id=${encodeURIComponent(order.id)}&result=success`,
      pending: `${config.publicBaseUrl}/api/mercadopago/return?order_id=${encodeURIComponent(order.id)}&result=pending`,
      failure: `${config.publicBaseUrl}/api/mercadopago/return?order_id=${encodeURIComponent(order.id)}&result=failure`
    },
    statement_descriptor: "TAZZOSTRIKE",
    binary_mode: false,
    auto_return: "approved",
    metadata: {
      player_id: order.player_id,
      player_name: safeText(profile?.name || "", "", 80),
      item_id: order.item_id,
      merreis: rewards.merreis,
      fragments: rewards.fragments,
      legendary_cards: rewards.legendaryCards,
      product_kind: rewards.legendaryCards || rewards.fragments ? "digital_bundle" : "digital_currency"
    }
  };
  if (payer) preference.payer = payer;
  return mercadoPagoRequest("/checkout/preferences", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": order.idempotency_key,
      ...(deviceId ? { "X-meli-session-id": deviceId } : {})
    },
    body: JSON.stringify(preference)
  });
}

function mercadoPagoPaymentIdFromValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const direct = normalizePaymentId(text);
  if (/^[0-9]+$/.test(text)) return direct;
  const urlMatch = text.match(/\/payments\/([0-9]+)/i);
  if (urlMatch) return normalizePaymentId(urlMatch[1]);
  const trailingNumber = text.match(/([0-9]+)(?:[/?#].*)?$/);
  return trailingNumber ? normalizePaymentId(trailingNumber[1]) : direct;
}

function mercadoPagoPaymentIdFromNotification(url, payload = {}) {
  return mercadoPagoPaymentIdFromValue(
    url.searchParams.get("data.id")
    || url.searchParams.get("id")
    || payload?.data?.id
    || payload?.id
    || payload?.resource
  );
}

function timingSafeEqualHex(left, right) {
  try {
    const leftBuffer = Buffer.from(String(left || ""), "hex");
    const rightBuffer = Buffer.from(String(right || ""), "hex");
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
  } catch (error) {
    return false;
  }
}

function verifyMercadoPagoWebhookSignature(req, url, paymentId) {
  if (!MERCADO_PAGO_WEBHOOK_SECRET) return !IS_PRODUCTION;
  const xSignature = String(req.headers["x-signature"] || "");
  const xRequestId = String(req.headers["x-request-id"] || "");
  const parts = Object.fromEntries(xSignature.split(",").map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, value.join("=")];
  }).filter(([key, value]) => key && value));
  const ts = parts.ts || "";
  const hash = parts.v1 || "";
  const dataId = normalizePaymentId(url.searchParams.get("data.id") || paymentId);
  if (!xRequestId || !ts || !hash || !dataId) return false;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", MERCADO_PAGO_WEBHOOK_SECRET).update(manifest).digest("hex");
  return timingSafeEqualHex(expected, hash);
}

async function getMercadoPagoPayment(paymentId) {
  return mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET"
  });
}

function paymentAmountMatchesOrder(payment, order) {
  const paidCents = Math.round(Number(payment.transaction_amount) * 100);
  return paidCents === Number(order.amount_cents) && String(payment.currency_id || "BRL").toUpperCase() === order.currency;
}

function drawLegendaryRewardPulls(save, count) {
  const safeCount = Math.max(0, Math.floor(Number(count)) || 0);
  const legendaryPool = MONSTERS.filter((monster) => monster.rarity === "Lendario");
  const pulls = [];
  const usedThisReward = new Set();
  for (let index = 0; index < safeCount; index += 1) {
    const freshPool = legendaryPool.filter((monster) => !usedThisReward.has(monster.id));
    const pool = freshPool.length ? freshPool : legendaryPool;
    const monster = randomItem(pool);
    if (!monster) break;
    usedThisReward.add(monster.id);
    const previousCopies = Math.max(0, Math.floor(Number(save.collection[monster.id])) || 0);
    save.collection[monster.id] = previousCopies + 1;
    save.packPity = { sinceLegendaryPlus: 0 };
    pulls.push({ monsterId: monster.id, isNew: previousCopies <= 0, fragments: 0, revealed: true });
  }
  return pulls;
}

function applyPaidShopRewards(save, order, rewards = shopOrderRewards(order)) {
  save.merreis += rewards.merreis;
  save.fragments += rewards.fragments;
  const pulls = drawLegendaryRewardPulls(save, rewards.legendaryCards);
  let purchasedAt = "";
  if (rewards.oneTime) {
    purchasedAt = new Date().toISOString();
    save.oneTimePurchases = sanitizeServerOneTimePurchases(save.oneTimePurchases);
    save.oneTimePurchases[order.item_id] = purchasedAt;
  }
  return { rewards, pulls, purchasedAt };
}

async function creditApprovedMercadoPagoPayment(payment) {
  const orderId = String(payment.external_reference || "").trim();
  const paymentId = normalizePaymentId(payment.id);
  if (!orderId || !paymentId) {
    const error = new Error("Pagamento sem referencia externa valida.");
    error.status = 400;
    throw error;
  }

  let eventPayload = null;
  const result = runInTransaction((database) => {
    const order = database.prepare("SELECT * FROM payment_orders WHERE id = ?").get(orderId);
    if (!order) {
      const error = new Error("Ordem de pagamento nao encontrada.");
      error.status = 404;
      throw error;
    }
    if (order.payment_id && order.payment_id !== paymentId) {
      const error = new Error("Pagamento nao pertence a esta ordem.");
      error.status = 409;
      throw error;
    }
    if (payment.status !== "approved") {
      const now = new Date().toISOString();
      database.prepare(`
        UPDATE payment_orders
        SET status = ?, payment_id = COALESCE(payment_id, ?), mp_status = ?, updated_at = ?, data_json = ?
        WHERE id = ?
      `).run(
        payment.status === "pending" || payment.status === "in_process" ? "pending" : "rejected",
        paymentId,
        String(payment.status || ""),
        now,
        JSON.stringify({ ...paymentOrderData(order), lastPayment: { id: paymentId, status: payment.status, statusDetail: payment.status_detail || "" } }),
        order.id
      );
      return { credited: false, order: paymentOrderById(order.id), save: null };
    }
    if (!paymentAmountMatchesOrder(payment, order)) {
      const error = new Error("Valor do pagamento nao confere com a ordem.");
      error.status = 409;
      throw error;
    }
    if (order.status === "credited" && order.credited_at) {
      return { credited: false, alreadyCredited: true, order, save: null };
    }

    const saveRow = database.prepare("SELECT save_json FROM saves WHERE player_id = ?").get(order.player_id);
    const save = normalizeServerSave(saveRow ? jsonFromDb(saveRow.save_json, {}) : defaultServerSave());
    const rewards = shopOrderRewards(order);
    if (rewards.oneTime && save.oneTimePurchases?.[order.item_id]) {
      const now = new Date().toISOString();
      database.prepare(`
        UPDATE payment_orders
        SET status = 'duplicate_paid', payment_id = ?, mp_status = ?, updated_at = ?, data_json = ?
        WHERE id = ?
      `).run(
        paymentId,
        String(payment.status || ""),
        now,
        JSON.stringify({ ...paymentOrderData(order), duplicatePaidAt: now, lastPayment: { id: paymentId, status: payment.status, statusDetail: payment.status_detail || "" } }),
        order.id
      );
      const duplicateOrder = database.prepare("SELECT * FROM payment_orders WHERE id = ?").get(order.id);
      return { credited: false, alreadyClaimed: true, order: duplicateOrder, save };
    }
    const rewardResult = applyPaidShopRewards(save, order, rewards);
    const updatedAt = new Date().toISOString();
    const normalizedSave = normalizeServerSave(save);
    database.prepare(`
      INSERT OR REPLACE INTO saves (player_id, updated_at, save_json)
      VALUES (?, ?, ?)
    `).run(order.player_id, updatedAt, JSON.stringify(normalizedSave));
    database.prepare(`
      UPDATE payment_orders
      SET status = 'credited', payment_id = ?, mp_status = ?, updated_at = ?, credited_at = ?, data_json = ?
      WHERE id = ?
    `).run(
      paymentId,
      String(payment.status || ""),
      updatedAt,
      updatedAt,
      JSON.stringify({
        ...paymentOrderData(order),
        creditedRewards: rewardResult.rewards,
        creditedPulls: accountEventPulls(rewardResult.pulls),
        oneTimePurchasedAt: rewardResult.purchasedAt || "",
        lastPayment: { id: paymentId, status: payment.status, statusDetail: payment.status_detail || "" }
      }),
      order.id
    );
    const updatedOrder = database.prepare("SELECT * FROM payment_orders WHERE id = ?").get(order.id);
    eventPayload = {
      item: { id: order.item_id, name: order.item_name },
      orderId: order.id,
      paymentId,
      rewards: rewardResult.rewards,
      pulls: accountEventPulls(rewardResult.pulls),
      merreis: rewardResult.rewards.merreis,
      fragments: rewardResult.rewards.fragments,
      legendaryCards: rewardResult.rewards.legendaryCards,
      amountCents: order.amount_cents,
      balances: accountEventBalance(normalizedSave)
    };
    return { credited: true, order: updatedOrder, save: normalizedSave };
  });

  if (result.credited && eventPayload) {
    recordAccountEvent(result.order.player_id, "shop:merreis:paid", eventPayload);
  }
  return result;
}

async function validateMercadoPagoPayment(paymentId) {
  const payment = await getMercadoPagoPayment(paymentId);
  return creditApprovedMercadoPagoPayment(payment);
}

async function createMerreisCheckoutForPlayer(playerId, itemId, clientRequestId, req = null, checkoutOptions = {}) {
  await requireProfileForPlayer(playerId);
  const plan = merreisShopPlan(itemId);
  if (!plan) {
    const error = new Error("Pacote de Merreis invalido.");
    error.status = 400;
    throw error;
  }
  const config = mercadoPagoCheckoutConfig(req);
  if (!config.configured) {
    const error = new Error(publicMercadoPagoConfig(req).message);
    error.status = 503;
    throw error;
  }

  if (plan.oneTime) {
    const record = await readOrCreateSave(playerId);
    const save = normalizeServerSave(record.save);
    if (oneTimeShopItemClaimed(playerId, plan.item.id, save)) {
      const error = new Error("Pacote unico ja comprado nesta conta.");
      error.status = 409;
      error.save = save;
      throw error;
    }
  }

  const idempotencyKey = normalizeCheckoutIdempotencyKey(playerId, plan.item.id, clientRequestId);
  let order = paymentOrderByIdempotencyKey(idempotencyKey);
  if (!order && plan.oneTime) order = reusableOneTimePaymentOrder(playerId, plan.item.id);
  if (order?.init_point || order?.sandbox_init_point) {
    return { order, item: plan.item, checkoutUrl: order.init_point || order.sandbox_init_point };
  }
  if (!order) order = insertPendingPaymentOrder(playerId, plan, idempotencyKey);

  try {
    const preference = await createMercadoPagoPreference(order, req, checkoutOptions);
    order = updatePaymentOrderPreference(order.id, preference);
    return { order, item: plan.item, checkoutUrl: order.init_point || order.sandbox_init_point };
  } catch (error) {
    markPaymentOrderStatus(order.id, "preference_failed", {
      error: safeText(error.message, "Falha Mercado Pago.", 400),
      payload: error.payload || null
    });
    throw error;
  }
}

function redirectToPaymentReturn(res, status, params = {}, extraHeaders = {}) {
  const url = new URL("/", "http://localhost");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  res.writeHead(status, {
    ...securityHeaders(),
    ...extraHeaders,
    Location: `${url.pathname}${url.search}`,
    "Cache-Control": "no-store"
  });
  res.end();
}

function redirectToExternalCheckout(res, checkoutUrl, headers = {}) {
  res.writeHead(303, {
    ...securityHeaders(),
    ...headers,
    Location: String(checkoutUrl || ""),
    "Cache-Control": "no-store"
  });
  res.end();
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

async function adminContextForRequest(req, playerId) {
  const profile = await profileForPlayer(playerId);
  if (isAdminProfile(profile)) {
    return {
      authorized: true,
      method: "google",
      tokenEnabled: Boolean(ADMIN_TOKEN),
      profile: publicProfile(profile),
      email: adminEmailForProfile(profile)
    };
  }
  if (hasValidAdminSession(req)) {
    return {
      authorized: true,
      method: "token",
      tokenEnabled: Boolean(ADMIN_TOKEN),
      profile: publicProfile(profile),
      email: adminEmailForProfile(profile)
    };
  }
  return {
    authorized: false,
    method: "",
    tokenEnabled: Boolean(ADMIN_TOKEN),
    profile: publicProfile(profile),
    email: adminEmailForProfile(profile)
  };
}

async function requireAdminForRequest(req, playerId) {
  const context = await adminContextForRequest(req, playerId);
  if (context.authorized) return context;
  const error = new Error("Acesso admin restrito.");
  error.status = 403;
  error.context = context;
  throw error;
}

function cleanAccountEventType(type) {
  return String(type || "event")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "_")
    .slice(0, 64) || "event";
}

function accountEventDataJson(data = {}) {
  const payload = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  try {
    const jsonText = JSON.stringify(payload);
    if (Buffer.byteLength(jsonText, "utf8") <= ACCOUNT_EVENT_DATA_BYTES) return jsonText;
  } catch (error) {
    return "{}";
  }
  return JSON.stringify({ truncated: true });
}

function sanitizeTelemetryValue(value, depth = 0) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.slice(0, 240);
  if (Array.isArray(value)) {
    if (depth > 1) return `[${value.length}]`;
    return value.slice(0, 16).map((item) => sanitizeTelemetryValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    if (depth > 1) return "[object]";
    return Object.fromEntries(Object.entries(value).slice(0, 24).map(([key, item]) => [
      String(key).replace(/[^a-zA-Z0-9:_-]+/g, "_").slice(0, 48) || "value",
      sanitizeTelemetryValue(item, depth + 1)
    ]));
  }
  return String(value ?? "").slice(0, 120);
}

function sanitizeTelemetryData(data = {}) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return Object.fromEntries(Object.entries(source).slice(0, 40).map(([key, value]) => [
    String(key).replace(/[^a-zA-Z0-9:_-]+/g, "_").slice(0, 48) || "value",
    sanitizeTelemetryValue(value)
  ]));
}

function publicAccountEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    createdAt: row.created_at,
    data: jsonFromDb(row.data_json, {})
  };
}

function accountEventBalance(save = {}) {
  return {
    merreis: Math.max(0, Math.floor(Number(save.merreis)) || 0),
    fragments: Math.max(0, Math.floor(Number(save.fragments)) || 0),
    trophies: Math.max(0, Math.floor(Number(save.trophies)) || 0)
  };
}

function accountEventMonster(monster) {
  if (!monster) return null;
  return {
    id: monster.id,
    number: monster.number,
    name: monster.name,
    rarity: monster.rarity
  };
}

function accountEventPulls(pulls = []) {
  return Array.isArray(pulls)
    ? pulls.map((pull) => ({
      monster: accountEventMonster(MONSTER_BY_ID[pull.monsterId]),
      isNew: Boolean(pull.isNew),
      fragments: Math.max(0, Math.floor(Number(pull.fragments)) || 0)
    })).filter((pull) => pull.monster)
    : [];
}

function recordAccountEvent(playerId, type, data = {}) {
  if (!isValidPlayerId(playerId)) return null;
  const dataJson = accountEventDataJson(data);
  const event = {
    id: crypto.randomUUID(),
    playerId,
    type: cleanAccountEventType(type),
    createdAt: new Date().toISOString(),
    data: jsonFromDb(dataJson, {})
  };

  try {
    db().prepare(`
      INSERT INTO account_events (id, player_id, type, created_at, data_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(event.id, event.playerId, event.type, event.createdAt, dataJson);
    db().prepare(`
      DELETE FROM account_events
      WHERE player_id = ?
        AND id NOT IN (
          SELECT id FROM account_events
          WHERE player_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        )
    `).run(playerId, playerId, ACCOUNT_EVENT_RETENTION);
    return event;
  } catch (error) {
    console.error("Erro ao registrar evento de conta.", error);
    return null;
  }
}

function accountEventsForPlayer(playerId, limit = 40) {
  if (!isValidPlayerId(playerId)) return [];
  const safeLimit = clamp(Math.floor(Number(limit)) || 40, 1, 100);
  return db().prepare(`
    SELECT id, player_id, type, created_at, data_json
    FROM account_events
    WHERE player_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(playerId, safeLimit).map(publicAccountEvent).filter(Boolean);
}

function accountEventRowsSince(sinceIso, limit = 6000) {
  const safeLimit = clamp(Math.floor(Number(limit)) || 6000, 100, 20000);
  return db().prepare(`
    SELECT id, player_id, type, created_at, data_json
    FROM account_events
    WHERE created_at >= ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(sinceIso, safeLimit).map((row) => ({
    id: row.id,
    playerId: row.player_id,
    type: row.type,
    createdAt: row.created_at,
    data: jsonFromDb(row.data_json, {})
  }));
}

function incrementCount(map, key, amount = 1) {
  const safeKey = String(key || "").trim() || "desconhecido";
  map.set(safeKey, (map.get(safeKey) || 0) + amount);
}

function sortedCounts(map, limit = 12) {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

function shortEventData(data = {}) {
  const keys = ["tab", "stepId", "tutorialStep", "packId", "source", "mode", "winner", "reason", "itemId", "networkId"];
  return Object.fromEntries(keys
    .filter((key) => data[key] !== undefined && data[key] !== "")
    .map((key) => [key, data[key]]));
}

async function adminTelemetrySummary(days = 7) {
  const safeDays = clamp(Math.floor(Number(days)) || 7, 1, 90);
  const since = new Date(Date.now() - safeDays * 86400000).toISOString();
  const rows = accountEventRowsSince(since);
  const profilesById = profilesByPlayerId(await readProfiles());
  const uniquePlayers = new Set(rows.map((row) => row.playerId).filter(Boolean));
  const profilePlayers = new Set([...uniquePlayers].filter((playerId) => profilesById[playerId]));
  const guests = Math.max(0, uniquePlayers.size - profilePlayers.size);
  const typeCounts = new Map();
  const tabCounts = new Map();
  const tabPlayers = new Map();
  const packCounts = new Map();
  const battleCounts = new Map();
  const dayCounts = new Map();
  const playerCounts = new Map();
  const tutorial = new Map(TUTORIAL_STEPS.map((step) => [step.id, {
    id: step.id,
    title: step.title,
    action: 0,
    ready: 0,
    complete: 0,
    players: new Set()
  }]));

  rows.forEach((row) => {
    const data = row.data || {};
    incrementCount(typeCounts, row.type);
    incrementCount(playerCounts, row.playerId);
    incrementCount(dayCounts, String(row.createdAt || "").slice(0, 10));

    if (row.type === "client:tab:view" && data.tab) {
      incrementCount(tabCounts, data.tab);
      if (!tabPlayers.has(data.tab)) tabPlayers.set(data.tab, new Set());
      tabPlayers.get(data.tab).add(row.playerId);
    }

    if (row.type === "client:tutorial:action" || row.type === "client:tutorial:step_ready" || row.type === "client:tutorial:complete") {
      const step = tutorial.get(String(data.stepId || ""));
      if (step) {
        if (row.type.endsWith(":action")) step.action += 1;
        if (row.type.endsWith(":step_ready")) step.ready += 1;
        if (row.type.endsWith(":complete")) {
          step.complete += 1;
          step.players.add(row.playerId);
        }
      }
    }

    if (row.type === "pack:open" || row.type === "client:pack:open") {
      incrementCount(packCounts, data.pack?.id || data.packId || "pacotinho");
    }

    if (row.type === "client:battle:start") incrementCount(battleCounts, `start:${data.mode || "battle"}`);
    if (row.type === "client:battle:result") incrementCount(battleCounts, `result:${data.winner || "unknown"}`);
    if (row.type === "ranked:start" || row.type === "tournament:start" || row.type === "ranked:resolve" || row.type === "tournament:resolve") {
      incrementCount(battleCounts, row.type);
    }
  });

  const totalProfiles = db().prepare("SELECT COUNT(*) AS count FROM profiles").get()?.count || 0;
  const totalSaves = db().prepare("SELECT COUNT(*) AS count FROM saves").get()?.count || 0;
  const tutorialSteps = [...tutorial.values()].map((step) => ({
    id: step.id,
    title: step.title,
    action: step.action,
    ready: step.ready,
    complete: step.complete,
    uniquePlayers: step.players.size
  }));
  const firstStepPlayers = tutorialSteps[0]?.uniquePlayers || tutorialSteps[0]?.complete || 0;
  const lastStepPlayers = tutorialSteps[tutorialSteps.length - 1]?.uniquePlayers || tutorialSteps[tutorialSteps.length - 1]?.complete || 0;
  const tabList = sortedCounts(tabCounts, 16).map((item) => ({
    tab: item.key,
    count: item.count,
    uniquePlayers: tabPlayers.get(item.key)?.size || 0
  }));

  return {
    generatedAt: new Date().toISOString(),
    window: { days: safeDays, since },
    overview: {
      events: rows.length,
      uniquePlayers: uniquePlayers.size,
      profilePlayers: profilePlayers.size,
      guestPlayers: guests,
      totalProfiles,
      totalSaves,
      tutorialCompletionRate: firstStepPlayers ? Math.round((lastStepPlayers / firstStepPlayers) * 100) : 0
    },
    tutorial: { steps: tutorialSteps },
    tabs: tabList,
    packs: sortedCounts(packCounts, 10).map((item) => ({ packId: item.key, count: item.count })),
    battles: sortedCounts(battleCounts, 12),
    eventTypes: sortedCounts(typeCounts, 20),
    daily: sortedCounts(dayCounts, safeDays).sort((a, b) => a.key.localeCompare(b.key)),
    players: sortedCounts(playerCounts, 12).map((item) => ({
      playerId: item.key,
      count: item.count,
      name: profilesById[item.key]?.name || "Visitante",
      profile: Boolean(profilesById[item.key])
    })),
    recentEvents: rows.slice(0, 40).map((row) => ({
      id: row.id,
      type: row.type,
      createdAt: row.createdAt,
      playerId: row.playerId,
      playerName: profilesById[row.playerId]?.name || "Visitante",
      data: shortEventData(row.data)
    }))
  };
}

function profilesByPlayerId(profiles) {
  return Object.fromEntries(Object.values(profiles.profiles).map((profile) => [profile.playerId, profile]));
}

function publicSocialProfile(profile) {
  if (!profile) return null;
  return {
    playerId: profile.playerId,
    name: safeText(profile.name, "Jogador", 24),
    key: safeText(profile.key || profileKey(profile.name), "", 32)
  };
}

function orderedFriendPair(playerId, friendPlayerId) {
  return String(playerId) < String(friendPlayerId)
    ? [playerId, friendPlayerId]
    : [friendPlayerId, playerId];
}

function areFriends(playerId, friendPlayerId) {
  if (!isValidPlayerId(playerId) || !isValidPlayerId(friendPlayerId) || playerId === friendPlayerId) return false;
  const [playerA, playerB] = orderedFriendPair(playerId, friendPlayerId);
  return Boolean(db().prepare("SELECT 1 FROM friends WHERE player_a = ? AND player_b = ?").get(playerA, playerB));
}

function socialTradeValue(ids = []) {
  return ids.reduce((sum, id) => {
    const monster = MONSTER_BY_ID[id];
    return sum + (TAZZO_TRADE_VALUES?.[monster?.rarity] || 0);
  }, 0);
}

function normalizeTradeMonsterIds(ids = []) {
  if (!Array.isArray(ids)) return [];
  const cleanIds = ids.map((id) => String(id || "")).filter((id) => MONSTER_BY_ID[id]);
  return cleanIds.filter((id, index) => cleanIds.indexOf(id) === index);
}

function validateSocialTradePayload(offeredIds = [], requestedIds = []) {
  const offered = normalizeTradeMonsterIds(offeredIds);
  const requested = normalizeTradeMonsterIds(requestedIds);
  if (!offered.length || !requested.length) {
    const error = new Error("Escolha pelo menos um tazzo de cada lado.");
    error.status = 400;
    throw error;
  }
  if (offered.length > 3 || requested.length > 3) {
    const error = new Error("Cada lado da troca pode ter no maximo 3 tazzos.");
    error.status = 400;
    throw error;
  }
  const offerValue = socialTradeValue(offered);
  const requestValue = socialTradeValue(requested);
  if (!offerValue || offerValue !== requestValue) {
    const error = new Error("Os valores da troca precisam ser iguais.");
    error.status = 400;
    throw error;
  }
  return { offered, requested, offerValue };
}

function hasTradeCopies(save, ids = []) {
  const needed = ids.reduce((map, id) => {
    map[id] = (map[id] || 0) + 1;
    return map;
  }, {});
  return Object.entries(needed).every(([id, count]) => (save.collection[id] || 0) >= count);
}

function applyTradeTransfer(save, loseIds = [], gainIds = []) {
  loseIds.forEach((id) => {
    save.collection[id] = Math.max(0, (save.collection[id] || 0) - 1);
  });
  gainIds.forEach((id) => {
    save.collection[id] = (save.collection[id] || 0) + 1;
  });
  return normalizeServerSave(save);
}

function saveFromTransaction(database, playerId) {
  const row = database.prepare("SELECT save_json FROM saves WHERE player_id = ?").get(playerId);
  return normalizeServerSave(jsonFromDb(row?.save_json, defaultServerSave()));
}

function writeSaveInTransaction(database, playerId, save) {
  const updatedAt = new Date().toISOString();
  const normalizedSave = normalizeServerSave(save);
  database.prepare(`
    INSERT OR REPLACE INTO saves (player_id, updated_at, save_json)
    VALUES (?, ?, ?)
  `).run(playerId, updatedAt, JSON.stringify(normalizedSave));
  return normalizedSave;
}

function publicSocialTrade(row, profilesById) {
  if (!row) return null;
  const offered = normalizeTradeMonsterIds(jsonFromDb(row.offered_json, []));
  const requested = normalizeTradeMonsterIds(jsonFromDb(row.requested_json, []));
  return {
    id: row.id,
    fromPlayerId: row.from_player_id,
    toPlayerId: row.to_player_id,
    from: publicSocialProfile(profilesById[row.from_player_id]),
    to: publicSocialProfile(profilesById[row.to_player_id]),
    offeredIds: offered,
    requestedIds: requested,
    value: socialTradeValue(offered),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || null
  };
}

function publicSocialCollection(save = {}) {
  return Object.entries(save.collection || {})
    .filter(([id, count]) => MONSTER_BY_ID[id] && (Number(count) || 0) > 0)
    .map(([monsterId, count]) => ({ monsterId, count: Math.max(0, Math.floor(Number(count) || 0)) }));
}

function normalizeTazzoClashCaptures(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, playerId]) => key && isValidPlayerId(playerId))
    .map(([key, playerId]) => [String(key), String(playerId)]));
}

function tazzoClashEntries(fromPlayerId, toPlayerId, offeredIds = [], requestedIds = [], captures = {}) {
  return [
    ...offeredIds.map((monsterId, index) => ({
      key: `from:${index}:${monsterId}`,
      side: "from",
      monsterId,
      ownerPlayerId: fromPlayerId,
      capturedByPlayerId: captures[`from:${index}:${monsterId}`] || null
    })),
    ...requestedIds.map((monsterId, index) => ({
      key: `to:${index}:${monsterId}`,
      side: "to",
      monsterId,
      ownerPlayerId: toPlayerId,
      capturedByPlayerId: captures[`to:${index}:${monsterId}`] || null
    }))
  ];
}

function tazzoClashScores(entries = []) {
  return entries.reduce((scores, entry) => {
    if (!entry.capturedByPlayerId) return scores;
    scores[entry.capturedByPlayerId] = (scores[entry.capturedByPlayerId] || 0) + socialTradeValue([entry.monsterId]);
    return scores;
  }, {});
}

function publicTazzoClash(row, profilesById) {
  if (!row) return null;
  const offered = normalizeTradeMonsterIds(jsonFromDb(row.offered_json, []));
  const requested = normalizeTradeMonsterIds(jsonFromDb(row.requested_json, []));
  const captures = normalizeTazzoClashCaptures(jsonFromDb(row.flipped_json, {}));
  const entries = tazzoClashEntries(row.from_player_id, row.to_player_id, offered, requested, captures);
  const scores = tazzoClashScores(entries);
  const fromScore = scores[row.from_player_id] || 0;
  const toScore = scores[row.to_player_id] || 0;
  const winnerPlayerId = row.status === "finished" && fromScore !== toScore
    ? fromScore > toScore ? row.from_player_id : row.to_player_id
    : null;
  return {
    id: row.id,
    fromPlayerId: row.from_player_id,
    toPlayerId: row.to_player_id,
    from: publicSocialProfile(profilesById[row.from_player_id]),
    to: publicSocialProfile(profilesById[row.to_player_id]),
    offeredIds: offered,
    requestedIds: requested,
    entries,
    value: socialTradeValue(offered),
    fromValue: socialTradeValue(offered),
    toValue: socialTradeValue(requested),
    valuesBalanced: Boolean(offered.length && requested.length && socialTradeValue(offered) === socialTradeValue(requested)),
    fromReady: offered.length > 0,
    toReady: requested.length > 0,
    status: row.status,
    currentTurnPlayerId: row.current_turn_player_id || null,
    startedByPlayerId: row.started_by_player_id || null,
    scores,
    winnerPlayerId,
    log: jsonFromDb(row.log_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || null
  };
}

async function socialPayloadForPlayer(playerId) {
  const profile = await requireProfileForPlayer(playerId);
  const record = await readOrCreateSave(playerId);
  const profiles = profilesByPlayerId(await readProfiles());
  const friendRows = db().prepare(`
    SELECT player_a, player_b, created_at
    FROM friends
    WHERE player_a = ? OR player_b = ?
    ORDER BY created_at DESC
  `).all(playerId, playerId);
  const friendIds = friendRows.map((row) => row.player_a === playerId ? row.player_b : row.player_a);
  const friendCollectionById = new Map();
  await Promise.all(friendIds.map(async (friendPlayerId) => {
    const friendRecord = await readOrCreateSave(friendPlayerId);
    friendCollectionById.set(friendPlayerId, publicSocialCollection(friendRecord.save));
  }));
  const friends = friendRows.map((row) => {
    const friendPlayerId = row.player_a === playerId ? row.player_b : row.player_a;
    return {
      ...publicSocialProfile(profiles[friendPlayerId]),
      createdAt: row.created_at,
      collection: friendCollectionById.get(friendPlayerId) || []
    };
  }).filter((friend) => friend?.playerId);

  const incomingInvites = db().prepare(`
    SELECT id, from_player_id, to_player_id, status, created_at, updated_at
    FROM friend_requests
    WHERE to_player_id = ? AND status = 'pending'
    ORDER BY created_at DESC
  `).all(playerId).map((row) => ({
    id: row.id,
    from: publicSocialProfile(profiles[row.from_player_id]),
    createdAt: row.created_at
  })).filter((invite) => invite.from);

  const outgoingInvites = db().prepare(`
    SELECT id, from_player_id, to_player_id, status, created_at, updated_at
    FROM friend_requests
    WHERE from_player_id = ? AND status = 'pending'
    ORDER BY created_at DESC
  `).all(playerId).map((row) => ({
    id: row.id,
    to: publicSocialProfile(profiles[row.to_player_id]),
    createdAt: row.created_at
  })).filter((invite) => invite.to);

  const messages = friendIds.length ? db().prepare(`
    SELECT id, from_player_id, to_player_id, created_at, message
    FROM friend_messages
    WHERE from_player_id = ? OR to_player_id = ?
    ORDER BY created_at DESC
    LIMIT 120
  `).all(playerId, playerId)
    .filter((row) => friendIds.includes(row.from_player_id === playerId ? row.to_player_id : row.from_player_id))
    .map((row) => ({
      id: row.id,
      friendPlayerId: row.from_player_id === playerId ? row.to_player_id : row.from_player_id,
      fromPlayerId: row.from_player_id,
      toPlayerId: row.to_player_id,
      fromYou: row.from_player_id === playerId,
      message: safeText(row.message, "", 500),
      createdAt: row.created_at
    }))
    .reverse() : [];

  const trades = db().prepare(`
    SELECT id, from_player_id, to_player_id, offered_json, requested_json, status, created_at, updated_at, resolved_at
    FROM social_trade_offers
    WHERE from_player_id = ? OR to_player_id = ?
    ORDER BY updated_at DESC
    LIMIT 50
  `).all(playerId, playerId).map((row) => publicSocialTrade(row, profiles)).filter(Boolean);

  const clashes = db().prepare(`
    SELECT id, from_player_id, to_player_id, offered_json, requested_json, status, current_turn_player_id, started_by_player_id, flipped_json, log_json, created_at, updated_at, resolved_at
    FROM tazzo_clash_duels
    WHERE from_player_id = ? OR to_player_id = ?
    ORDER BY updated_at DESC
    LIMIT 50
  `).all(playerId, playerId).map((row) => publicTazzoClash(row, profiles)).filter(Boolean);

  return {
    ok: true,
    playerId,
    profile: publicProfile(profile),
    socialProfile: publicSocialProfile(profile),
    save: record.save,
    friends,
    incomingInvites,
    outgoingInvites,
    messages,
    trades,
    clashes
  };
}

async function sendFriendInvite(playerId, targetName) {
  const profile = await requireProfileForPlayer(playerId);
  const targetKey = profileKey(targetName);
  if (!targetKey) {
    const error = new Error("Digite o nome do jogador.");
    error.status = 400;
    throw error;
  }
  const profiles = await readProfiles();
  const target = profiles.profiles[targetKey];
  if (!target) {
    const error = new Error("Jogador nao encontrado.");
    error.status = 404;
    throw error;
  }
  if (target.playerId === playerId) {
    const error = new Error("Voce ja esta na sua propria lista.");
    error.status = 400;
    throw error;
  }
  if (areFriends(playerId, target.playerId)) {
    const error = new Error("Esse jogador ja e seu amigo.");
    error.status = 409;
    throw error;
  }
  const reverse = db().prepare(`
    SELECT id FROM friend_requests
    WHERE from_player_id = ? AND to_player_id = ? AND status = 'pending'
  `).get(target.playerId, playerId);
  if (reverse) {
    return respondFriendInvite(playerId, reverse.id, true);
  }
  const existing = db().prepare(`
    SELECT id FROM friend_requests
    WHERE from_player_id = ? AND to_player_id = ? AND status = 'pending'
  `).get(playerId, target.playerId);
  if (existing) return socialPayloadForPlayer(playerId);

  const now = new Date().toISOString();
  db().prepare(`
    INSERT INTO friend_requests (id, from_player_id, to_player_id, status, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(crypto.randomUUID(), playerId, target.playerId, now, now);
  recordAccountEvent(playerId, "friend:invite", {
    to: publicSocialProfile(target)
  });
  recordAccountEvent(target.playerId, "friend:invite:received", {
    from: publicSocialProfile(profile)
  });
  return socialPayloadForPlayer(playerId);
}

async function respondFriendInvite(playerId, requestId, accept) {
  await requireProfileForPlayer(playerId);
  const row = db().prepare(`
    SELECT id, from_player_id, to_player_id, status
    FROM friend_requests
    WHERE id = ? AND to_player_id = ? AND status = 'pending'
  `).get(String(requestId || ""), playerId);
  if (!row) {
    const error = new Error("Convite nao encontrado.");
    error.status = 404;
    throw error;
  }
  const now = new Date().toISOString();
  runInTransaction((database) => {
    database.prepare("UPDATE friend_requests SET status = ?, updated_at = ? WHERE id = ?")
      .run(accept ? "accepted" : "declined", now, row.id);
    if (accept) {
      const [playerA, playerB] = orderedFriendPair(row.from_player_id, row.to_player_id);
      database.prepare("INSERT OR IGNORE INTO friends (player_a, player_b, created_at) VALUES (?, ?, ?)")
        .run(playerA, playerB, now);
    }
  });
  recordAccountEvent(playerId, accept ? "friend:accept" : "friend:decline", {
    friendPlayerId: row.from_player_id
  });
  return socialPayloadForPlayer(playerId);
}

async function sendFriendMessage(playerId, friendPlayerId, message) {
  const profile = await requireProfileForPlayer(playerId);
  const friendProfile = await profileForPlayer(friendPlayerId);
  if (!friendProfile || !areFriends(playerId, friendPlayerId)) {
    const error = new Error("Conversa disponivel apenas entre amigos.");
    error.status = 403;
    throw error;
  }
  const cleanMessage = safeText(String(message || "").replace(/\s+/g, " ").trim(), "", 500);
  if (!cleanMessage) {
    const error = new Error("Mensagem vazia.");
    error.status = 400;
    throw error;
  }
  db().prepare(`
    INSERT INTO friend_messages (id, from_player_id, to_player_id, created_at, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), playerId, friendPlayerId, new Date().toISOString(), cleanMessage);
  recordAccountEvent(playerId, "friend:message", {
    to: publicSocialProfile(friendProfile)
  });
  recordAccountEvent(friendPlayerId, "friend:message:received", {
    from: publicSocialProfile(profile)
  });
  return socialPayloadForPlayer(playerId);
}

async function createSocialTrade(playerId, friendPlayerId, offeredIds, requestedIds) {
  const profile = await requireProfileForPlayer(playerId);
  const friendProfile = await profileForPlayer(friendPlayerId);
  if (!friendProfile || !areFriends(playerId, friendPlayerId)) {
    const error = new Error("Trocas so podem ser feitas entre amigos.");
    error.status = 403;
    throw error;
  }
  const trade = validateSocialTradePayload(offeredIds, requestedIds);
  const playerSave = normalizeServerSave((await readOrCreateSave(playerId)).save);
  const friendSave = normalizeServerSave((await readOrCreateSave(friendPlayerId)).save);
  if (!hasTradeCopies(playerSave, trade.offered)) {
    const error = new Error("Voce nao tem todos os tazzos ofertados.");
    error.status = 400;
    error.save = playerSave;
    throw error;
  }
  if (!hasTradeCopies(friendSave, trade.requested)) {
    const error = new Error("Seu amigo nao tem todos os tazzos pedidos.");
    error.status = 400;
    error.save = playerSave;
    throw error;
  }
  const now = new Date().toISOString();
  db().prepare(`
    INSERT INTO social_trade_offers (id, from_player_id, to_player_id, offered_json, requested_json, status, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NULL)
  `).run(crypto.randomUUID(), playerId, friendPlayerId, JSON.stringify(trade.offered), JSON.stringify(trade.requested), now, now);
  recordAccountEvent(playerId, "trade:offer:create", {
    to: publicSocialProfile(friendProfile),
    value: trade.offerValue
  });
  recordAccountEvent(friendPlayerId, "trade:offer:received", {
    from: publicSocialProfile(profile),
    value: trade.offerValue
  });
  const payload = await socialPayloadForPlayer(playerId);
  broadcastSocialUpdateToPlayers([playerId, friendPlayerId]).catch(() => {});
  return payload;
}

async function respondSocialTrade(playerId, tradeId, accept) {
  await requireProfileForPlayer(playerId);
  let resultSave = null;
  const now = new Date().toISOString();
  const trade = runInTransaction((database) => {
    const row = database.prepare(`
      SELECT id, from_player_id, to_player_id, offered_json, requested_json, status
      FROM social_trade_offers
      WHERE id = ? AND status = 'pending'
    `).get(String(tradeId || ""));
    if (!row || row.to_player_id !== playerId) {
      const error = new Error("Proposta de troca nao encontrada.");
      error.status = 404;
      throw error;
    }
    if (!accept) {
      database.prepare("UPDATE social_trade_offers SET status = 'declined', updated_at = ?, resolved_at = ? WHERE id = ?")
        .run(now, now, row.id);
      resultSave = saveFromTransaction(database, playerId);
      return row;
    }
    const { offered, requested } = validateSocialTradePayload(jsonFromDb(row.offered_json, []), jsonFromDb(row.requested_json, []));
    const fromSave = saveFromTransaction(database, row.from_player_id);
    const toSave = saveFromTransaction(database, row.to_player_id);
    if (!hasTradeCopies(fromSave, offered) || !hasTradeCopies(toSave, requested)) {
      const error = new Error("Algum tazzo da proposta nao esta mais disponivel.");
      error.status = 409;
      error.save = toSave;
      throw error;
    }
    const nextFromSave = applyTradeTransfer(fromSave, offered, requested);
    const nextToSave = applyTradeTransfer(toSave, requested, offered);
    progressServerMission(nextFromSave, "trade", 1);
    progressServerMission(nextToSave, "trade", 1);
    writeSaveInTransaction(database, row.from_player_id, nextFromSave);
    resultSave = writeSaveInTransaction(database, row.to_player_id, nextToSave);
    database.prepare("UPDATE social_trade_offers SET status = 'accepted', updated_at = ?, resolved_at = ? WHERE id = ?")
      .run(now, now, row.id);
    return row;
  });
  recordAccountEvent(playerId, accept ? "trade:offer:accept" : "trade:offer:decline", {
    tradeId: trade.id,
    friendPlayerId: trade.from_player_id
  });
  if (accept) {
    recordAccountEvent(trade.from_player_id, "trade:offer:accepted", {
      tradeId: trade.id,
      friendPlayerId: playerId
    });
  }
  const payload = await socialPayloadForPlayer(playerId);
  broadcastSocialUpdateToPlayers([playerId, trade.from_player_id]).catch(() => {});
  return { ...payload, save: resultSave || payload.save };
}

function tazzoClashLog(message, data = {}) {
  return {
    at: new Date().toISOString(),
    message: safeText(message, "", 180),
    ...data
  };
}

function validateTazzoClashPayload(offeredIds = [], requestedIds = []) {
  try {
    return validateSocialTradePayload(offeredIds, requestedIds);
  } catch (error) {
    if (error.message) error.message = error.message.replace(/troca/g, "duelo");
    throw error;
  }
}

function validateTazzoClashSide(monsterIds = []) {
  const ids = normalizeTradeMonsterIds(monsterIds);
  if (!ids.length) {
    const error = new Error("Escolha pelo menos um tazzo para bater.");
    error.status = 400;
    throw error;
  }
  if (ids.length > 3) {
    const error = new Error("Voce pode colocar no maximo 3 tazzos na mesa.");
    error.status = 400;
    throw error;
  }
  const value = socialTradeValue(ids);
  if (!value) {
    const error = new Error("Escolha tazzos com valor valido.");
    error.status = 400;
    throw error;
  }
  return { ids, value };
}

function applyTazzoClashTransfers(fromSave, toSave, entries, fromPlayerId, toPlayerId) {
  const savesByPlayerId = {
    [fromPlayerId]: fromSave,
    [toPlayerId]: toSave
  };
  entries.forEach((entry) => {
    const capturedBy = entry.capturedByPlayerId;
    if (!capturedBy || capturedBy === entry.ownerPlayerId) return;
    const ownerSave = savesByPlayerId[entry.ownerPlayerId];
    const capturerSave = savesByPlayerId[capturedBy];
    if (!ownerSave || !capturerSave || !MONSTER_BY_ID[entry.monsterId]) return;
    ownerSave.collection[entry.monsterId] = Math.max(0, (ownerSave.collection[entry.monsterId] || 0) - 1);
    capturerSave.collection[entry.monsterId] = (capturerSave.collection[entry.monsterId] || 0) + 1;
  });
  return {
    fromSave: normalizeServerSave(fromSave),
    toSave: normalizeServerSave(toSave)
  };
}

async function createTazzoClash(playerId, friendPlayerId) {
  const profile = await requireProfileForPlayer(playerId);
  const friendProfile = await profileForPlayer(friendPlayerId);
  if (!friendProfile || !areFriends(playerId, friendPlayerId)) {
    const error = new Error("Bater tazzos so pode ser combinado entre amigos.");
    error.status = 403;
    throw error;
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const log = [
    tazzoClashLog(`${safeText(profile.name, "Jogador", 24)} convidou ${safeText(friendProfile.name, "amigo", 24)} para bater tazzos.`)
  ];
  db().prepare(`
    INSERT INTO tazzo_clash_duels (id, from_player_id, to_player_id, offered_json, requested_json, status, current_turn_player_id, started_by_player_id, flipped_json, log_json, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?, ?, ?, NULL)
  `).run(id, playerId, friendPlayerId, JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), JSON.stringify(log), now, now);
  recordAccountEvent(playerId, "tazzo-clash:create", {
    to: publicSocialProfile(friendProfile)
  });
  recordAccountEvent(friendPlayerId, "tazzo-clash:received", {
    from: publicSocialProfile(profile)
  });
  const payload = await socialPayloadForPlayer(playerId);
  broadcastSocialUpdateToPlayers([playerId, friendPlayerId]).catch(() => {});
  return payload;
}

async function respondTazzoClash(playerId, duelId, accept) {
  await requireProfileForPlayer(playerId);
  let resultSave = null;
  let opponentPlayerId = null;
  const now = new Date().toISOString();
  const duel = runInTransaction((database) => {
    const row = database.prepare(`
      SELECT id, from_player_id, to_player_id, status, log_json
      FROM tazzo_clash_duels
      WHERE id = ? AND status = 'pending'
    `).get(String(duelId || ""));
    if (!row || row.to_player_id !== playerId) {
      const error = new Error("Convite de bater tazzos nao encontrado.");
      error.status = 404;
      throw error;
    }
    opponentPlayerId = row.from_player_id;
    const log = jsonFromDb(row.log_json, []);
    if (!accept) {
      log.push(tazzoClashLog("Convite recusado."));
      database.prepare("UPDATE tazzo_clash_duels SET status = 'declined', log_json = ?, updated_at = ?, resolved_at = ? WHERE id = ?")
        .run(JSON.stringify(log), now, now, row.id);
      resultSave = saveFromTransaction(database, playerId);
      return row;
    }
    log.push(tazzoClashLog("Convite aceito. Agora cada jogador escolhe ate 3 tazzos para colocar na mesa."));
    database.prepare(`
      UPDATE tazzo_clash_duels
      SET status = 'selecting', offered_json = ?, requested_json = ?, current_turn_player_id = NULL, started_by_player_id = NULL, flipped_json = ?, log_json = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), JSON.stringify(log), now, row.id);
    resultSave = saveFromTransaction(database, playerId);
    return row;
  });
  recordAccountEvent(playerId, accept ? "tazzo-clash:accept" : "tazzo-clash:decline", {
    duelId: duel.id,
    friendPlayerId: opponentPlayerId
  });
  if (accept) {
    recordAccountEvent(opponentPlayerId, "tazzo-clash:accepted", {
      duelId: duel.id,
      friendPlayerId: playerId
    });
  }
  const payload = await socialPayloadForPlayer(playerId);
  broadcastSocialUpdateToPlayers([playerId, opponentPlayerId]).catch(() => {});
  return { ...payload, save: resultSave || payload.save };
}

async function pickTazzoClash(playerId, duelId, monsterIds) {
  await requireProfileForPlayer(playerId);
  let resultSave = null;
  let otherPlayerId = null;
  let clashResult = null;
  const now = new Date().toISOString();
  const duel = runInTransaction((database) => {
    const row = database.prepare(`
      SELECT id, from_player_id, to_player_id, offered_json, requested_json, status, log_json
      FROM tazzo_clash_duels
      WHERE id = ?
    `).get(String(duelId || ""));
    if (!row || row.status !== "selecting") {
      const error = new Error("Este duelo ainda nao esta na etapa de escolher tazzos.");
      error.status = 404;
      throw error;
    }
    if (row.from_player_id !== playerId && row.to_player_id !== playerId) {
      const error = new Error("Voce nao participa deste duelo.");
      error.status = 403;
      throw error;
    }
    const side = row.from_player_id === playerId ? "from" : "to";
    otherPlayerId = side === "from" ? row.to_player_id : row.from_player_id;
    const pick = validateTazzoClashSide(monsterIds);
    const playerSave = saveFromTransaction(database, playerId);
    if (!hasTradeCopies(playerSave, pick.ids)) {
      const error = new Error("Voce nao tem todos os tazzos escolhidos.");
      error.status = 400;
      error.save = playerSave;
      throw error;
    }

    let offered = normalizeTradeMonsterIds(jsonFromDb(row.offered_json, []));
    let requested = normalizeTradeMonsterIds(jsonFromDb(row.requested_json, []));
    if (side === "from") offered = pick.ids;
    else requested = pick.ids;

    const offerValue = socialTradeValue(offered);
    const requestValue = socialTradeValue(requested);
    const log = jsonFromDb(row.log_json, []);
    log.push(tazzoClashLog(`${side === "from" ? "Jogador 1" : "Jogador 2"} confirmou ${pick.ids.length} tazzo(s) para a mesa.`, {
      playerId,
      value: pick.value
    }));

    let nextStatus = "selecting";
    let currentTurnPlayerId = null;
    let startedByPlayerId = null;
    if (offered.length && requested.length && offerValue === requestValue) {
      const fromSave = saveFromTransaction(database, row.from_player_id);
      const toSave = side === "to" ? playerSave : saveFromTransaction(database, row.to_player_id);
      if (!hasTradeCopies(fromSave, offered) || !hasTradeCopies(toSave, requested)) {
        const error = new Error("Algum tazzo escolhido nao esta mais disponivel.");
        error.status = 409;
        error.save = playerSave;
        throw error;
      }
      const starter = Math.random() < 0.5 ? row.from_player_id : row.to_player_id;
      nextStatus = "active";
      currentTurnPlayerId = starter;
      startedByPlayerId = starter;
      log.push(tazzoClashLog("Valores iguais. Cara ou coroa decidiu quem bate primeiro.", {
        starterPlayerId: starter,
        value: offerValue
      }));
    }

    database.prepare(`
      UPDATE tazzo_clash_duels
      SET offered_json = ?, requested_json = ?, status = ?, current_turn_player_id = ?, started_by_player_id = ?, flipped_json = ?, log_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(offered),
      JSON.stringify(requested),
      nextStatus,
      currentTurnPlayerId,
      startedByPlayerId,
      JSON.stringify({}),
      JSON.stringify(log.slice(-60)),
      now,
      row.id
    );

    resultSave = playerSave;
    clashResult = {
      duelId: row.id,
      status: nextStatus,
      value: offerValue === requestValue ? offerValue : 0,
      offerValue,
      requestValue,
      startedByPlayerId
    };
    return row;
  });

  recordAccountEvent(playerId, "tazzo-clash:pick", {
    duelId: duel.id,
    status: clashResult?.status,
    value: clashResult?.value || 0
  });
  if (clashResult?.status === "active") {
    recordAccountEvent(otherPlayerId, "tazzo-clash:started", {
      duelId: duel.id,
      friendPlayerId: playerId
    });
  }
  const payload = await socialPayloadForPlayer(playerId);
  broadcastSocialUpdateToPlayers([playerId, otherPlayerId]).catch(() => {});
  return { ...payload, save: resultSave || payload.save, clashResult };
}

async function hitTazzoClash(playerId, duelId, timingScore) {
  await requireProfileForPlayer(playerId);
  let resultSave = null;
  let otherPlayerId = null;
  let clashResult = null;
  const now = new Date().toISOString();
  const duel = runInTransaction((database) => {
    const row = database.prepare(`
      SELECT id, from_player_id, to_player_id, offered_json, requested_json, status, current_turn_player_id, flipped_json, log_json
      FROM tazzo_clash_duels
      WHERE id = ?
    `).get(String(duelId || ""));
    if (!row || row.status !== "active") {
      const error = new Error("Duelo de tazzos nao esta ativo.");
      error.status = 404;
      throw error;
    }
    if (row.current_turn_player_id !== playerId) {
      const error = new Error("Ainda nao e sua vez de bater.");
      error.status = 409;
      throw error;
    }
    otherPlayerId = row.from_player_id === playerId ? row.to_player_id : row.from_player_id;
    const { offered, requested } = validateTazzoClashPayload(jsonFromDb(row.offered_json, []), jsonFromDb(row.requested_json, []));
    const captures = normalizeTazzoClashCaptures(jsonFromDb(row.flipped_json, {}));
    const entriesBefore = tazzoClashEntries(row.from_player_id, row.to_player_id, offered, requested, captures);
    const unflipped = entriesBefore.filter((entry) => !entry.capturedByPlayerId);
    if (!unflipped.length) {
      const error = new Error("Todos os tazzos ja foram virados.");
      error.status = 409;
      throw error;
    }

    const score = Math.max(0, Math.min(1, Number(timingScore) || 0));
    const perfect = score >= TAZZO_CLASH_PERFECT_SCORE;
    const chance = perfect ? TAZZO_CLASH_PERFECT_CHANCE : TAZZO_CLASH_BASE_CHANCE;
    const flippedKeys = [];
    unflipped.forEach((entry) => {
      if (Math.random() <= chance) {
        captures[entry.key] = playerId;
        flippedKeys.push(entry.key);
      }
    });

    const entriesAfter = tazzoClashEntries(row.from_player_id, row.to_player_id, offered, requested, captures);
    const remaining = entriesAfter.filter((entry) => !entry.capturedByPlayerId).length;
    const log = jsonFromDb(row.log_json, []);
    log.push(tazzoClashLog(flippedKeys.length
      ? `${flippedKeys.length} tazzo(s) viraram na batida${perfect ? " perfeita" : ""}.`
      : `Nenhum tazzo virou${perfect ? ", mesmo com timing perfeito" : ""}.`, {
      playerId,
      flippedKeys,
      perfect,
      timingScore: score
    }));

    let nextStatus = "active";
    let nextTurnPlayerId = otherPlayerId;
    let resolvedAt = null;
    if (!remaining) {
      const fromSave = saveFromTransaction(database, row.from_player_id);
      const toSave = saveFromTransaction(database, row.to_player_id);
      if (!hasTradeCopies(fromSave, offered) || !hasTradeCopies(toSave, requested)) {
        nextStatus = "cancelled";
        nextTurnPlayerId = null;
        resolvedAt = now;
        resultSave = row.from_player_id === playerId ? fromSave : toSave;
        log.push(tazzoClashLog("Duelo cancelado porque algum tazzo apostado nao estava mais disponivel."));
      } else {
        const transferred = applyTazzoClashTransfers(fromSave, toSave, entriesAfter, row.from_player_id, row.to_player_id);
        progressServerMission(transferred.fromSave, "trade", 1);
        progressServerMission(transferred.toSave, "trade", 1);
        writeSaveInTransaction(database, row.from_player_id, transferred.fromSave);
        writeSaveInTransaction(database, row.to_player_id, transferred.toSave);
        resultSave = row.from_player_id === playerId ? transferred.fromSave : transferred.toSave;
        nextStatus = "finished";
        nextTurnPlayerId = null;
        resolvedAt = now;
        log.push(tazzoClashLog("Todos os tazzos viraram. As colecoes foram atualizadas."));
      }
    }

    database.prepare(`
      UPDATE tazzo_clash_duels
      SET status = ?, current_turn_player_id = ?, flipped_json = ?, log_json = ?, updated_at = ?, resolved_at = ?
      WHERE id = ?
    `).run(nextStatus, nextTurnPlayerId, JSON.stringify(captures), JSON.stringify(log.slice(-60)), now, resolvedAt, row.id);

    clashResult = {
      duelId: row.id,
      flippedKeys,
      perfect,
      timingScore: score,
      chance,
      status: nextStatus
    };
    return row;
  });

  recordAccountEvent(playerId, "tazzo-clash:hit", {
    duelId: duel.id,
    flipped: clashResult?.flippedKeys?.length || 0,
    perfect: Boolean(clashResult?.perfect)
  });
  if (clashResult?.status === "finished") {
    recordAccountEvent(otherPlayerId, "tazzo-clash:finished", {
      duelId: duel.id,
      friendPlayerId: playerId
    });
  }
  const payload = await socialPayloadForPlayer(playerId);
  broadcastSocialUpdateToPlayers([playerId, otherPlayerId]).catch(() => {});
  return { ...payload, save: resultSave || payload.save, clashResult };
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
  const cosmetics = sanitizeServerEquippedCosmetics(normalized.equippedCosmetics, normalized.cosmetics, normalized.selectedCosmetic);
  return { team, goalkeeper, positions, upgrades, cosmetics };
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
    playerCosmetics: viewerLoadout.cosmetics || {},
    enemyTeam: opponentLoadout.team,
    enemyGoalkeeper: opponentLoadout.goalkeeper,
    enemyPositions: mirrorPositions(opponentLoadout.positions),
    enemyCosmetics: opponentLoadout.cosmetics || {},
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
  const cosmeticsForSlot = (slot) => {
    const participant = onlineMatchEntryForSlot(lobby, slot);
    return participant?.loadout?.cosmetics || {};
  };
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
      startingX: publicCellForSlot({ x: onlineStartingX(piece), y: onlineStartingY(piece) }, viewerSlot).x,
      startingY: onlineStartingY(piece),
      hp: piece.hp,
      maxHp: piece.maxHp,
      shot: piece.shot,
      dribble: piece.dribble,
      speed: piece.speed,
      acted: Boolean(piece.acted),
      cosmetics: piece.cosmetics || cosmeticsForSlot(piece.slot)
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
    extraTurnId: effects.extraTurnId || null,
    attackerFieldBonus: Boolean(effects.attackerFieldBonus)
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
      startingX: pos.x,
      startingY: pos.y,
      hp: stats.vitality,
      maxHp: stats.vitality,
      shot: stats.shot,
      dribble: stats.dribble,
      speed: stats.speed,
      acted: false,
      cosmetics: loadout.cosmetics || {}
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

function onlineStartingX(piece) {
  return Number.isFinite(Number(piece?.startingX)) ? Number(piece.startingX) : Number(piece?.x) || 0;
}

function onlineStartingY(piece) {
  return Number.isFinite(Number(piece?.startingY)) ? Number(piece.startingY) : Number(piece?.y) || 0;
}

function onlinePieceAtExcept(battleState, x, y, exceptId = "") {
  return battleState.pieces.find((piece) => piece.hp > 0 && piece.id !== exceptId && piece.x === x && piece.y === y);
}

function onlineOpenCellNear(battleState, x, y, movingPiece = null) {
  const base = {
    x: Math.max(0, Math.min(6, Math.round(Number(x) || 0))),
    y: Math.max(0, Math.min(4, Math.round(Number(y) || 0)))
  };
  const candidates = [
    base,
    ...[-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => ({ x: base.x + dx, y: base.y + dy })))
      .filter((cell) => cell.x !== base.x || cell.y !== base.y)
      .sort((a, b) => onlineDistance(a, base) - onlineDistance(b, base) || a.y - b.y || a.x - b.x)
  ];
  return candidates.find((cell) => (
    onlineInsideArena(cell.x, cell.y)
    && !onlinePieceAtExcept(battleState, cell.x, cell.y, movingPiece?.id || "")
  )) || { x: movingPiece?.x ?? base.x, y: movingPiece?.y ?? base.y };
}

function onlineDefeatedPieces(battleState, slot) {
  return battleState.pieces.filter((piece) => piece.slot === slot && piece.hp <= 0);
}

function onlineReviveRandomDefeatedPiece(battleState, slot) {
  const defeated = onlineDefeatedPieces(battleState, slot);
  if (!defeated.length) return null;
  const piece = defeated[Math.floor(Math.random() * defeated.length)];
  const cell = onlineOpenCellNear(battleState, onlineStartingX(piece), onlineStartingY(piece), piece);
  piece.x = cell.x;
  piece.y = cell.y;
  piece.hp = piece.maxHp;
  return piece;
}

function onlineResetEnemyPiecesToStart(battleState, slot) {
  let moved = 0;
  battleState.pieces
    .filter((piece) => piece.slot !== slot && piece.hp > 0)
    .forEach((piece) => {
      const cell = onlineOpenCellNear(battleState, onlineStartingX(piece), onlineStartingY(piece), piece);
      if (piece.x !== cell.x || piece.y !== cell.y) moved += 1;
      piece.x = cell.x;
      piece.y = cell.y;
    });
  return moved;
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
  const positionalAttack = onlinePositionalMultiplier(battleState, attacker, true);
  const positionalDefense = onlinePositionalMultiplier(battleState, defender, false);
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
      const damage = onlineIncomingDamageAfterPosition(battleState, target, Math.round(force * 0.5));
      onlineApplyDamage(battleState, target, damage, attacker.slot, { precalculated: true });
      onlineLog(battleState, `${MONSTER_BY_ID[target.monsterId].name} bateu na borda: ${damage} dano extra.`);
      result.out = true;
      break;
    }
    const blocker = onlinePieceAt(battleState, next.x, next.y);
    if (blocker) {
      const baseDamage = Math.round(force * 0.25);
      const targetDamage = onlineIncomingDamageAfterPosition(battleState, target, baseDamage);
      const blockerDamage = onlineIncomingDamageAfterPosition(battleState, blocker, baseDamage);
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
  const finalDamage = options.precalculated ? damage : onlineIncomingDamageAfterPosition(battleState, piece, damage);
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
  return Boolean(
    state
    && keeper
    && monster?.keeperAbility
    && !keeper.used
    && active?.slot === slot
    && active.hp > 0
    && onlineKeeperAbilityCanResolve(state, slot, monster.keeperAbility)
  );
}

function onlineKeeperAbilityCanResolve(state, slot, ability) {
  if (ability === "attackerFieldBonus") {
    return !state.effects[slot]?.attackerFieldBonus
      && state.pieces.some((ally) => ally.slot === slot && ally.hp > 0 && MONSTER_BY_ID[ally.monsterId]?.types?.includes("Atacante"));
  }
  if (ability === "reviveRandom") return onlineDefeatedPieces(state, slot).length > 0;
  if (ability === "resetEnemies") {
    return state.pieces.some((piece) => (
      piece.slot !== slot
      && piece.hp > 0
      && (piece.x !== onlineStartingX(piece) || piece.y !== onlineStartingY(piece))
    ));
  }
  return true;
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

  if (monster.keeperAbility === "attackerFieldBonus") {
    state.effects[slot].attackerFieldBonus = true;
    const message = `${monster.name} abriu o campo: atacantes contam como em zona ideal ate o fim da partida.`;
    onlineLog(state, message);
    return { keepTurn: true, message };
  }

  if (monster.keeperAbility === "reviveRandom") {
    const revived = onlineReviveRandomDefeatedPiece(state, slot);
    if (!revived) return { keepTurn: true, message: `${monster.name} tentou chamar reforco, mas nao havia aliado derrotado.` };
    const message = `${monster.name} chamou reforco: ${MONSTER_BY_ID[revived.monsterId].name} voltou para a arena.`;
    onlineLog(state, message);
    return { keepTurn: true, message };
  }

  if (monster.keeperAbility === "resetEnemies") {
    const moved = onlineResetEnemyPiecesToStart(state, slot);
    const message = `${monster.name} reorganizou o rival: ${moved} jogador(es) voltaram para a formacao inicial.`;
    onlineLog(state, message);
    return { keepTurn: false, message };
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

function onlinePositionalMultiplier(battleState, piece, attacking) {
  if (!onlineHasPositionalRoleBonus(battleState, piece)) return 1;
  return attacking ? 1.1 : 0.9;
}

function onlineHasPositionalRoleBonus(battleState, piece) {
  const monster = MONSTER_BY_ID[piece.monsterId];
  if (!monster) return false;
  const effects = battleState?.effects?.[piece.slot] || {};
  if (effects.attackerFieldBonus && monster.types.includes("Atacante")) return true;
  const bonus = onlinePositionalBonusType(piece);
  return Boolean(bonus && monster.types.includes(bonus));
}

function onlineIncomingDamageAfterPosition(battleState, piece, damage) {
  return Math.max(1, Math.round(damage * onlinePositionalMultiplier(battleState, piece, false)));
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

async function sendSocialUpdateToClient(client) {
  sendWebSocketJson(client, {
    type: "social:update",
    ...(await socialPayloadForPlayer(client.playerId))
  });
}

async function broadcastSocialUpdateToPlayers(playerIds = []) {
  if (!wsClients.size) return;
  const targets = new Set(playerIds.filter((playerId) => isValidPlayerId(playerId)));
  if (!targets.size) return;
  await Promise.all([...wsClients]
    .filter((client) => targets.has(client.playerId))
    .map(async (client) => {
      try {
        await sendSocialUpdateToClient(client);
      } catch (error) {
        closeWebSocketClient(client);
      }
    }));
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
  const session = decodePlayerSession(cookies[PLAYER_COOKIE]);
  const playerId = session?.playerId || "";
  if (!key || !isValidPlayerId(playerId) || !hasAllowedRequestOrigin(req, { useRefererFallback: false })) {
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

function parseRequestPayload(req, body) {
  if (!body) return {};
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(body));
  }
  return JSON.parse(body);
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

async function guestMigrationSaveForPlayer(currentPlayerId) {
  if (!isValidPlayerId(currentPlayerId)) {
    return { save: defaultServerSave(), migratedGuestSave: false };
  }
  const currentProfile = await profileForPlayer(currentPlayerId);
  if (currentProfile) {
    return { save: defaultServerSave(), migratedGuestSave: false };
  }
  const currentRecord = await readSave(currentPlayerId);
  const save = normalizeServerSave(currentRecord?.save || defaultServerSave());
  return {
    save,
    migratedGuestSave: Boolean(currentRecord && hasServerEconomyProgress(save))
  };
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

  const migration = await guestMigrationSaveForPlayer(currentPlayerId);
  const profileSave = migration.save;
  const migratedGuestSave = migration.migratedGuestSave;
  await writeSave(playerId, profileSave);
  recordAccountEvent(playerId, "account:create", {
    method: "pin",
    migratedGuestSave
  });
  return { profile, save: profileSave, migratedGuestSave };
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
  recordAccountEvent(profile.playerId, "account:login", { method: "pin" });
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
  assertFirebaseProviderAllowed(authData);
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
    recordAccountEvent(profile.playerId, "account:login", {
      method: "firebase",
      provider: authData.provider,
      emailVerified: authData.emailVerified,
      migratedGuestSave
    });
    return { profile, save, migratedGuestSave };
  }

  if (authData.email && !authData.emailVerified) {
    const error = new Error("Use uma conta com email verificado para criar jogador novo.");
    error.status = 403;
    throw error;
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

  const migration = await guestMigrationSaveForPlayer(currentPlayerId);
  const save = migration.save;
  const migratedGuestSave = migration.migratedGuestSave;
  if (migratedGuestSave) save.migratedFromLocalAt = now;
  await writeSave(playerId, save);
  recordAccountEvent(playerId, "account:create", {
    method: "firebase",
    provider: authData.provider,
    emailVerified: authData.emailVerified,
    migratedGuestSave
  });
  return { profile, save, migratedGuestSave };
}

function defaultServerSave() {
  return {
    createdAt: Date.now(),
    merreis: 1250,
    fragments: 0,
    collection: {},
    team: [],
    goalkeeper: "",
    starterOnboardingComplete: false,
    starterPackOpenedAt: null,
    starterPackCards: [],
    customTazzos: [],
    upgrades: {},
    packPity: { sinceLegendaryPlus: 0 },
    trophies: 0,
    rankFloor: 0,
    competitiveWinStreak: 0,
    rankedWins: 0,
    rankedLosses: 0,
    tournamentWins: 0,
    onlineTrophies: 0,
    onlineWins: 0,
    onlineLosses: 0,
    onlineDraws: 0,
    activeCompetitive: null,
    cosmetics: {},
    equippedCosmetics: {},
    selectedCosmetic: null,
    oneTimePurchases: {},
    friendGifts: {},
    shareValidations: {},
    shareRewards: {},
    wishlist: {},
    musicTrackIndex: 0,
    musicVolume: 0.55,
    migratedFromLocalAt: null,
    tutorial: Object.fromEntries(TUTORIAL_STEPS.map((step) => [step.id, false])),
    tutorialRewardClaimed: false,
    missionDate: new Date().toISOString().slice(0, 10),
    missionCycles: currentMissionCycles(),
    dailyEconomy: defaultDailyEconomyRewards(),
    missions: defaultMissionStatuses()
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

function sanitizeServerWishlist(wishlist = {}, catalog = serverCatalogForSave()) {
  if (!wishlist || typeof wishlist !== "object" || Array.isArray(wishlist)) return {};
  return Object.fromEntries(
    Object.entries(wishlist)
      .filter(([id, wanted]) => catalog.has(id) && Boolean(wanted))
      .map(([id]) => [id, true])
  );
}

function hasLegacyStarterProgress(save = {}) {
  const collection = save.collection && typeof save.collection === "object" ? save.collection : {};
  return Object.values(collection).some((count) => Number(count) > 0)
    || Math.max(0, Number(save.fragments) || 0) > 0
    || Math.max(0, Number(save.trophies) || 0) > 0
    || Math.max(0, Number(save.rankedWins) || 0) > 0
    || Math.max(0, Number(save.tournamentWins) || 0) > 0
    || Math.max(0, Number(save.onlineWins) || 0) > 0;
}

function shopItemById(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId) || null;
}

function cosmeticSlotForItem(itemOrId) {
  const item = typeof itemOrId === "object" ? itemOrId : shopItemById(itemOrId);
  return item?.cosmeticSlot || "profile";
}

function sanitizeServerEquippedCosmetics(equipped = {}, cosmetics = {}, legacySelected = null) {
  const next = {};
  const source = equipped && typeof equipped === "object" && !Array.isArray(equipped) ? equipped : {};
  Object.entries(source).forEach(([slot, itemId]) => {
    const item = shopItemById(String(itemId || ""));
    if (item && item.type !== "merreis" && cosmeticSlotForItem(item) === slot && cosmetics?.[item.id]) {
      next[slot] = item.id;
    }
  });

  const legacyItem = shopItemById(String(legacySelected || ""));
  if (legacyItem && legacyItem.type !== "merreis" && cosmetics?.[legacyItem.id]) {
    const slot = cosmeticSlotForItem(legacyItem);
    if (!next[slot]) next[slot] = legacyItem.id;
  }
  return next;
}

function sanitizeServerShareRewards(rewards = {}) {
  if (!rewards || typeof rewards !== "object" || Array.isArray(rewards)) return {};
  const validIds = new Set(SOCIAL_SHARE_REWARDS.map((item) => item.id));
  return Object.fromEntries(
    Object.entries(rewards)
      .map(([id, claimedAt]) => {
        const value = claimedAt && typeof claimedAt === "object" && !Array.isArray(claimedAt)
          ? claimedAt.claimedAt || claimedAt.validatedAt || claimedAt.createdAt
          : claimedAt;
        return [id, value];
      })
      .filter(([id, claimedAt]) => validIds.has(id) && claimedAt)
      .map(([id, claimedAt]) => [id, safeText(claimedAt, "", 64) || new Date().toISOString()])
  );
}

function sanitizeServerShareValidations(validations = {}) {
  if (!validations || typeof validations !== "object" || Array.isArray(validations)) return {};
  const validIds = new Set(SOCIAL_SHARE_REWARDS.map((item) => item.id));
  return Object.fromEntries(
    Object.entries(validations).map(([id, raw]) => {
      const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      return [id, {
        requestedAt: safeText(record.requestedAt, "", 64),
        validatedAt: safeText(record.validatedAt, "", 64),
        visitorPlayerId: safeText(record.visitorPlayerId, "", 64)
      }];
    }).filter(([id, record]) => (
      validIds.has(id)
      && (record.requestedAt || record.validatedAt || record.visitorPlayerId)
    ))
  );
}

function sanitizeServerOneTimePurchases(purchases = {}) {
  if (!purchases || typeof purchases !== "object" || Array.isArray(purchases)) return {};
  const validIds = new Set(SHOP_ITEMS.filter((item) => item.oneTime).map((item) => item.id));
  return Object.fromEntries(
    Object.entries(purchases)
      .map(([id, purchasedAt]) => [id, safeText(purchasedAt, "", 64)])
      .filter(([id, purchasedAt]) => validIds.has(id) && purchasedAt)
  );
}

function equipServerCosmetic(save, itemId) {
  const item = shopItemById(itemId);
  if (!item || item.type === "merreis" || !save.cosmetics?.[item.id]) return false;
  const equipped = sanitizeServerEquippedCosmetics(save.equippedCosmetics, save.cosmetics, save.selectedCosmetic);
  equipped[cosmeticSlotForItem(item)] = item.id;
  save.equippedCosmetics = equipped;
  save.selectedCosmetic = item.id;
  return true;
}

function normalizeServerSave(rawSave = {}) {
  const fresh = defaultServerSave();
  const save = rawSave && typeof rawSave === "object" ? rawSave : {};
  const customTazzos = sanitizeServerCustomCatalog(save.customTazzos || []);
  const catalog = serverCatalogForSave({ ...save, customTazzos });
  const musicVolume = Number(save.musicVolume ?? fresh.musicVolume);
  const migratedFromLocalAt = safeText(save.migratedFromLocalAt, "", 64) || null;
  const collection = {};
  Object.entries(save.collection || {}).forEach(([id, count]) => {
    if (catalog.has(id)) collection[id] = Math.max(0, Math.floor(Number(count)) || 0);
  });
  const starterOnboardingComplete = Boolean(save.starterOnboardingComplete)
    || (!Object.prototype.hasOwnProperty.call(save, "starterOnboardingComplete") && hasLegacyStarterProgress(save));
  const savedMissionCycles = normalizeMissionCycles(save.missionCycles || {}, save.missionDate);
  const missions = Object.fromEntries(MISSIONS.map((mission) => [
    mission.id,
    sanitizeMissionStatus({
      ...fresh.missions[mission.id],
      ...((save.missions || {})[mission.id] || {})
    }, mission)
  ]));
  const savedTutorial = save.tutorial && typeof save.tutorial === "object" && !Array.isArray(save.tutorial) ? save.tutorial : {};
  const tutorial = Object.fromEntries(TUTORIAL_STEPS.map((step) => [
    step.id,
    Boolean(savedTutorial[step.id] || fresh.tutorial[step.id] || (save.tutorialRewardClaimed && !Object.prototype.hasOwnProperty.call(savedTutorial, step.id)))
  ]));
  const cosmetics = save.cosmetics && typeof save.cosmetics === "object" ? save.cosmetics : fresh.cosmetics;
  const equippedCosmetics = sanitizeServerEquippedCosmetics(save.equippedCosmetics || fresh.equippedCosmetics, cosmetics, save.selectedCosmetic);

  const normalized = {
    ...fresh,
    ...save,
    merreis: Math.max(0, Math.floor(Number(save.merreis ?? fresh.merreis)) || 0),
    fragments: Math.max(0, Math.floor(Number(save.fragments ?? fresh.fragments)) || 0),
    trophies: Math.max(0, Math.floor(Number(save.trophies ?? fresh.trophies)) || 0),
    rankFloor: Math.max(0, Math.floor(Number(save.rankFloor ?? fresh.rankFloor)) || 0),
    competitiveWinStreak: Math.max(0, Math.floor(Number(save.competitiveWinStreak ?? fresh.competitiveWinStreak)) || 0),
    rankedWins: Math.max(0, Math.floor(Number(save.rankedWins ?? fresh.rankedWins)) || 0),
    rankedLosses: Math.max(0, Math.floor(Number(save.rankedLosses ?? fresh.rankedLosses)) || 0),
    tournamentWins: Math.max(0, Math.floor(Number(save.tournamentWins ?? fresh.tournamentWins)) || 0),
    onlineTrophies: Math.max(0, Math.floor(Number(save.onlineTrophies ?? fresh.onlineTrophies)) || 0),
    onlineWins: Math.max(0, Math.floor(Number(save.onlineWins ?? fresh.onlineWins)) || 0),
    onlineLosses: Math.max(0, Math.floor(Number(save.onlineLosses ?? fresh.onlineLosses)) || 0),
    onlineDraws: Math.max(0, Math.floor(Number(save.onlineDraws ?? fresh.onlineDraws)) || 0),
    collection,
    starterOnboardingComplete,
    starterPackOpenedAt: safeText(save.starterPackOpenedAt, "", 64) || fresh.starterPackOpenedAt,
    starterPackCards: Array.isArray(save.starterPackCards)
      ? save.starterPackCards.filter((id, index, list) => catalog.has(id) && list.indexOf(id) === index)
      : fresh.starterPackCards,
    customTazzos,
    team: normalizeServerTeam(save.team || fresh.team, collection, catalog, fresh.team),
    goalkeeper: normalizeServerGoalkeeper(save.goalkeeper || fresh.goalkeeper, collection, catalog, fresh.goalkeeper),
    missions,
    missionCycles: savedMissionCycles,
    dailyEconomy: normalizeDailyEconomyRewards(save.dailyEconomy || save.dailyRewards || {}, savedMissionCycles.daily),
    tutorial,
    upgrades: save.upgrades && typeof save.upgrades === "object" ? save.upgrades : fresh.upgrades,
    cosmetics,
    equippedCosmetics,
    selectedCosmetic: Object.values(equippedCosmetics)[0] || (cosmetics?.[save.selectedCosmetic] ? save.selectedCosmetic : fresh.selectedCosmetic),
    oneTimePurchases: sanitizeServerOneTimePurchases(save.oneTimePurchases || fresh.oneTimePurchases),
    friendGifts: save.friendGifts && typeof save.friendGifts === "object" ? save.friendGifts : fresh.friendGifts,
    shareValidations: sanitizeServerShareValidations(save.shareValidations || fresh.shareValidations),
    shareRewards: sanitizeServerShareRewards(save.shareRewards || fresh.shareRewards),
    wishlist: sanitizeServerWishlist(save.wishlist || fresh.wishlist, catalog),
    packPity: sanitizePackPity(save.packPity || fresh.packPity),
    musicTrackIndex: Math.max(0, Math.floor(Number(save.musicTrackIndex ?? fresh.musicTrackIndex)) || 0),
    musicVolume: Number.isFinite(musicVolume) ? clamp(musicVolume, 0, 1) : fresh.musicVolume,
    migratedFromLocalAt
  };
  const currentFloor = currentRankForPoints(normalized.trophies).min;
  normalized.rankFloor = Math.max(normalized.rankFloor, currentFloor);
  normalized.trophies = Math.max(normalized.rankFloor, normalized.trophies);
  normalized.missions = resetExpiredMissions(normalized.missions, fresh.missions, savedMissionCycles);
  normalized.missionCycles = currentMissionCycles();
  normalized.dailyEconomy = normalizeDailyEconomyRewards(normalized.dailyEconomy, normalized.missionCycles.daily);
  normalized.missionDate = new Date().toISOString().slice(0, 10);
  return normalized;
}

function economicSaveFingerprint(save) {
  const normalized = normalizeServerSave(save);
  return JSON.stringify({
    merreis: normalized.merreis,
    fragments: normalized.fragments,
    collection: normalized.collection,
    starterOnboardingComplete: normalized.starterOnboardingComplete,
    starterPackOpenedAt: normalized.starterPackOpenedAt,
    starterPackCards: normalized.starterPackCards,
    customTazzos: normalized.customTazzos,
    upgrades: normalized.upgrades,
    packPity: normalized.packPity,
    trophies: normalized.trophies,
    rankFloor: normalized.rankFloor,
    competitiveWinStreak: normalized.competitiveWinStreak,
    rankedWins: normalized.rankedWins,
    rankedLosses: normalized.rankedLosses,
    tournamentWins: normalized.tournamentWins,
    onlineTrophies: normalized.onlineTrophies,
    onlineWins: normalized.onlineWins,
    onlineLosses: normalized.onlineLosses,
    onlineDraws: normalized.onlineDraws,
    activeCompetitive: normalized.activeCompetitive,
    cosmetics: normalized.cosmetics,
    oneTimePurchases: normalized.oneTimePurchases,
    friendGifts: normalized.friendGifts,
    shareValidations: normalized.shareValidations,
    shareRewards: normalized.shareRewards,
    dailyEconomy: normalized.dailyEconomy,
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
  "starterOnboardingComplete",
  "starterPackOpenedAt",
  "starterPackCards",
  "customTazzos",
  "upgrades",
  "packPity",
  "trophies",
  "rankFloor",
  "competitiveWinStreak",
  "rankedWins",
  "rankedLosses",
  "tournamentWins",
  "onlineTrophies",
  "onlineWins",
  "onlineLosses",
  "onlineDraws",
  "activeCompetitive",
  "cosmetics",
  "oneTimePurchases",
  "friendGifts",
  "shareValidations",
  "shareRewards",
  "dailyEconomy",
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
    if (selected && next.cosmetics?.[selected]) {
      equipServerCosmetic(next, selected);
    } else {
      next.selectedCosmetic = null;
    }
  }
  if (incoming.equippedCosmetics && typeof incoming.equippedCosmetics === "object" && !Array.isArray(incoming.equippedCosmetics)) {
    next.equippedCosmetics = sanitizeServerEquippedCosmetics(incoming.equippedCosmetics, next.cosmetics, next.selectedCosmetic);
    next.selectedCosmetic = Object.values(next.equippedCosmetics)[0] || null;
  }
  if (Object.prototype.hasOwnProperty.call(incoming, "musicTrackIndex")) {
    next.musicTrackIndex = Math.max(0, Math.floor(Number(incoming.musicTrackIndex)) || 0);
  }
  if (Object.prototype.hasOwnProperty.call(incoming, "musicVolume")) {
    const volume = Number(incoming.musicVolume);
    next.musicVolume = Number.isFinite(volume) ? clamp(volume, 0, 1) : next.musicVolume;
  }
  if (incoming.wishlist && typeof incoming.wishlist === "object" && !Array.isArray(incoming.wishlist)) {
    next.wishlist = sanitizeServerWishlist(incoming.wishlist, catalog);
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

function sanitizeMissionStatus(status, mission) {
  return {
    progress: clamp(Math.floor(Number(status?.progress)) || 0, 0, mission.target),
    claimed: Boolean(status?.claimed)
  };
}

function defaultDailyEconomyRewards(dateKey = missionCycleKey("daily")) {
  return {
    dateKey,
    trainingAiMatches: 0,
    rankedWinMerreis: 0
  };
}

function normalizeDailyEconomyRewards(rewards = {}, currentDateKey = missionCycleKey("daily")) {
  const savedDateKey = String(rewards?.dateKey || rewards?.dailyKey || rewards?.date || "");
  if (savedDateKey && savedDateKey !== currentDateKey) return defaultDailyEconomyRewards(currentDateKey);
  return {
    ...defaultDailyEconomyRewards(currentDateKey),
    dateKey: currentDateKey,
    trainingAiMatches: clamp(Math.floor(Number(rewards?.trainingAiMatches)) || 0, 0, ECONOMY_REWARD_RULES.trainingAi.dailyMatches),
    rankedWinMerreis: clamp(Math.floor(Number(rewards?.rankedWinMerreis)) || 0, 0, ECONOMY_REWARD_RULES.rankedWin.dailyMerreisCap)
  };
}

function awardRankedWinMerreis(save) {
  save.dailyEconomy = normalizeDailyEconomyRewards(save.dailyEconomy || {});
  const rule = ECONOMY_REWARD_RULES.rankedWin;
  const remaining = Math.max(0, rule.dailyMerreisCap - save.dailyEconomy.rankedWinMerreis);
  const amount = Math.min(rule.merreis, remaining);
  if (!amount) return { amount: 0, capped: true, earnedToday: save.dailyEconomy.rankedWinMerreis, cap: rule.dailyMerreisCap };
  save.dailyEconomy.rankedWinMerreis += amount;
  save.merreis += amount;
  return { amount, capped: save.dailyEconomy.rankedWinMerreis >= rule.dailyMerreisCap, earnedToday: save.dailyEconomy.rankedWinMerreis, cap: rule.dailyMerreisCap };
}

function resetExpiredMissions(currentMissions, freshMissions, savedMissionCycles) {
  const currentCycles = currentMissionCycles();
  return Object.fromEntries(MISSIONS.map((mission) => {
    const period = missionPeriod(mission);
    if (period === "album" || mission.scope === "album") {
      return [
        mission.id,
        {
          ...sanitizeMissionStatus(freshMissions[mission.id], mission),
          claimed: Boolean(currentMissions?.[mission.id]?.claimed)
        }
      ];
    }
    if (savedMissionCycles?.[period] !== currentCycles[period]) {
      return [mission.id, sanitizeMissionStatus(freshMissions[mission.id], mission)];
    }
    return [mission.id, sanitizeMissionStatus(currentMissions?.[mission.id] || freshMissions[mission.id], mission)];
  }));
}

function progressServerMission(save, eventId, amount) {
  const missions = MISSIONS.filter((mission) => missionEvent(mission) === eventId && mission.scope !== "album" && missionPeriod(mission) !== "album");
  if (!missions.length) return;
  missions.forEach((mission) => {
    if (!save.missions[mission.id]) save.missions[mission.id] = { progress: 0, claimed: false };
    const current = Number(save.missions[mission.id].progress) || 0;
    save.missions[mission.id].progress = clamp(current + amount, 0, mission.target);
  });
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

function currentRankForPoints(points) {
  return [...RANKS].reverse().find((rank) => (Number(points) || 0) >= rank.min) || RANKS[0];
}

function currentRankForSave(save) {
  const protectedPoints = Math.max(Number(save.trophies) || 0, Number(save.rankFloor) || 0);
  return currentRankForPoints(protectedPoints);
}

function rankedOpponentForSave(save) {
  const rank = currentRankForSave(save);
  return RANKED_OPPONENTS.find((opponent) => opponent.rank === rank.name) || RANKED_OPPONENTS[0];
}

function ensureCompetitiveRankFloor(save) {
  const currentFloor = currentRankForSave(save).min;
  save.rankFloor = Math.max(0, Number(save.rankFloor) || 0, currentFloor);
  save.trophies = Math.max(save.rankFloor, Number(save.trophies) || 0);
  return save.rankFloor;
}

function competitiveWinBonus(streak) {
  const safeStreak = Math.max(0, Math.floor(Number(streak)) || 0);
  if (safeStreak >= 5) return COMPETITIVE_STREAK_BONUSES[5];
  return COMPETITIVE_STREAK_BONUSES[safeStreak] || 0;
}

function applyCompetitivePoints(save, outcome) {
  const floorBefore = ensureCompetitiveRankFloor(save);
  if (outcome === "win") {
    save.competitiveWinStreak = Math.max(0, Math.floor(Number(save.competitiveWinStreak)) || 0) + 1;
    const bonus = competitiveWinBonus(save.competitiveWinStreak);
    const points = COMPETITIVE_WIN_POINTS + bonus;
    save.trophies += points;
    const previousFloor = save.rankFloor;
    ensureCompetitiveRankFloor(save);
    return {
      outcome,
      points,
      base: COMPETITIVE_WIN_POINTS,
      bonus,
      streak: save.competitiveWinStreak,
      rankFloorReached: save.rankFloor > previousFloor ? currentRankForSave(save).name : ""
    };
  }

  save.competitiveWinStreak = 0;
  if (outcome === "draw") {
    return {
      outcome,
      points: 0,
      base: 0,
      bonus: 0,
      streak: 0,
      floorProtected: false
    };
  }

  const before = Number(save.trophies) || 0;
  save.trophies = Math.max(floorBefore, before - COMPETITIVE_LOSS_POINTS);
  return {
    outcome: "loss",
    points: save.trophies - before,
    base: -COMPETITIVE_LOSS_POINTS,
    bonus: 0,
    streak: 0,
    floorProtected: before - COMPETITIVE_LOSS_POINTS < floorBefore
  };
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

function competitiveQueueKey(type, tournamentId = "") {
  return type === "tournament" ? `tournament:${String(tournamentId || "")}` : "ranked";
}

function competitiveQueueForTicket(ticket) {
  const key = competitiveQueueKey(ticket.type, ticket.tournamentId);
  if (!competitiveMatchmakingQueues.has(key)) competitiveMatchmakingQueues.set(key, []);
  return competitiveMatchmakingQueues.get(key);
}

function removeCompetitiveTicket(ticket) {
  if (!ticket) return;
  const queue = competitiveMatchmakingQueues.get(competitiveQueueKey(ticket.type, ticket.tournamentId));
  if (!queue) return;
  const index = queue.indexOf(ticket);
  if (index >= 0) queue.splice(index, 1);
  if (!queue.length) competitiveMatchmakingQueues.delete(competitiveQueueKey(ticket.type, ticket.tournamentId));
}

function removeCompetitiveTicketsForPlayer(playerId) {
  for (const queue of competitiveMatchmakingQueues.values()) {
    for (const ticket of [...queue]) {
      if (ticket.playerId === playerId) {
        removeCompetitiveTicket(ticket);
        if (ticket.timeout) clearTimeout(ticket.timeout);
        const error = new Error("Busca competitiva substituida por uma nova tentativa.");
        error.status = 409;
        ticket.reject(error);
      }
    }
  }
}

function competitiveRankWindow(waitMs) {
  const safeWait = Math.max(0, Number(waitMs) || 0);
  return [...COMPETITIVE_MATCHMAKING_RANK_WINDOWS]
    .reverse()
    .find((entry) => safeWait >= entry.waitMs)?.trophies || COMPETITIVE_MATCHMAKING_RANK_WINDOWS[0].trophies;
}

function competitiveTicketsCompatible(a, b, now = Date.now()) {
  if (!a || !b || a.playerId === b.playerId) return false;
  if (a.type !== b.type || String(a.tournamentId || "") !== String(b.tournamentId || "")) return false;
  const trophyDistance = Math.abs((Number(a.trophies) || 0) - (Number(b.trophies) || 0));
  const windowA = competitiveRankWindow(now - a.createdAt);
  const windowB = competitiveRankWindow(now - b.createdAt);
  return trophyDistance <= Math.max(windowA, windowB);
}

function bestCompetitiveCandidate(ticket) {
  const now = Date.now();
  return competitiveQueueForTicket(ticket)
    .filter((candidate) => competitiveTicketsCompatible(ticket, candidate, now))
    .sort((a, b) => {
      const trophyA = Math.abs((Number(ticket.trophies) || 0) - (Number(a.trophies) || 0));
      const trophyB = Math.abs((Number(ticket.trophies) || 0) - (Number(b.trophies) || 0));
      return trophyA - trophyB || a.createdAt - b.createdAt;
    })[0] || null;
}

function competitiveOpponentFromSave(save, name, fallbackOpponent, playerId = "") {
  const loadout = sanitizeOnlineLoadout(save);
  return {
    name: safeText(name, fallbackOpponent?.name || "Rival online", 24),
    team: loadout.team?.length === 3 ? loadout.team : fallbackOpponent.team,
    goalkeeper: loadout.goalkeeper || fallbackOpponent.goalkeeper,
    rank: currentRankForSave(save).name,
    playerId
  };
}

function fallbackCompetitiveOpponent(type, save, tournamentId = "") {
  if (type === "tournament") return TOURNAMENT_OPPONENTS[tournamentId] || Object.values(TOURNAMENT_OPPONENTS)[0];
  return rankedOpponentForSave(save);
}

async function clearPausedTournamentCompetitive(playerId, save) {
  if (TOURNAMENTS_AVAILABLE !== false) return false;
  if (save.activeCompetitive?.type !== "tournament" || save.activeCompetitive.resolved) return false;
  save.activeCompetitive = null;
  await writeSave(playerId, save);
  return true;
}

async function validateCompetitiveTicket(playerId, type, options = {}) {
  const profile = await requireProfileForPlayer(playerId);
  if (type === "tournament" && !TOURNAMENTS_AVAILABLE) {
    const error = new Error("Torneios indisponiveis por agora. Ranqueadas seguem liberadas.");
    error.status = 403;
    throw error;
  }
  const tournament = type === "tournament"
    ? TOURNAMENTS.find((item) => item.id === options.tournamentId)
    : null;
  if (type === "tournament" && !tournament) {
    const error = new Error("Torneio nao encontrado.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  await clearPausedTournamentCompetitive(playerId, save);
  if (save.activeCompetitive && !save.activeCompetitive.resolved) {
    const error = new Error("Ja existe uma partida competitiva ativa.");
    error.status = 409;
    error.save = save;
    throw error;
  }
  if (type === "tournament" && serverTeamCost(save) > 10) {
    const error = new Error("Time acima do custo competitivo.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  if (tournament && save.merreis < tournament.entry) {
    const error = new Error("Merreis insuficientes para entrar no torneio.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  const rank = currentRankForSave(save);
  return {
    id: crypto.randomUUID(),
    playerId,
    profileName: profile.name,
    type,
    tournamentId: tournament?.id || "",
    tournament,
    rankName: rank.name,
    rankMin: rank.min,
    trophies: Number(save.trophies) || 0,
    createdAt: Date.now()
  };
}

async function createCompetitiveMatchForTicket(ticket, opponent, matchmaking) {
  const record = await readOrCreateSave(ticket.playerId);
  const save = normalizeServerSave(record.save);
  await clearPausedTournamentCompetitive(ticket.playerId, save);
  if (save.activeCompetitive && !save.activeCompetitive.resolved) {
    const error = new Error("Ja existe uma partida competitiva ativa.");
    error.status = 409;
    error.save = save;
    throw error;
  }
  if (ticket.type === "tournament" && serverTeamCost(save) > 10) {
    const error = new Error("Time acima do custo competitivo.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  if (ticket.tournament && save.merreis < ticket.tournament.entry) {
    const error = new Error("Merreis insuficientes para entrar no torneio.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  const rank = currentRankForSave(save);
  if (ticket.tournament) save.merreis -= ticket.tournament.entry;
  const match = activeCompetitiveMatch(ticket.type, {
    id: matchmaking.matchId,
    rank: rank.name,
    tournamentId: ticket.tournament?.id || undefined,
    tournamentName: ticket.tournament?.name || undefined,
    opponent: opponent.name,
    opponentPlayerId: opponent.playerId || null,
    matchmaking
  });
  save.activeCompetitive = match;
  progressServerMission(save, ticket.type === "ranked" ? "ranked" : "tournament", 1);
  await writeSave(ticket.playerId, save);
  recordAccountEvent(ticket.playerId, ticket.type === "ranked" ? "ranked:start" : "tournament:start", {
    matchId: match.id,
    rank: rank.name,
    tournament: ticket.tournament ? {
      id: ticket.tournament.id,
      name: ticket.tournament.name,
      entry: ticket.tournament.entry
    } : null,
    opponent: opponent.name,
    matchmaking,
    balances: accountEventBalance(save)
  });
  return {
    save,
    match,
    rank,
    tournament: ticket.tournament,
    opponent,
    matchmaking
  };
}

async function createCompetitiveBotMatch(ticket) {
  const record = await readOrCreateSave(ticket.playerId);
  const save = normalizeServerSave(record.save);
  const opponent = fallbackCompetitiveOpponent(ticket.type, save, ticket.tournamentId);
  const matchmaking = {
    source: "bot",
    matchId: crypto.randomUUID(),
    queuedAt: new Date(ticket.createdAt).toISOString(),
    matchedAt: new Date().toISOString(),
    waitMs: Date.now() - ticket.createdAt,
    timeoutMs: COMPETITIVE_MATCHMAKING_TIMEOUT_MS
  };
  return createCompetitiveMatchForTicket(ticket, opponent, matchmaking);
}

async function createCompetitivePlayerMatch(ticketA, ticketB) {
  const [recordA, recordB] = await Promise.all([
    readOrCreateSave(ticketA.playerId),
    readOrCreateSave(ticketB.playerId)
  ]);
  const saveA = normalizeServerSave(recordA.save);
  const saveB = normalizeServerSave(recordB.save);
  const fallbackA = fallbackCompetitiveOpponent(ticketA.type, saveA, ticketA.tournamentId);
  const fallbackB = fallbackCompetitiveOpponent(ticketB.type, saveB, ticketB.tournamentId);
  const opponentForA = competitiveOpponentFromSave(saveB, ticketB.profileName, fallbackA, ticketB.playerId);
  const opponentForB = competitiveOpponentFromSave(saveA, ticketA.profileName, fallbackB, ticketA.playerId);
  const matchId = crypto.randomUUID();
  const matchedAt = Date.now();
  const matchmakingA = {
    source: "player",
    matchId,
    queuedAt: new Date(ticketA.createdAt).toISOString(),
    matchedAt: new Date(matchedAt).toISOString(),
    waitMs: matchedAt - ticketA.createdAt,
    timeoutMs: COMPETITIVE_MATCHMAKING_TIMEOUT_MS,
    opponentPlayerId: ticketB.playerId
  };
  const matchmakingB = {
    source: "player",
    matchId,
    queuedAt: new Date(ticketB.createdAt).toISOString(),
    matchedAt: new Date(matchedAt).toISOString(),
    waitMs: matchedAt - ticketB.createdAt,
    timeoutMs: COMPETITIVE_MATCHMAKING_TIMEOUT_MS,
    opponentPlayerId: ticketA.playerId
  };
  const [resultA, resultB] = await Promise.all([
    createCompetitiveMatchForTicket(ticketA, opponentForA, matchmakingA),
    createCompetitiveMatchForTicket(ticketB, opponentForB, matchmakingB)
  ]);
  return [resultA, resultB];
}

async function startCompetitiveMatchmakingForPlayer(playerId, type, options = {}) {
  removeCompetitiveTicketsForPlayer(playerId);
  const ticket = await validateCompetitiveTicket(playerId, type, options);
  const candidate = bestCompetitiveCandidate(ticket);
  if (candidate) {
    removeCompetitiveTicket(candidate);
    if (candidate.timeout) clearTimeout(candidate.timeout);
    try {
      const [candidateResult, ticketResult] = await createCompetitivePlayerMatch(candidate, ticket);
      candidate.resolve(candidateResult);
      return ticketResult;
    } catch (error) {
      candidate.reject(error);
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    ticket.resolve = resolve;
    ticket.reject = reject;
    ticket.timeout = setTimeout(() => {
      removeCompetitiveTicket(ticket);
      createCompetitiveBotMatch(ticket).then(resolve).catch(reject);
    }, COMPETITIVE_MATCHMAKING_TIMEOUT_MS);
    competitiveQueueForTicket(ticket).push(ticket);
  });
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

function drawStarterPackPulls(collection = {}) {
  const owned = new Set(Object.entries(collection).filter(([, count]) => Number(count) > 0).map(([id]) => id));
  const packUsed = new Set();
  const epicOrLower = (monster) => rarityIndex(monster.rarity) <= rarityIndex("Epico");
  const pick = (label, test) => {
    const pool = MONSTERS.filter((monster) => test(monster) && !packUsed.has(monster.id));
    const freshPool = pool.filter((monster) => !owned.has(monster.id));
    const safePool = freshPool.length ? freshPool : pool;
    const monster = randomItem(safePool);
    packUsed.add(monster.id);
    return {
      monster,
      pull: {
        monsterId: monster.id,
        roleLabel: label,
        isNew: !collection[monster.id],
        fragments: 0,
        revealed: true
      }
    };
  };

  const attacker = pick("Atacante", (monster) => !isGoalkeeper(monster) && epicOrLower(monster) && STARTER_FIELD_SLOTS[0].test(monster));
  const midfielder = pick("Meia", (monster) => !isGoalkeeper(monster) && epicOrLower(monster) && STARTER_FIELD_SLOTS[1].test(monster));
  const defender = pick("Zagueiro", (monster) => !isGoalkeeper(monster) && epicOrLower(monster) && STARTER_FIELD_SLOTS[2].test(monster));
  const goalkeeper = pick("Goleiro", (monster) => isGoalkeeper(monster) && epicOrLower(monster));
  const legendary = pick("Lendario", (monster) => monster.rarity === "Lendario");
  return {
    pulls: [attacker.pull, midfielder.pull, defender.pull, goalkeeper.pull, legendary.pull],
    team: [attacker.monster.id, midfielder.monster.id, defender.monster.id],
    goalkeeper: goalkeeper.monster.id
  };
}

async function openStarterPackForPlayer(playerId) {
  await requireProfileForPlayer(playerId);
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  if (save.starterOnboardingComplete) {
    const labels = ["Atacante", "Meia", "Zagueiro", "Goleiro", "Lendario"];
    const pulls = (save.starterPackCards || [])
      .filter((id) => MONSTER_BY_ID[id])
      .map((monsterId, index) => ({
        monsterId,
        roleLabel: labels[index] || "Starter",
        isNew: true,
        fragments: 0,
        revealed: true
      }));
    return { save, pulls, alreadyComplete: true };
  }

  const hasExistingProgress = hasLegacyStarterProgress(save);
  const starterSourceCollection = hasExistingProgress ? save.collection || {} : {};
  const starter = drawStarterPackPulls(starterSourceCollection);
  if (!hasExistingProgress) {
    save.collection = {};
    save.upgrades = {};
    save.wishlist = {};
    save.activeCompetitive = null;
  }
  starter.pulls.forEach((pull) => {
    save.collection[pull.monsterId] = (save.collection[pull.monsterId] || 0) + 1;
  });
  save.team = starter.team;
  save.goalkeeper = starter.goalkeeper;
  save.starterOnboardingComplete = true;
  save.starterPackOpenedAt = new Date().toISOString();
  save.starterPackCards = starter.pulls.map((pull) => pull.monsterId);
  const saved = await writeSave(playerId, save);
  recordAccountEvent(playerId, "starter:open", {
    pack: { id: "recheado", name: "Recheado", cards: starter.pulls.length },
    pulls: accountEventPulls(starter.pulls),
    balances: accountEventBalance(saved.save)
  });
  return { save: saved.save, pulls: starter.pulls, alreadyComplete: false };
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
  progressServerMission(save, "pack", 1);
  await writeSave(playerId, save);
  recordAccountEvent(playerId, "pack:open", {
    pack: {
      id: pack.id,
      name: pack.name,
      cost: pack.cost,
      cards: pack.cards
    },
    pulls: accountEventPulls(pulls),
    balances: accountEventBalance(save)
  });
  return { save, pulls, pack };
}

async function buyShopItemForPlayer(playerId, itemId, clientRequestId = "", req = null, checkoutOptions = {}) {
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

  if (item.type === "merreis") {
    const checkout = await createMerreisCheckoutForPlayer(playerId, item.id, clientRequestId, req, checkoutOptions);
    return {
      save,
      item,
      checkout: true,
      checkoutUrl: checkout.checkoutUrl,
      order: publicPaymentOrder(checkout.order),
      message: "Pedido criado. Abrindo checkout seguro do Mercado Pago."
    };
  }

  const alreadyOwned = Boolean(save.cosmetics[item.id]);

  let message = "";
  if (alreadyOwned) {
    equipServerCosmetic(save, item.id);
    message = `${item.name} equipado.`;
  } else {
    if (save.merreis < item.cost) {
      const error = new Error("Merreis insuficientes.");
      error.status = 400;
      error.save = save;
      throw error;
    }
    save.merreis -= item.cost;
    save.cosmetics[item.id] = true;
    equipServerCosmetic(save, item.id);
    message = `${item.name} comprado.`;
  }

  await writeSave(playerId, save);
  recordAccountEvent(playerId, alreadyOwned ? "shop:activate" : "shop:buy", {
    item: { id: item.id, name: item.name },
    cost: alreadyOwned ? 0 : item.cost,
    balances: accountEventBalance(save)
  });
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
  recordAccountEvent(playerId, "tazzo:upgrade", {
    monster: accountEventMonster(monster),
    level: level + 1,
    cost,
    balances: accountEventBalance(save)
  });
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
  save.fragments += Number(mission.fragments) || 0;
  await writeSave(playerId, save);
  recordAccountEvent(playerId, "mission:claim", {
    mission: {
      id: mission.id,
      title: mission.title,
      reward: mission.reward
    },
    balances: accountEventBalance(save)
  });
  return { save, mission };
}

async function claimTutorialRewardForPlayer(playerId) {
  await requireProfileForPlayer(playerId);
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  const complete = TUTORIAL_STEPS.every((step) => save.tutorial?.[step.id]);
  if (!complete) {
    const error = new Error("Tutorial ainda incompleto.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  const reward = { merreis: 500, fragments: 25 };
  if (save.tutorialRewardClaimed) {
    return { save, reward, alreadyClaimed: true };
  }

  save.tutorialRewardClaimed = true;
  save.merreis += reward.merreis;
  save.fragments += reward.fragments;
  await writeSave(playerId, save);
  recordAccountEvent(playerId, "tutorial:reward:claim", {
    reward,
    balances: accountEventBalance(save)
  });
  return { save, reward, alreadyClaimed: false };
}

function socialShareRewardById(networkId) {
  return SOCIAL_SHARE_REWARDS.find((item) => item.id === networkId) || null;
}

function publicShareUrlForRequest(req, ownerPlayerId, networkId) {
  const configured = configuredPublicBaseUrl();
  const host = safeText(req?.headers?.host, `${HOST}:${PORT}`, 160);
  const base = configured || `http://${host}`;
  const url = new URL("/", base.endsWith("/") ? base : `${base}/`);
  url.searchParams.set("ref", ownerPlayerId);
  url.searchParams.set("share", networkId);
  return url.toString();
}

async function createShareLinkForPlayer(playerId, networkId, req) {
  await requireProfileForPlayer(playerId);
  const network = socialShareRewardById(networkId);
  if (!network) {
    const error = new Error("Rede social nao encontrada.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  save.shareRewards = sanitizeServerShareRewards(save.shareRewards);
  save.shareValidations = sanitizeServerShareValidations(save.shareValidations);
  if (save.shareRewards[network.id]) {
    const error = new Error("Recompensa dessa rede ja foi resgatada.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  const now = new Date().toISOString();
  const current = save.shareValidations[network.id] || {};
  save.shareValidations[network.id] = {
    ...current,
    requestedAt: current.requestedAt || now
  };
  await writeSave(playerId, save);
  recordAccountEvent(playerId, "share:link", {
    network: { id: network.id, name: network.name },
    shareUrl: publicShareUrlForRequest(req, playerId, network.id)
  });
  return {
    save,
    network,
    shareUrl: publicShareUrlForRequest(req, playerId, network.id),
    validation: save.shareValidations[network.id]
  };
}

async function recordShareVisitForPlayer(visitorPlayerId, ownerPlayerId, networkId) {
  const network = socialShareRewardById(networkId);
  if (!network) {
    const error = new Error("Rede social nao encontrada.");
    error.status = 404;
    throw error;
  }
  if (!isValidPlayerId(ownerPlayerId)) {
    const error = new Error("Convite invalido.");
    error.status = 400;
    throw error;
  }
  if (ownerPlayerId === visitorPlayerId) {
    const error = new Error("Visita propria nao valida recompensa.");
    error.status = 400;
    throw error;
  }
  const ownerProfile = await profileForPlayer(ownerPlayerId);
  if (!ownerProfile) {
    const error = new Error("Jogador do convite nao encontrado.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(ownerPlayerId);
  const save = normalizeServerSave(record.save);
  save.shareRewards = sanitizeServerShareRewards(save.shareRewards);
  save.shareValidations = sanitizeServerShareValidations(save.shareValidations);
  if (save.shareRewards[network.id]) {
    return { network, ownerPlayerId, alreadyClaimed: true };
  }
  const current = save.shareValidations[network.id] || {};
  if (!current.requestedAt) {
    const error = new Error("Convite ainda nao foi gerado pelo jogador.");
    error.status = 400;
    throw error;
  }
  if (current.validatedAt) {
    return { network, ownerPlayerId, validation: current, alreadyValidated: true };
  }

  const validation = {
    ...current,
    validatedAt: new Date().toISOString(),
    visitorPlayerId
  };
  save.shareValidations[network.id] = validation;
  await writeSave(ownerPlayerId, save);
  recordAccountEvent(ownerPlayerId, "share:validated", {
    network: { id: network.id, name: network.name, reward: network.reward },
    visitorPlayerId
  });
  return { network, ownerPlayerId, validation };
}

async function claimShareRewardForPlayer(playerId, networkId) {
  await requireProfileForPlayer(playerId);
  const network = socialShareRewardById(networkId);
  if (!network) {
    const error = new Error("Rede social nao encontrada.");
    error.status = 404;
    throw error;
  }

  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  save.shareRewards = sanitizeServerShareRewards(save.shareRewards);
  save.shareValidations = sanitizeServerShareValidations(save.shareValidations);
  if (save.shareRewards[network.id]) {
    const error = new Error("Recompensa dessa rede ja foi resgatada.");
    error.status = 400;
    error.save = save;
    throw error;
  }
  if (!save.shareValidations[network.id]?.validatedAt) {
    const error = new Error("A recompensa libera quando alguem diferente abrir seu link.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.shareRewards[network.id] = new Date().toISOString();
  save.merreis += Number(network.reward) || 0;
  await writeSave(playerId, save);
  recordAccountEvent(playerId, "share:claim", {
    network: {
      id: network.id,
      name: network.name,
      reward: network.reward
    },
    balances: accountEventBalance(save)
  });
  return { save, network };
}

async function resolveTrainingAiForPlayer(playerId, payload = {}) {
  await requireProfileForPlayer(playerId);
  const outcome = ["win", "draw", "loss"].includes(payload.outcome) ? payload.outcome : "loss";
  const record = await readOrCreateSave(playerId);
  const save = normalizeServerSave(record.save);
  progressServerMission(save, "battle", 1);
  if (outcome === "win") progressServerMission(save, "win", 1);

  save.dailyEconomy = normalizeDailyEconomyRewards(save.dailyEconomy || {});
  const rule = ECONOMY_REWARD_RULES.trainingAi;
  const capped = save.dailyEconomy.trainingAiMatches >= rule.dailyMatches;
  const rewards = [];
  let merreis = 0;
  if (!capped) {
    save.dailyEconomy.trainingAiMatches += 1;
    save.merreis += rule.merreis;
    merreis = rule.merreis;
    rewards.push(`+${rule.merreis.toLocaleString("pt-BR")} Merreis`);
  } else {
    rewards.push("Limite diario de treino atingido");
  }

  await writeSave(playerId, save);
  recordAccountEvent(playerId, "training-ai:resolve", {
    outcome,
    merreis,
    trainingAiMatches: save.dailyEconomy.trainingAiMatches,
    balances: accountEventBalance(save)
  });
  return {
    save,
    result: {
      outcome,
      status: merreis
        ? `Treino contra IA concluido. +${merreis.toLocaleString("pt-BR")} Merreis (${save.dailyEconomy.trainingAiMatches}/${rule.dailyMatches} hoje)`
        : "Treino contra IA concluido. Limite diario de Merreis atingido.",
      rewards
    }
  };
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
  recordAccountEvent(playerId, "trade:complete", {
    offered: accountEventMonster(offered),
    received: accountEventMonster(received),
    cost: 60,
    balances: accountEventBalance(save)
  });
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
  recordAccountEvent(playerId, "friend:gift", {
    friend: { id: friend.id, name: friend.name },
    reward: 80,
    date: today,
    balances: accountEventBalance(save)
  });
  return {
    save,
    friend,
    reward: 80,
    message: `Presente enviado para ${friend.name}: +80 Merreis.`
  };
}

async function startRankedForPlayer(playerId) {
  return startCompetitiveMatchmakingForPlayer(playerId, "ranked");
}

async function startTournamentForPlayer(playerId, tournamentId) {
  return startCompetitiveMatchmakingForPlayer(playerId, "tournament", { tournamentId });
}

function rankedResolution(save, outcome, reason = "") {
  if (outcome === "win") {
    const points = applyCompetitivePoints(save, "win");
    const merreisReward = awardRankedWinMerreis(save);
    save.rankedWins += 1;
    const bonusText = points.bonus ? ` (+${points.bonus} bonus de sequencia ${points.streak})` : "";
    return {
      status: `Vitoria ranqueada! +${points.points} pontos${bonusText}`,
      log: `Vitoria ranqueada${reason ? ` por ${reason}` : ""}: +${points.points} pontos${bonusText}.`,
      rewards: [
        `+${points.points} pontos`,
        merreisReward.amount ? `+${merreisReward.amount.toLocaleString("pt-BR")} Merreis` : "Limite diario de Merreis ranqueados atingido"
      ]
    };
  }

  if (outcome === "draw") {
    applyCompetitivePoints(save, "draw");
    return {
      status: "Empate ranqueado. Sem Merreis",
      log: `Empate ranqueado${reason ? ` por ${reason}` : ""}.`,
      rewards: ["Sem perda de trofeus"]
    };
  }

  const points = applyCompetitivePoints(save, "loss");
  save.rankedLosses += 1;
  const floorText = points.floorProtected ? " Piso de divisao segurou seus pontos." : "";
  return {
    status: `Derrota ranqueada. ${points.points} pontos.${floorText}`,
    log: `Derrota ranqueada${reason ? ` por ${reason}` : ""}: ${points.points} pontos.${floorText}`,
    rewards: [`${points.points} pontos`]
  };
}

function tournamentResolution(save, tournament, won, reason = "") {
  if (won) {
    const points = applyCompetitivePoints(save, "win");
    const bonusText = points.bonus ? ` (+${points.bonus} bonus de sequencia ${points.streak})` : "";
    const rewards = [`+${points.points} pontos`];
    save.tournamentWins += 1;
    if (tournament.id === "event") {
      save.merreis += 100;
      const pack = PACKS.find((item) => item.id === "recheado");
      const pulls = drawPackPulls(save, pack);
      rewards.push("+100 Merreis", "Pacotinho Recheado");
      return {
        status: `Campeao do Evento! +${points.points} pontos${bonusText}. Pacotinho Recheado enviado.`,
        log: `Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}: +${points.points} pontos${bonusText}.`,
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
      status: `Campeao do torneio ${tournament.name}! +${points.points} pontos${bonusText} e +${tournament.reward.toLocaleString("pt-BR")} Merreis`,
      log: `Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}: +${points.points} pontos${bonusText}.`,
      rewards,
      packReward: false
    };
  }

  const points = applyCompetitivePoints(save, "loss");
  const refund = Math.floor(tournament.entry * 0.25);
  save.merreis += refund;
  const floorText = points.floorProtected ? " Piso de divisao segurou seus pontos." : "";
  return {
    status: `Eliminado no torneio ${tournament.name}. ${points.points} pontos. Reembolso ${refund.toLocaleString("pt-BR")} Merreis.${floorText}`,
    log: `Eliminado no torneio ${tournament.name}${reason ? ` por ${reason}` : ""}: ${points.points} pontos.${floorText}`,
    rewards: [`${points.points} pontos`, `+${refund.toLocaleString("pt-BR")} Merreis reembolso`],
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
  let eventOutcome = "loss";
  let eventTournament = null;
  if (match.type === "ranked") {
    const outcome = ["win", "draw", "loss"].includes(payload.outcome) ? payload.outcome : "loss";
    eventOutcome = outcome;
    result = rankedResolution(save, outcome, reason);
  } else if (match.type === "tournament") {
    const tournament = TOURNAMENTS.find((item) => item.id === match.tournamentId);
    if (!tournament) {
      const error = new Error("Torneio da partida nao encontrado.");
      error.status = 404;
      error.save = save;
      throw error;
    }
    eventOutcome = payload.won ? "win" : "loss";
    eventTournament = { id: tournament.id, name: tournament.name };
    result = tournamentResolution(save, tournament, Boolean(payload.won), reason);
  } else {
    const error = new Error("Tipo competitivo invalido.");
    error.status = 400;
    error.save = save;
    throw error;
  }

  save.activeCompetitive = null;
  await writeSave(playerId, save);
  recordAccountEvent(playerId, match.type === "ranked" ? "ranked:resolve" : "tournament:resolve", {
    matchId: match.id,
    type: match.type,
    outcome: eventOutcome,
    reason,
    tournament: eventTournament,
    status: result.status,
    rewards: Array.isArray(result.rewards) ? result.rewards : [],
    packReward: Boolean(result.packReward),
    pack: result.pack || null,
    pulls: accountEventPulls(result.pulls),
    balances: accountEventBalance(save)
  });
  return { save, match, result };
}

async function handleApi(req, res, url) {
  const { playerId, isNew } = getPlayer(req);
  let headers = securityHeaders(req);
  if (isNew) headers = appendSetCookie(headers, playerCookie(playerId, req));

  try {
    enforceRateLimit(req, url);
    enforceMutationOrigin(req, url);
  } catch (error) {
    json(res, error.status || 500, {
      ok: false,
      error: error.message || "Requisicao bloqueada."
    }, {
      ...headers,
      ...(error.headers || {})
    });
    return;
  }

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

  if (url.pathname === "/api/share-visit") {
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
      const result = await recordShareVisitForPlayer(playerId, payload.ownerPlayerId, payload.networkId);
      json(res, 200, {
        ok: true,
        playerId,
        ownerPlayerId: result.ownerPlayerId,
        network: { id: result.network.id, name: result.network.name },
        validated: Boolean(result.validation?.validatedAt),
        alreadyValidated: Boolean(result.alreadyValidated),
        alreadyClaimed: Boolean(result.alreadyClaimed)
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao validar convite."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/telemetry") {
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
      const type = cleanAccountEventType(payload.type || "event");
      const event = recordAccountEvent(playerId, `client:${type}`, {
        ...sanitizeTelemetryData(payload.data),
        userAgent: safeText(req.headers["user-agent"], "", 160)
      });
      json(res, 200, {
        ok: true,
        playerId,
        eventId: event?.id || null
      }, headers);
    } catch (error) {
      json(res, 400, {
        ok: false,
        error: "Telemetria invalida."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/admin/session") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    const context = await adminContextForRequest(req, playerId);
    json(res, 200, {
      ok: true,
      admin: context.authorized,
      method: context.method,
      tokenEnabled: context.tokenEnabled,
      profile: context.profile
    }, headers);
    return;
  }

  if (url.pathname === "/api/admin/login") {
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
      if (!isValidAdminToken(payload.token)) {
        json(res, 401, {
          ok: false,
          error: "Token admin invalido."
        }, headers);
        return;
      }
      json(res, 200, {
        ok: true,
        admin: true,
        method: "token"
      }, appendSetCookie(headers, adminSessionCookie(req)));
    } catch (error) {
      json(res, 400, {
        ok: false,
        error: "Login admin invalido."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/admin/logout") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    json(res, 200, { ok: true }, appendSetCookie(headers, clearAdminSessionCookie(req)));
    return;
  }

  if (url.pathname === "/api/admin/telemetry/summary") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    try {
      const context = await requireAdminForRequest(req, playerId);
      const days = clamp(Math.floor(Number(url.searchParams.get("days"))) || 7, 1, 90);
      json(res, 200, {
        ok: true,
        admin: {
          method: context.method,
          profile: context.profile
        },
        summary: await adminTelemetrySummary(days)
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Acesso admin indisponivel.",
        tokenEnabled: error.context?.tokenEnabled ?? Boolean(ADMIN_TOKEN)
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/account/events") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    try {
      const profile = await requireProfileForPlayer(playerId);
      const limit = clamp(Math.floor(Number(url.searchParams.get("limit"))) || 40, 1, 100);
      json(res, 200, {
        ok: true,
        playerId,
        profile: publicProfile(profile),
        events: accountEventsForPlayer(playerId, limit)
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao carregar historico."
      }, headers);
    }
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

  if (url.pathname === "/api/shop/config") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    json(res, 200, {
      ok: true,
      mercadoPago: publicMercadoPagoConfig(req)
    }, headers);
    return;
  }

  if (url.pathname === "/api/crypto/config") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    json(res, 410, {
      ok: false,
      error: "Recurso indisponivel."
    }, headers);
    return;
  }

  if (url.pathname === "/api/mercadopago/webhook") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }
    let payload = {};
    try {
      const body = await readBody(req);
      payload = body ? JSON.parse(body) : {};
    } catch (error) {
      json(res, 400, { ok: false, error: "Webhook invalido." }, headers);
      return;
    }

    const eventType = String(payload.type || url.searchParams.get("type") || "").toLowerCase();
    const action = String(payload.action || "").toLowerCase();
    const paymentId = mercadoPagoPaymentIdFromNotification(url, payload);
    if (eventType && eventType !== "payment") {
      json(res, 200, { ok: true, ignored: true }, headers);
      return;
    }
    if (action && !action.startsWith("payment.")) {
      json(res, 200, { ok: true, ignored: true }, headers);
      return;
    }
    if (!paymentId) {
      json(res, 400, { ok: false, error: "Pagamento ausente no webhook." }, headers);
      return;
    }
    if (!verifyMercadoPagoWebhookSignature(req, url, paymentId)) {
      json(res, 401, { ok: false, error: "Assinatura Mercado Pago invalida." }, headers);
      return;
    }

    try {
      const result = await validateMercadoPagoPayment(paymentId);
      json(res, 200, {
        ok: true,
        credited: Boolean(result.credited),
        alreadyCredited: Boolean(result.alreadyCredited),
        alreadyClaimed: Boolean(result.alreadyClaimed),
        order: publicPaymentOrder(result.order)
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao validar pagamento."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/mercadopago/return") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    const paymentId = normalizePaymentId(
      url.searchParams.get("payment_id")
      || url.searchParams.get("collection_id")
      || url.searchParams.get("id")
    );
    const orderId = String(url.searchParams.get("external_reference") || url.searchParams.get("order_id") || "").trim();
    if (!paymentId) {
      redirectToPaymentReturn(res, 303, {
        mp_result: url.searchParams.get("result") || "pending",
        mp_order: orderId,
        mp_message: "payment_missing"
      });
      return;
    }
    try {
      const result = await validateMercadoPagoPayment(paymentId);
      const order = result.order || paymentOrderById(orderId);
      const rewards = order ? shopOrderRewards(order) : { merreis: 0, fragments: 0, legendaryCards: 0 };
      const pullTokens = order ? paymentOrderPullTokens(order) : [];
      const approved = Boolean(result.credited || result.alreadyCredited);
      const rewardText = [
        rewards.merreis ? `+${rewards.merreis.toLocaleString("pt-BR")} Merreis` : "",
        rewards.fragments ? `+${rewards.fragments.toLocaleString("pt-BR")} fragmentos` : "",
        rewards.legendaryCards ? `${rewards.legendaryCards.toLocaleString("pt-BR")} lendario(s)` : ""
      ].filter(Boolean).join(", ");
      redirectToPaymentReturn(res, 303, {
        mp_result: approved ? "approved" : (order?.status || "pending"),
        mp_order: order?.id || orderId,
        mp_item: order?.item_id || "",
        mp_merreis: rewards.merreis || "",
        mp_fragments: rewards.fragments || "",
        mp_legendary: rewards.legendaryCards || "",
        mp_pulls: pullTokens.join(","),
        mp_payment: paymentId,
        mp_message: approved && rewardText ? `Pagamento aprovado: ${rewardText}.` : ""
      });
    } catch (error) {
      redirectToPaymentReturn(res, 303, {
        mp_result: "error",
        mp_order: orderId,
        mp_message: safeText(error.message, "validation_failed", 120)
      });
    }
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
    json(res, 403, {
      ok: false,
      error: "Criacao de perfil antigo foi desativada. Use Google ou outro login social liberado."
    }, headers);
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
      }, appendSetCookie(headers, playerCookie(result.profile.playerId, req)));
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
        save: result.save,
        migratedGuestSave: Boolean(result.migratedGuestSave)
      }, appendSetCookie(headers, playerCookie(result.profile.playerId, req)));
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
    const profile = await profileForPlayer(playerId);
    if (profile) recordAccountEvent(playerId, "account:logout", {});
    json(res, 200, { ok: true }, appendSetCookie(headers, clearPlayerCookie(req)));
    return;
  }

  if (url.pathname === "/api/social") {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "GET"
      });
      return;
    }
    try {
      json(res, 200, await socialPayloadForPlayer(playerId), headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao carregar amigos."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/friends/invite") {
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
      const result = await sendFriendInvite(playerId, payload.name);
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao enviar convite."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/friends/respond") {
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
      const result = await respondFriendInvite(playerId, payload.requestId, Boolean(payload.accept));
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao responder convite."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/friends/message") {
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
      const result = await sendFriendMessage(playerId, payload.friendPlayerId, payload.message);
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao enviar mensagem."
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/social/trades/create") {
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
      const result = await createSocialTrade(playerId, payload.friendPlayerId, payload.offeredIds, payload.requestedIds);
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao criar proposta.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/social/trades/respond") {
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
      const result = await respondSocialTrade(playerId, payload.tradeId, Boolean(payload.accept));
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao responder proposta.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/social/tazzo-clash/create") {
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
      const result = await createTazzoClash(playerId, payload.friendPlayerId);
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao criar duelo de tazzos.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/social/tazzo-clash/pick") {
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
      const result = await pickTazzoClash(playerId, payload.duelId, payload.monsterIds);
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao escolher tazzos.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/social/tazzo-clash/respond") {
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
      const result = await respondTazzoClash(playerId, payload.duelId, Boolean(payload.accept));
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao responder duelo de tazzos.",
        save: error.save
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/social/tazzo-clash/hit") {
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
      const result = await hitTazzoClash(playerId, payload.duelId, payload.timingScore);
      json(res, 200, result, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao bater tazzos.",
        save: error.save
      }, headers);
    }
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

  if (url.pathname === "/api/starter-pack") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const result = await openStarterPackForPlayer(playerId);
      json(res, 200, {
        ok: true,
        playerId,
        pack: { id: "recheado", name: "Recheado" },
        pulls: result.pulls,
        alreadyComplete: Boolean(result.alreadyComplete),
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao abrir starter.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/shop/checkout") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = parseRequestPayload(req, body);
      const checkout = await createMerreisCheckoutForPlayer(playerId, payload.itemId, payload.clientRequestId, req, {
        deviceId: payload.deviceId
      });
      if (!checkout.checkoutUrl) {
        const error = new Error("Mercado Pago nao retornou URL de checkout.");
        error.status = 502;
        throw error;
      }
      redirectToExternalCheckout(res, checkout.checkoutUrl, headers);
    } catch (error) {
      redirectToPaymentReturn(res, 303, {
        mp_result: "checkout_error",
        mp_message: safeText(error.message, "Nao foi possivel abrir o checkout.", 180)
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
      const payload = parseRequestPayload(req, body);
      const result = await buyShopItemForPlayer(playerId, payload.itemId, payload.clientRequestId, req, {
        deviceId: payload.deviceId
      });
      json(res, 200, {
        ok: true,
        playerId,
        item: { id: result.item.id, name: result.item.name },
        message: result.message,
        checkout: Boolean(result.checkout),
        checkoutUrl: result.checkoutUrl || "",
        order: result.order || null,
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

  if (url.pathname === "/api/tutorial-reward") {
    if (req.method !== "POST") {
      json(res, 405, { ok: false, error: "Metodo nao permitido." }, {
        ...headers,
        Allow: "POST"
      });
      return;
    }

    try {
      await readBody(req);
      const result = await claimTutorialRewardForPlayer(playerId);
      json(res, 200, {
        ok: true,
        playerId,
        reward: result.reward,
        alreadyClaimed: Boolean(result.alreadyClaimed),
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao resgatar tutorial.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/share-link") {
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
      const result = await createShareLinkForPlayer(playerId, payload.networkId, req);
      json(res, 200, {
        ok: true,
        playerId,
        network: {
          id: result.network.id,
          name: result.network.name,
          reward: result.network.reward
        },
        shareUrl: result.shareUrl,
        validation: result.validation,
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao gerar convite.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/share-reward") {
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
      const result = await claimShareRewardForPlayer(playerId, payload.networkId);
      json(res, 200, {
        ok: true,
        playerId,
        network: {
          id: result.network.id,
          name: result.network.name,
          reward: result.network.reward
        },
        save: result.save
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao resgatar compartilhamento.",
        save: error.save || null
      }, headers);
    }
    return;
  }

  if (url.pathname === "/api/training-ai/resolve") {
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
      const result = await resolveTrainingAiForPlayer(playerId, payload);
      json(res, 200, {
        ok: true,
        playerId,
        save: result.save,
        result: result.result
      }, headers);
    } catch (error) {
      json(res, error.status || 500, {
        ok: false,
        error: error.message || "Erro ao resolver treino contra IA.",
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
        opponent: result.opponent,
        matchmaking: result.matchmaking
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
        opponent: result.opponent,
        matchmaking: result.matchmaking
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
    recordAccountEvent(playerId, "save:delete", {});
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
  const headers = securityHeaders(req);
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { ...headers, Allow: "GET, HEAD" });
    res.end("Metodo nao permitido.");
    return;
  }

  let decodedPath = "";
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch (error) {
    res.writeHead(400, headers);
    res.end("Bad request");
    return;
  }
  const relativePath = decodedPath === "/"
    ? "index.html"
    : decodedPath === "/admin" || decodedPath === "/admin/"
    ? "admin.html"
    : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (filePath !== ROOT_DIR && !filePath.startsWith(ROOT_PREFIX)) {
    res.writeHead(403, headers);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      res.writeHead(302, { ...headers, Location: "/" });
      res.end();
      return;
    }
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const cacheControl = contentType.startsWith("text/html") ? "no-store" : "public, max-age=3600";
    res.writeHead(200, {
      ...headers,
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
      res.writeHead(404, headers);
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
      json(res, status, { ok: false, error: error.message || "Erro interno." }, securityHeaders(req));
      return;
    }
    res.writeHead(status, securityHeaders(req));
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
