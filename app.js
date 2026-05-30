const {
  ASSETS,
  BACKS,
  DEFAULT_BACK_IMAGE,
  TYPES,
  RARITIES,
  TAZZO_TRADE_VALUES,
  MONSTERS,
  MONSTER_BY_ID,
  RANKS,
  TOURNAMENTS,
  SHOP_ITEMS,
  PACKS,
  MISSIONS,
  ECONOMY_REWARD_RULES,
  SOCIAL_SHARE_REWARDS,
  FRIENDS,
  BATTLE_MODES,
  BATTLE_FORMATIONS,
  BATTLE_OPPONENTS,
  TOURNAMENT_OPPONENTS,
  RANKED_OPPONENTS,
  TUTORIAL_STEPS
} = window.TAZZOMON_DATA;

const STORAGE_KEY = "tazzomon-save-v1";
const STORAGE_GUEST_KEY = `${STORAGE_KEY}:guest`;
const STORAGE_PROFILE_PREFIX = `${STORAGE_KEY}:profile:`;
const SERVER_PROFILE_ENDPOINT = "/api/profile";
const SERVER_FIREBASE_CONFIG_ENDPOINT = "/api/firebase/config";
const SERVER_FIREBASE_PROFILE_ENDPOINT = "/api/profile/firebase";
const SERVER_LEADERBOARD_ENDPOINT = "/api/leaderboard";
const SERVER_LOBBIES_ENDPOINT = "/api/lobbies";
const SERVER_SAVE_ENDPOINT = "/api/save";
const SERVER_MIGRATE_SAVE_ENDPOINT = "/api/save/migrate";
const SERVER_OPEN_PACK_ENDPOINT = "/api/open-pack";
const SERVER_STARTER_PACK_ENDPOINT = "/api/starter-pack";
const SERVER_SHOP_ENDPOINT = "/api/shop";
const SERVER_SHOP_CHECKOUT_ENDPOINT = "/api/shop/checkout";
const SERVER_SHOP_CONFIG_ENDPOINT = "/api/shop/config";
const SERVER_CRYPTO_CONFIG_ENDPOINT = "/api/crypto/config";
const SERVER_UPGRADE_ENDPOINT = "/api/upgrade";
const SERVER_CLAIM_MISSION_ENDPOINT = "/api/claim-mission";
const SERVER_TUTORIAL_REWARD_ENDPOINT = "/api/tutorial-reward";
const SERVER_SHARE_LINK_ENDPOINT = "/api/share-link";
const SERVER_SHARE_VISIT_ENDPOINT = "/api/share-visit";
const SERVER_SHARE_REWARD_ENDPOINT = "/api/share-reward";
const SERVER_TRAINING_AI_RESOLVE_ENDPOINT = "/api/training-ai/resolve";
const SERVER_TRADE_ENDPOINT = "/api/trade";
const SERVER_FRIEND_GIFT_ENDPOINT = "/api/friend-gift";
const SERVER_SOCIAL_ENDPOINT = "/api/social";
const SERVER_FRIEND_INVITE_ENDPOINT = "/api/friends/invite";
const SERVER_FRIEND_RESPOND_ENDPOINT = "/api/friends/respond";
const SERVER_FRIEND_MESSAGE_ENDPOINT = "/api/friends/message";
const SERVER_SOCIAL_TRADE_CREATE_ENDPOINT = "/api/social/trades/create";
const SERVER_SOCIAL_TRADE_RESPOND_ENDPOINT = "/api/social/trades/respond";
const SERVER_TAZZO_CLASH_CREATE_ENDPOINT = "/api/social/tazzo-clash/create";
const SERVER_TAZZO_CLASH_RESPOND_ENDPOINT = "/api/social/tazzo-clash/respond";
const SERVER_TAZZO_CLASH_PICK_ENDPOINT = "/api/social/tazzo-clash/pick";
const SERVER_TAZZO_CLASH_HIT_ENDPOINT = "/api/social/tazzo-clash/hit";
const SERVER_TELEMETRY_ENDPOINT = "/api/telemetry";
const SERVER_RANKED_START_ENDPOINT = "/api/ranked/start";
const SERVER_TOURNAMENT_START_ENDPOINT = "/api/tournament/start";
const SERVER_COMPETITIVE_RESOLVE_ENDPOINT = "/api/competitive/resolve";
const SERVER_SAVE_DEBOUNCE_MS = 450;
const CHECKOUT_SAVE_FLUSH_TIMEOUT_MS = 1200;
const CHECKOUT_NAVIGATION_FALLBACK_MS = 3000;
const CHECKOUT_RETURN_RECOVERY_MS = 1200;
const CLIENT_TELEMETRY_COOLDOWN_MS = 1000;
const ONLINE_WS_RECONNECT_MS = 2200;
const PUBLIC_GAME_SHARE_URL = "https://www.tazzostrike.com.br/";
const TODAY_KEY = new Date().toISOString().slice(0, 10);
const MISSION_PERIODS = ["daily", "weekly", "monthly"];
const MISSION_PERIOD_LABELS = {
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensal",
  album: "Album"
};
const MISSION_PERIOD_ORDER = ["daily", "weekly", "monthly", "album"];
const PACK_OPENING_DURATION_MS = 1500;
const PACK_CLOSE_AFTER_REVEAL_MS = 900;
const LEGENDARY_BOOST_TAZZOS = 50;
const LEGENDARY_BOOST_MAX_TAZZOS = 100;
const LEGENDARY_BOOST_MULTIPLIER = 2;
const LEGENDARY_BOOST_MAX_MULTIPLIER = 4;
const COMPETITIVE_MATCHMAKING_TIMEOUT_MS = 40000;
const COMPETITIVE_WIN_POINTS = 10;
const COMPETITIVE_LOSS_POINTS = 5;
const COMPETITIVE_STREAK_BONUSES = Object.freeze({
  2: 2,
  3: 4,
  4: 6,
  5: 8
});
const STARTER_PACK_ID = "recheado";
const STARTER_PROMO_ITEM_ID = "starter-bundle";
const STARTER_FIELD_SLOTS = [
  { label: "Atacante", test: (monster) => monster.types.includes("Atacante") },
  { label: "Meia", test: (monster) => monster.types.includes("Meia") },
  { label: "Zagueiro", test: (monster) => monster.role === "Zagueiro" || monster.types.includes("Defensor") }
];
const AI_ACTION_WINDUP_MS = 760;
const AI_ACTION_RESULT_MS = 820;
const ONLINE_TARGET_ACTIONS = ["move", "retreat", "swap", "dribble", "shot", "pressure"];
const ONLINE_INSTANT_ACTIONS = ["pass", "keeper"];
const REWARD_GIFT_CLOSED_ART = "assets/generated-ui/icon-gift.png";
const REWARD_GIFT_OPEN_ART = "assets/generated-ui/icon-gift-open.png";
const REWARD_GIFT_SHAKE_MS = 720;
const REWARD_CELEBRATION_TTL_MS = 4400;
const SOCIAL_NOTICE_TTL_MS = 7200;
const SOCIAL_NOTICE_STORAGE_PREFIX = "tazzomon-social-notices-v1";
const TAZZO_CLASH_PERFECT_SCORE = 0.88;
const TAZZO_CLASH_HIT_ANIMATION_MS = 1600;
const ENABLE_PLAYER_EDIT = false;
const PLAYER_TABS = new Set([
  "home",
  "battle",
  "online",
  "competitive",
  "packs",
  "collection",
  "friends",
  "trade",
  "shop",
  "missions"
]);
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
const SFX_NAMES = Object.freeze([
  "ui-click", "ui-back", "ui-confirm", "ui-error", "ui-disabled", "tab-switch", "modal-open", "modal-close", "wallet-pop",
  "pack-buy", "pack-rustle", "pack-tear", "pack-open", "snack-burst", "card-flip", "card-zoom",
  "reveal-common", "reveal-uncommon", "reveal-rare", "reveal-epic", "reveal-legendary", "reveal-mystic", "fragment-pop",
  "battle-start", "turn-start", "action-select", "target-select", "move-slide", "retreat-slide", "swap", "dribble-hit",
  "shot-kick", "pressure-push", "collision", "wall-bump", "ko", "pass-turn", "keeper-charge", "keeper-activate",
  "battle-win", "battle-lose", "battle-draw", "timer-warning",
  "tazzo-clash-invite", "tazzo-clash-accept", "tazzo-clash-coin", "tazzo-clash-hit", "tazzo-clash-perfect",
  "tazzo-clash-flip", "tazzo-clash-miss", "tazzo-clash-win", "tazzo-clash-lose",
  "coins", "purchase", "upgrade", "favorite-on", "favorite-off", "team-slot", "goalkeeper-set", "mission-claim",
  "reward-shake", "reward-open", "friend-invite", "friend-message", "trade-offer", "trade-accept", "trade-decline",
  "online-lobby", "matchmaking", "notification"
]);
const SFX_FILES = Object.freeze(Object.fromEntries(SFX_NAMES.map((name) => [name, `assets/sfx/${name}.wav`])));
const SFX_VOLUME = Object.freeze({
  "battle-start": 0.86,
  "battle-win": 0.9,
  "battle-lose": 0.72,
  "reveal-legendary": 0.9,
  "reveal-mystic": 0.92,
  "tazzo-clash-hit": 0.88,
  "tazzo-clash-perfect": 0.94,
  collision: 0.82,
  "wall-bump": 0.78,
  ko: 0.82,
  "reward-open": 0.9,
  "ui-click": 0.82,
  "tab-switch": 0.82
});
const SFX_COOLDOWN_MS = Object.freeze({
  "ui-click": 45,
  "tab-switch": 90,
  "action-select": 70,
  "target-select": 80,
  "turn-start": 220,
  "timer-warning": 900,
  notification: 260
});
const DEFAULT_SFX_VOLUME = 1;

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

function normalizeMissionCycles(cycles = {}, legacyMissionDate = TODAY_KEY) {
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

const startupLocalSave = loadSave();

const state = {
  save: startupLocalSave,
  currentTab: "home",
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
  matchmaking: { active: false, type: "", label: "", startedAt: 0 },
  packOpening: null,
  packPurchasePending: false,
  packOpeningTimers: [],
  packReveal: [],
  starter: {
    loading: false,
    opening: false,
    reveal: [],
    message: ""
  },
  tutorialResult: null,
  tutorialExpanded: false,
  missionClaimPending: false,
  tutorialRewardPending: false,
  shareRewardPending: "",
  shareRewardMessage: "",
  incomingShareHandled: false,
  rewardCelebration: null,
  rewardCelebrationTimers: [],
  tradeLog: [],
  competitiveLog: [],
  leaderboard: { rows: [], loading: false, loadedAt: 0, error: "" },
  social: {
    friends: [],
    incomingInvites: [],
    outgoingInvites: [],
    messages: [],
    trades: [],
    clashes: [],
    loading: false,
    loadedAt: 0,
    error: "",
    message: "",
    inviteName: "",
    selectedFriendId: "",
    draftMessage: "",
    tradeFriendId: "",
    tradeDraft: { offerIds: [], requestIds: [] },
    clashFriendId: "",
    clashDraft: { offerIds: [], requestIds: [] },
    clashPickDrafts: {},
    clashAnimation: null,
    notices: [],
    notifiedTradeKeys: [],
    noticeHydratedFor: ""
  },
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
  shopPayments: {
    checked: false,
    configured: false,
    message: "Checando Mercado Pago...",
    checkoutPending: false,
    checkoutStartedAt: 0,
    checkoutFallbackTimer: null
  },
  shopRewardReveal: null,
  crypto: {
    checked: false,
    enabled: false,
    sandbox: true,
    message: "Checando MerreisCoin testnet...",
    network: null,
    token: null
  },
  battle: null,
  battleSceneOpen: false,
  music: { audio: null, isPlaying: false, autoplayArmed: false, collapsed: false },
  telemetry: { sessionId: "", lastSent: {} },
  sfx: {
    cache: new Map(),
    buffers: new Map(),
    loading: new Map(),
    active: new Set(),
    context: null,
    lastPlayed: {},
    unlocked: false
  },
  server: {
    enabled: false,
    loading: false,
    playerId: "",
    profile: null,
    profileMode: "login",
    profileMessage: "",
    profileMessageType: "info",
    saveTimer: null,
    saveEpoch: 0,
    startupSave: cloneSave(startupLocalSave),
    localChangedWhileLoading: false,
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
    sfxVolume: DEFAULT_SFX_VOLUME,
    tutorial: Object.fromEntries(TUTORIAL_STEPS.map((step) => [step.id, false])),
    tutorialRewardClaimed: false,
    missionDate: TODAY_KEY,
    missionCycles: currentMissionCycles(),
    dailyEconomy: defaultDailyEconomyRewards(),
    missions: defaultMissionStatuses()
  };
}

function localSaveStorageKey(playerId = "", profile = null) {
  const profilePlayerId = String(profile?.playerId || playerId || "").trim();
  if (canUseServerSave()) {
    return profile && profilePlayerId ? `${STORAGE_PROFILE_PREFIX}${profilePlayerId}` : STORAGE_GUEST_KEY;
  }
  return STORAGE_KEY;
}

function readStoredSave(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? normalizeSave(JSON.parse(raw)) : null;
  } catch (error) {
    return null;
  }
}

function loadSave() {
  const key = canUseServerSave() ? STORAGE_GUEST_KEY : STORAGE_KEY;
  return readStoredSave(key) || defaultSave();
}

function cloneSave(save) {
  try {
    return JSON.parse(JSON.stringify(save || defaultSave()));
  } catch (error) {
    return defaultSave();
  }
}

function cosmeticItem(itemOrId) {
  if (!itemOrId) return null;
  if (typeof itemOrId === "object") return itemOrId;
  return SHOP_ITEMS.find((item) => item.id === itemOrId) || null;
}

function cosmeticSlot(itemOrId) {
  const item = cosmeticItem(itemOrId);
  return item?.cosmeticSlot || "profile";
}

function cosmeticSlotLabel(itemOrId) {
  const item = cosmeticItem(itemOrId);
  return item?.slotLabel || {
    team: "Time",
    album: "Album",
    pack: "Pacotinho",
    profile: "Perfil"
  }[cosmeticSlot(item)] || "Perfil";
}

function sanitizeEquippedCosmetics(equipped = {}, cosmetics = {}, legacySelected = null) {
  const next = {};
  const source = equipped && typeof equipped === "object" && !Array.isArray(equipped) ? equipped : {};
  Object.entries(source).forEach(([slot, itemId]) => {
    const item = cosmeticItem(itemId);
    if (item && item.type !== "merreis" && cosmeticSlot(item) === slot && cosmetics?.[item.id]) {
      next[slot] = item.id;
    }
  });

  const legacyItem = cosmeticItem(legacySelected);
  if (legacyItem && legacyItem.type !== "merreis" && cosmetics?.[legacyItem.id]) {
    const slot = cosmeticSlot(legacyItem);
    if (!next[slot]) next[slot] = legacyItem.id;
  }
  return next;
}

function sanitizeShareRewards(rewards = {}) {
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
      .map(([id, claimedAt]) => [id, String(claimedAt).slice(0, 64)])
  );
}

function sanitizeShareValidations(validations = {}) {
  if (!validations || typeof validations !== "object" || Array.isArray(validations)) return {};
  const validIds = new Set(SOCIAL_SHARE_REWARDS.map((item) => item.id));
  return Object.fromEntries(
    Object.entries(validations).map(([id, raw]) => {
      const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      return [id, {
        requestedAt: String(record.requestedAt || "").slice(0, 64),
        validatedAt: String(record.validatedAt || "").slice(0, 64),
        visitorPlayerId: String(record.visitorPlayerId || "").slice(0, 64)
      }];
    }).filter(([id, record]) => (
      validIds.has(id)
      && (record.requestedAt || record.validatedAt || record.visitorPlayerId)
    ))
  );
}

function sanitizeOneTimePurchases(purchases = {}) {
  if (!purchases || typeof purchases !== "object" || Array.isArray(purchases)) return {};
  const oneTimeIds = new Set(SHOP_ITEMS.filter((item) => item.oneTime).map((item) => item.id));
  return Object.fromEntries(
    Object.entries(purchases)
      .filter(([id, purchasedAt]) => oneTimeIds.has(id) && purchasedAt)
      .map(([id, purchasedAt]) => [id, String(purchasedAt).slice(0, 64)])
  );
}

function equipCosmetic(itemId) {
  const item = cosmeticItem(itemId);
  if (!item || item.type === "merreis" || !state.save.cosmetics?.[item.id]) return false;
  const equipped = sanitizeEquippedCosmetics(state.save.equippedCosmetics, state.save.cosmetics, state.save.selectedCosmetic);
  equipped[cosmeticSlot(item)] = item.id;
  state.save.equippedCosmetics = equipped;
  state.save.selectedCosmetic = item.id;
  return true;
}

function isCosmeticEquipped(itemId) {
  const item = cosmeticItem(itemId);
  if (!item || item.type === "merreis") return false;
  const equipped = sanitizeEquippedCosmetics(state.save.equippedCosmetics, state.save.cosmetics, state.save.selectedCosmetic);
  return equipped[cosmeticSlot(item)] === item.id;
}

function normalizeFieldCosmetics(cosmetics = {}) {
  if (!cosmetics || typeof cosmetics !== "object" || Array.isArray(cosmetics)) return {};
  const normalized = {};
  Object.entries(cosmetics).forEach(([slot, itemId]) => {
    const item = cosmeticItem(itemId);
    if (item && item.type !== "merreis" && cosmeticSlot(item) === slot) {
      normalized[slot] = item.id;
    }
  });
  return normalized;
}

function activeFieldCosmeticsForSave(save = state.save) {
  return sanitizeEquippedCosmetics(save.equippedCosmetics, save.cosmetics, save.selectedCosmetic);
}

function fieldCosmeticsForSide(side) {
  const onlineCosmetics = state.battle?.online?.cosmetics?.[side];
  if (onlineCosmetics) return normalizeFieldCosmetics(onlineCosmetics);
  return side === "player" ? activeFieldCosmeticsForSave() : {};
}

function fieldCosmeticsForPiece(piece) {
  return normalizeFieldCosmetics(piece?.cosmetics || fieldCosmeticsForSide(piece?.side));
}

function fieldCosmeticClasses(cosmetics = {}) {
  const normalized = normalizeFieldCosmetics(cosmetics);
  return Object.values(normalized)
    .map((itemId) => `field-cosmetic-${itemId}`)
    .join(" ");
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

function normalizeSave(rawSave) {
  try {
    const save = migrateLegacySave(rawSave || defaultSave());
    const customTazzos = sanitizeCustomCatalog(save.customTazzos || []);
    applyCustomCatalog(customTazzos);
    const fresh = defaultSave();
    const collection = sanitizeCollection(save.collection || {});
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
    const savedTutorial = save.tutorial && typeof save.tutorial === "object" ? save.tutorial : {};
    const tutorial = Object.fromEntries(TUTORIAL_STEPS.map((step) => [
      step.id,
      Boolean(savedTutorial[step.id] || fresh.tutorial[step.id] || (save.tutorialRewardClaimed && !Object.prototype.hasOwnProperty.call(savedTutorial, step.id)))
    ]));
    const cosmetics = { ...fresh.cosmetics, ...(save.cosmetics || {}) };
    const equippedCosmetics = sanitizeEquippedCosmetics(save.equippedCosmetics || fresh.equippedCosmetics, cosmetics, save.selectedCosmetic);
    const merged = {
      ...fresh,
      ...save,
      collection,
      starterOnboardingComplete,
      starterPackCards: Array.isArray(save.starterPackCards) ? save.starterPackCards.filter((id) => MONSTER_BY_ID[id]).filter(unique) : fresh.starterPackCards,
      starterPackOpenedAt: save.starterPackOpenedAt || fresh.starterPackOpenedAt,
      upgrades: { ...fresh.upgrades, ...(save.upgrades || {}) },
      packPity: sanitizePackPity(save.packPity || fresh.packPity),
      cosmetics,
      equippedCosmetics,
      selectedCosmetic: Object.values(equippedCosmetics)[0] || (cosmetics?.[save.selectedCosmetic] ? save.selectedCosmetic : fresh.selectedCosmetic),
      oneTimePurchases: sanitizeOneTimePurchases(save.oneTimePurchases || fresh.oneTimePurchases),
      friendGifts: { ...fresh.friendGifts, ...(save.friendGifts || {}) },
      shareValidations: sanitizeShareValidations(save.shareValidations || fresh.shareValidations),
      shareRewards: sanitizeShareRewards(save.shareRewards || fresh.shareRewards),
      wishlist: sanitizeWishlist({ ...fresh.wishlist, ...(save.wishlist || {}) }),
      customTazzos,
      tutorial,
      missions,
      missionCycles: savedMissionCycles,
      dailyEconomy: normalizeDailyEconomyRewards(save.dailyEconomy || save.dailyRewards || {}, savedMissionCycles.daily),
      team: normalizeTeam(save.team || fresh.team, collection),
      goalkeeper: normalizeGoalkeeper(save.goalkeeper || (save.team || []).find((id) => isGoalkeeper(id)) || fresh.goalkeeper, collection)
    };
    merged.musicTrackIndex = clamp(Math.floor(Number(merged.musicTrackIndex)) || 0, 0, Math.max(0, MUSIC_TRACKS.length - 1));
    merged.musicVolume = clamp(Number(merged.musicVolume), 0, 1);
    if (!Number.isFinite(merged.musicVolume)) merged.musicVolume = fresh.musicVolume;
    merged.sfxVolume = clamp(Number(merged.sfxVolume), 0, 1);
    if (!Number.isFinite(merged.sfxVolume)) merged.sfxVolume = fresh.sfxVolume;
    merged.trophies = Math.max(0, Math.floor(Number(merged.trophies)) || 0);
    merged.rankFloor = Math.max(0, Math.floor(Number(merged.rankFloor)) || 0, currentRankForPoints(merged.trophies).min);
    merged.trophies = Math.max(merged.rankFloor, merged.trophies);
    merged.competitiveWinStreak = Math.max(0, Math.floor(Number(merged.competitiveWinStreak)) || 0);

    merged.missions = resetExpiredMissions(merged.missions, fresh.missions, savedMissionCycles);
    merged.missionCycles = currentMissionCycles();
    merged.dailyEconomy = normalizeDailyEconomyRewards(merged.dailyEconomy, merged.missionCycles.daily);
    merged.missionDate = TODAY_KEY;

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
    + (Number(normalized.rankFloor) || 0)
    + (Number(normalized.competitiveWinStreak) || 0) * 20
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

function ensureDailyEconomyRewards() {
  state.save.dailyEconomy = normalizeDailyEconomyRewards(state.save.dailyEconomy || {});
  return state.save.dailyEconomy;
}

function awardTrainingAiMerreis() {
  const economy = ensureDailyEconomyRewards();
  const rule = ECONOMY_REWARD_RULES.trainingAi;
  if (economy.trainingAiMatches >= rule.dailyMatches) {
    return { amount: 0, capped: true, used: economy.trainingAiMatches, limit: rule.dailyMatches };
  }
  economy.trainingAiMatches += 1;
  state.save.merreis += rule.merreis;
  return { amount: rule.merreis, capped: false, used: economy.trainingAiMatches, limit: rule.dailyMatches };
}

async function resolveTrainingAiBattleRewards(outcome) {
  if (hasOnlineProfile()) {
    try {
      const payload = await postServerMutation(SERVER_TRAINING_AI_RESOLVE_ENDPOINT, { outcome }, "Treino");
      return payload.result || {
        status: "Treino contra IA concluido.",
        rewards: []
      };
    } catch (error) {
      return {
        status: error.message || "Treino contra IA sem recompensa do servidor.",
        rewards: []
      };
    }
  }

  const reward = awardTrainingAiMerreis();
  if (reward.amount) {
    return {
      status: `Treino contra IA concluido. +${reward.amount} Merreis (${reward.used}/${reward.limit} hoje)`,
      rewards: [`+${reward.amount} Merreis`]
    };
  }
  return {
    status: "Treino contra IA concluido. Limite diario de Merreis atingido.",
    rewards: ["Limite diario de treino atingido"]
  };
}

function awardRankedWinMerreis() {
  const economy = ensureDailyEconomyRewards();
  const rule = ECONOMY_REWARD_RULES.rankedWin;
  const remaining = Math.max(0, rule.dailyMerreisCap - economy.rankedWinMerreis);
  const amount = Math.min(rule.merreis, remaining);
  if (!amount) return { amount: 0, capped: true, earnedToday: economy.rankedWinMerreis, cap: rule.dailyMerreisCap };
  economy.rankedWinMerreis += amount;
  state.save.merreis += amount;
  return { amount, capped: economy.rankedWinMerreis >= rule.dailyMerreisCap, earnedToday: economy.rankedWinMerreis, cap: rule.dailyMerreisCap };
}

function dailyEconomyStats() {
  const economy = ensureDailyEconomyRewards();
  const trainingRule = ECONOMY_REWARD_RULES.trainingAi;
  const rankedRule = ECONOMY_REWARD_RULES.rankedWin;
  const trainingUsed = clamp(Number(economy.trainingAiMatches) || 0, 0, trainingRule.dailyMatches);
  const rankedEarned = clamp(Number(economy.rankedWinMerreis) || 0, 0, rankedRule.dailyMerreisCap);
  return {
    dateKey: economy.dateKey,
    training: {
      used: trainingUsed,
      limit: trainingRule.dailyMatches,
      merreis: trainingRule.merreis,
      remaining: Math.max(0, trainingRule.dailyMatches - trainingUsed),
      percent: Math.round((trainingUsed / trainingRule.dailyMatches) * 100)
    },
    ranked: {
      earned: rankedEarned,
      cap: rankedRule.dailyMerreisCap,
      merreis: rankedRule.merreis,
      remaining: Math.max(0, rankedRule.dailyMerreisCap - rankedEarned),
      winsRemaining: Math.ceil(Math.max(0, rankedRule.dailyMerreisCap - rankedEarned) / rankedRule.merreis),
      percent: Math.round((rankedEarned / rankedRule.dailyMerreisCap) * 100)
    }
  };
}

function socialShareRewardById(id) {
  return SOCIAL_SHARE_REWARDS.find((item) => item.id === id) || null;
}

function shareRewardClaimed(id) {
  return Boolean(state.save.shareRewards?.[id]);
}

function shareRewardValidated(id) {
  return Boolean(state.save.shareValidations?.[id]?.validatedAt);
}

function shareRewardRequested(id) {
  return Boolean(state.save.shareValidations?.[id]?.requestedAt);
}

function baseGameShareUrl() {
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return `${window.location.origin}/`;
  }
  if (/tazzostrike\.com\.br$/i.test(window.location.hostname)) {
    return `${window.location.origin}/`;
  }
  return PUBLIC_GAME_SHARE_URL;
}

function gameShareUrl(network = {}) {
  const url = new URL(baseGameShareUrl());
  if (network.id && state.server.playerId) {
    url.searchParams.set("ref", state.server.playerId);
    url.searchParams.set("share", network.id);
  }
  return url.toString();
}

function gameShareText(network = {}) {
  const suffix = network.id === "discord" ? "entra no meu time por aqui" : "vem montar seu time comigo";
  return `Tazzo Strike ta no ar: ${suffix}!`;
}

function socialShareHref(network) {
  const url = gameShareUrl(network);
  const text = gameShareText(network);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedTextWithUrl = encodeURIComponent(`${text} ${url}`);
  if (network.id === "twitter") return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  if (network.id === "whatsapp") return `https://wa.me/?text=${encodedTextWithUrl}`;
  if (network.id === "telegram") return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  if (network.id === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  if (network.id === "reddit") return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
  return url;
}

function copyShareTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "true");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand("copy");
  } catch (error) {
    // Copy is a convenience for Discord; the reward flow still opens the target.
  }
  input.remove();
}

function openSocialShare(network) {
  const url = gameShareUrl(network);
  const text = `${gameShareText(network)} ${url}`;
  playSfx("friend-invite");
  if (network.id === "discord") {
    copyShareTextToClipboard(text);
    window.open("https://discord.com/channels/@me", "_blank", "noopener,noreferrer");
    return;
  }
  window.open(socialShareHref(network), "_blank", "noopener,noreferrer");
}

function incomingShareVisit() {
  const params = new URLSearchParams(window.location.search);
  const ownerPlayerId = params.get("ref") || params.get("shareRef") || "";
  const networkId = params.get("share") || params.get("shareNet") || "";
  if (!ownerPlayerId || !socialShareRewardById(networkId)) return null;
  return { ownerPlayerId, networkId };
}

async function registerIncomingShareVisit() {
  const visit = incomingShareVisit();
  if (!visit || state.incomingShareHandled || !canUseServerSave()) return;
  state.incomingShareHandled = true;
  try {
    await fetch(SERVER_SHARE_VISIT_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visit)
    });
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    url.searchParams.delete("share");
    url.searchParams.delete("shareRef");
    url.searchParams.delete("shareNet");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  } catch (error) {
    // Share visits are best-effort; the player should not be blocked by tracking.
  }
}

async function shareGameForReward(networkId) {
  const network = socialShareRewardById(networkId);
  if (!network || state.shareRewardPending) return;
  if (shareRewardClaimed(network.id)) {
    state.shareRewardMessage = `${network.name} ja foi resgatado.`;
    renderMissions();
    return;
  }
  if (!requireOnlineProfile("Entre em uma conta para resgatar recompensas de compartilhamento.")) return;

  state.shareRewardPending = network.id;
  state.shareRewardMessage = shareRewardValidated(network.id)
    ? `Validado no ${network.name}. Resgatando...`
    : `Abrindo ${network.name}...`;
  renderMissions();

  try {
    if (shareRewardValidated(network.id)) {
      const payload = await postServerMutation(SERVER_SHARE_REWARD_ENDPOINT, { networkId: network.id }, "Resgatando");
      const reward = Number(payload.network?.reward || network.reward) || 0;
      state.shareRewardMessage = `${network.name} resgatado: +${formatNumber(reward)} Merreis.`;
      showRewardCelebration({
        title: "Compartilhamento validado",
        message: `Uma visita pelo seu link liberou a recompensa.`,
        rewards: [`${formatNumber(reward)} Merreis`]
      });
    } else {
      openSocialShare(network);
      await postServerMutation(SERVER_SHARE_LINK_ENDPOINT, { networkId: network.id }, "Compartilhando");
      state.shareRewardMessage = `Link do ${network.name} copiado/aberto. A recompensa libera quando alguem abrir seu convite.`;
    }
  } catch (error) {
    state.shareRewardMessage = error.message || "Nao foi possivel resgatar essa rede agora.";
  } finally {
    state.shareRewardPending = "";
    renderAll();
  }
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

function normalizeTeam(team, collection = state?.save?.collection || {}) {
  const available = Array.isArray(team)
    ? team.filter((id) => collection[id] > 0 && MONSTER_BY_ID[id] && !isGoalkeeper(id))
    : [];
  const fallback = ["andreas-pereira-tazzo", "alex-sandro-tazzo", "wendell-tazzo"]
    .filter((id) => collection[id] > 0 && MONSTER_BY_ID[id] && !isGoalkeeper(id));
  return [...available, ...fallback].filter(unique).slice(0, 3);
}

function normalizeGoalkeeper(id, collection = state?.save?.collection || {}) {
  const goalkeepers = goalkeeperMonsters();
  if (id && collection[id] > 0 && MONSTER_BY_ID[id] && isGoalkeeper(id)) return id;
  return goalkeepers.find((monster) => collection[monster.id] > 0)?.id || "";
}

function sanitizeCollection(collection = {}) {
  return Object.fromEntries(
    Object.entries(collection)
      .filter(([id]) => MONSTER_BY_ID[id])
      .map(([id, count]) => [id, Math.max(0, Number(count) || 0)])
  );
}

function sanitizeWishlist(wishlist = {}) {
  if (!wishlist || typeof wishlist !== "object" || Array.isArray(wishlist)) return {};
  return Object.fromEntries(
    Object.entries(wishlist)
      .filter(([id, wanted]) => MONSTER_BY_ID[id] && Boolean(wanted))
      .map(([id]) => [id, true])
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

function escapeHtmlAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cssImageUrl(value) {
  const url = String(value || "")
    .replace(/\\/g, "/")
    .replace(/"/g, "%22")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
  return `url("${url}")`;
}

function shouldRenderRarityGloss(monster, options = {}) {
  const revealPremiumGloss = options.revealPremiumGloss !== undefined
    ? options.revealPremiumGloss !== false
    : options.revealHolographic !== false;
  return Boolean(revealPremiumGloss && monster?.image && isAtLeastRarity(monster.rarity, "Epico"));
}

function rarityGlossClass(monster, options = {}) {
  return shouldRenderRarityGloss(monster, options) ? " rarity-gloss-art" : "";
}

function rarityGlossStyleAttr(monster, options = {}) {
  if (!shouldRenderRarityGloss(monster, options)) return "";
  return ` style="--tazzo-gloss-mask: ${escapeHtmlAttribute(cssImageUrl(monster.image))};"`;
}

function rarityGlossLayer(monster, options = {}) {
  return shouldRenderRarityGloss(monster, options) ? `<span class="rarity-gloss-sweep" aria-hidden="true"></span>` : "";
}

function renderMonsterArt(monster, className, options = {}) {
  const loadingAttr = options.loading ? ` loading="${options.loading}"` : "";
  const revealHolographic = options.revealHolographic !== false;
  const glossOptions = { ...options, revealPremiumGloss: options.revealPremiumGloss ?? revealHolographic };
  const glossClass = rarityGlossClass(monster, glossOptions);
  const glossStyle = rarityGlossStyleAttr(monster, glossOptions);
  const glossLayer = rarityGlossLayer(monster, glossOptions);
  const monsterName = escapeHtmlAttribute(monster.name);
  if (!revealHolographic || !hasHolographicArt(monster)) {
    if (!glossLayer) {
      return `<img class="${className}"${loadingAttr} src="${monster.image}" alt="${monsterName}">`;
    }

    return `
      <span class="${className}${glossClass}"${glossStyle} role="img" aria-label="${monsterName}">
        <img class="rarity-gloss-image"${loadingAttr} src="${monster.image}" alt="">
        ${glossLayer}
      </span>
    `;
  }

  return `
    <span class="holo-art ${className}${glossClass}"${glossStyle} data-holo-art role="img" aria-label="${monsterName}">
      <img class="holo-art-layer holo-art-base"${loadingAttr} src="${monster.image}" alt="">
      <img class="holo-art-layer holo-art-alt"${loadingAttr} src="${monsterHoloImage(monster)}" alt="">
      <span class="holo-art-foil" aria-hidden="true"></span>
      ${glossLayer}
    </span>
  `;
}

function renderViewerFrontArt(monster, revealHolographic = true) {
  const glossOptions = { revealHolographic, revealPremiumGloss: revealHolographic };
  const glossClass = rarityGlossClass(monster, glossOptions);
  const glossStyle = rarityGlossStyleAttr(monster, glossOptions);
  const glossLayer = rarityGlossLayer(monster, glossOptions);
  const monsterName = escapeHtmlAttribute(monster.name);
  if (!revealHolographic || !hasHolographicArt(monster)) {
    if (!glossLayer) {
      return `<img class="viewer-face viewer-face-front" src="${monster.image}" alt="${monsterName}">`;
    }

    return `
      <div class="viewer-face viewer-face-front${glossClass}"${glossStyle} role="img" aria-label="${monsterName}">
        <img class="rarity-gloss-image" src="${monster.image}" alt="">
        ${glossLayer}
      </div>
    `;
  }

  return `
    <div class="viewer-face viewer-face-front holo-art holo-art-viewer${glossClass}"${glossStyle} data-holo-art role="img" aria-label="${monsterName}">
      <img class="holo-art-layer holo-art-base" src="${monster.image}" alt="">
      <img class="holo-art-layer holo-art-alt" src="${monsterHoloImage(monster)}" alt="">
      <span class="holo-art-foil" aria-hidden="true"></span>
      ${glossLayer}
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
  if (profile.authProvider === "firebase") return profile.authLabel || "Login social";
  return "Perfil antigo";
}

function profileMetaText(profile) {
  if (!profile) return "Save anonimo sincronizado neste navegador.";
  if (profile.authProvider === "firebase") {
    const provider = profile.authLabel || "login social";
    return profile.authEmail
      ? `Conta ${provider} conectada: ${profile.authEmail}`
      : `Conta ${provider} conectada. Colecao, Merreis e partidas salvas no servidor.`;
  }
  return "Colecao, Merreis e progresso salvos no servidor.";
}

function nextCatalogNumber() {
  return MONSTERS.reduce((max, monster) => Math.max(max, Number(monster.number) || 0), 0) + 1;
}

function saveGame() {
  if (canUseServerSave() && !state.server.profile) {
    state.server.entryGatePaused = false;
    renderEntryGate();
    return;
  }
  persistLocalSave();
  queueServerSave();
}

function persistLocalSave(options = {}) {
  try {
    const playerId = Object.prototype.hasOwnProperty.call(options, "playerId") ? options.playerId : state.server.playerId;
    const profile = Object.prototype.hasOwnProperty.call(options, "profile") ? options.profile : state.server.profile;
    const key = localSaveStorageKey(playerId, profile);
    localStorage.setItem(key, JSON.stringify(state.save));
    if (canUseServerSave() && key !== STORAGE_KEY) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    setServerStatus("error", "Local cheio");
  }
}

function canUseServerSave() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function telemetrySessionId() {
  if (!state.telemetry.sessionId) {
    state.telemetry.sessionId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  return state.telemetry.sessionId;
}

function compactTelemetryValue(value, depth = 0) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.slice(0, 180);
  if (Array.isArray(value)) {
    if (depth > 1) return `[${value.length}]`;
    return value.slice(0, 12).map((item) => compactTelemetryValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    if (depth > 1) return "[object]";
    return Object.fromEntries(Object.entries(value).slice(0, 18).map(([key, item]) => [
      String(key).slice(0, 40),
      compactTelemetryValue(item, depth + 1)
    ]));
  }
  return String(value ?? "").slice(0, 80);
}

function trackTelemetry(type, data = {}, options = {}) {
  if (!canUseServerSave() || !state.server.enabled) return;
  const eventType = String(type || "event").trim().slice(0, 64);
  if (!eventType) return;
  const now = Date.now();
  const cooldown = Number.isFinite(Number(options.cooldown)) ? Number(options.cooldown) : CLIENT_TELEMETRY_COOLDOWN_MS;
  const dedupeKey = options.dedupeKey || eventType;
  if (cooldown > 0 && now - (state.telemetry.lastSent[dedupeKey] || 0) < cooldown) return;
  state.telemetry.lastSent[dedupeKey] = now;
  const step = currentTutorialStep();
  const payload = {
    type: eventType,
    data: compactTelemetryValue({
      ...data,
      tab: state.currentTab,
      tutorialStep: step?.id || "",
      profile: Boolean(state.server.profile),
      sessionId: telemetrySessionId()
    })
  };
  fetch(SERVER_TELEMETRY_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

function handlePaymentReturnNotice() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get("mp_result");
  if (!result) return;
  const merreis = Math.max(0, Math.floor(Number(params.get("mp_merreis"))) || 0);
  const fragments = Math.max(0, Math.floor(Number(params.get("mp_fragments"))) || 0);
  const legendaryCards = Math.max(0, Math.floor(Number(params.get("mp_legendary"))) || 0);
  const itemId = params.get("mp_item") || "";
  const pulls = parsePaymentReturnPulls(params.get("mp_pulls"));
  const message = params.get("mp_message") || "";
  if (result === "approved") {
    if (message) {
      state.shopMessage = message;
    } else {
      const rewards = [
        merreis ? `+${formatNumber(merreis)} Merreis` : "",
        fragments ? `+${formatNumber(fragments)} fragmentos` : "",
        legendaryCards ? `${formatNumber(legendaryCards)} lendario(s)` : ""
      ].filter(Boolean).join(", ");
      state.shopMessage = rewards ? `Pagamento aprovado: ${rewards}.` : "Pagamento aprovado. Seus itens foram creditados.";
    }
    if (itemId === STARTER_PROMO_ITEM_ID) {
      state.save.oneTimePurchases = { ...(state.save.oneTimePurchases || {}), [itemId]: new Date().toISOString() };
    }
    if (pulls.length) {
      state.shopRewardReveal = {
        itemId,
        title: itemId === STARTER_PROMO_ITEM_ID ? "Pacote iniciante resgatado!" : "Tazzos recebidos!",
        message: state.shopMessage,
        pulls
      };
      playSfx("reveal-legendary", { volume: 0.86 });
    }
  } else if (result === "pending") {
    state.shopMessage = "Pagamento pendente. Os Merreis caem quando o Mercado Pago aprovar.";
  } else if (result === "error") {
    state.shopMessage = "Nao foi possivel validar o pagamento agora. O webhook ainda pode creditar automaticamente.";
  } else if (result === "checkout_error") {
    state.shopMessage = params.get("mp_message") || "Nao foi possivel abrir o checkout do Mercado Pago.";
  } else {
    state.shopMessage = "Pagamento nao aprovado. Nenhum Merreis foi creditado.";
  }
  params.delete("mp_result");
  params.delete("mp_order");
  params.delete("mp_merreis");
  params.delete("mp_fragments");
  params.delete("mp_legendary");
  params.delete("mp_item");
  params.delete("mp_pulls");
  params.delete("mp_payment");
  params.delete("mp_message");
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
}

function parsePaymentReturnPulls(value) {
  return String(value || "")
    .split(",")
    .map((token) => {
      const [monsterId, isNewToken] = token.split(":");
      const id = String(monsterId || "").trim();
      if (!MONSTER_BY_ID[id]) return null;
      return {
        monsterId: id,
        isNew: isNewToken !== "0",
        fragments: 0,
        revealed: true
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

async function loadShopPaymentConfig() {
  if (!canUseServerSave()) {
    state.shopPayments = {
      checked: true,
      configured: false,
      message: "Abra pelo servidor para comprar Merreis com Mercado Pago.",
      checkoutPending: false
    };
    renderShop();
    return;
  }
  try {
    const response = await fetch(SERVER_SHOP_CONFIG_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    const mercadoPago = payload.mercadoPago || {};
    state.shopPayments = {
      checked: true,
      configured: Boolean(response.ok && mercadoPago.configured),
      message: mercadoPago.message || "Compra de Merreis indisponivel.",
      checkoutPending: false
    };
  } catch (error) {
    state.shopPayments = {
      checked: true,
      configured: false,
      message: "Nao foi possivel checar Mercado Pago.",
      checkoutPending: false
    };
  }
  renderShop();
}

async function loadCryptoConfig() {
  if (!canUseServerSave()) {
    state.crypto = {
      checked: true,
      enabled: false,
      sandbox: true,
      message: "Abra pelo servidor para ver MerreisCoin testnet.",
      network: null,
      token: null
    };
    renderShop();
    return;
  }
  try {
    const response = await fetch(SERVER_CRYPTO_CONFIG_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    const merreisCoin = payload.merreisCoin || {};
    state.crypto = {
      checked: true,
      enabled: Boolean(response.ok && merreisCoin.enabled),
      sandbox: merreisCoin.sandbox !== false,
      message: merreisCoin.message || "MerreisCoin testnet indisponivel.",
      network: merreisCoin.network || null,
      token: merreisCoin.token || null
    };
  } catch (error) {
    state.crypto = {
      checked: true,
      enabled: false,
      sandbox: true,
      message: "Nao foi possivel checar MerreisCoin testnet.",
      network: null,
      token: null
    };
  }
  renderShop();
}

function hasOnlineProfile() {
  return Boolean(canUseServerSave() && state.server.enabled && state.server.profile);
}

function requireOnlineProfile(message = "Entre em uma conta para continuar jogando.") {
  if (hasOnlineProfile()) return true;
  state.server.entryGatePaused = false;
  state.firebase.message = message;
  setProfileMessage(message, "error");
  renderEntryGate();
  return false;
}

function beginServerIdentityTransition() {
  state.server.saveEpoch += 1;
  window.clearTimeout(state.server.saveTimer);
  state.server.saveTimer = null;
  state.server.localChangedWhileLoading = false;
}

function isCurrentServerRequest(epoch, playerId = state.server.playerId) {
  return epoch === state.server.saveEpoch && playerId === state.server.playerId;
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
  const requestEpoch = state.server.saveEpoch;
  try {
    const response = await fetch(SERVER_SAVE_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Servidor indisponivel");
    const payload = await response.json();
    if (requestEpoch !== state.server.saveEpoch) return;
    state.server.enabled = true;
    state.server.loading = false;
    state.server.playerId = payload.playerId || "";
    applyProfile(payload.profile);
    registerIncomingShareVisit();
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
      trackTelemetry("session:ready", {
        source: payload.profile ? "profile" : "guest",
        starterComplete: Boolean(state.save.starterOnboardingComplete)
      }, { dedupeKey: "session:ready", cooldown: 0 });
      return;
    }

    if (requestEpoch === state.server.saveEpoch) await pushServerSave();
  } catch (error) {
    if (requestEpoch !== state.server.saveEpoch) return;
    state.server.enabled = false;
    state.server.loading = false;
    disconnectOnlineSocket();
    setServerStatus("error", "Local");
  }
}

async function migrateServerSave(save) {
  const requestEpoch = state.server.saveEpoch;
  try {
    const response = await fetch(SERVER_MIGRATE_SAVE_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save })
    });
    const payload = await response.json().catch(() => ({}));
    if (requestEpoch !== state.server.saveEpoch) return true;
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
    applyProfile(payload.profile);
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    state.server.localChangedWhileLoading = false;
    setServerStatus("online", "Migrado");
    renderAll();
    trackTelemetry("session:migrated", {
      source: payload.profile ? "profile" : "guest",
      starterComplete: Boolean(state.save.starterOnboardingComplete)
    }, { dedupeKey: "session:migrated", cooldown: 0 });
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
  if (!state.server.enabled || !state.server.profile) {
    updateServerStatus();
    return;
  }
  window.clearTimeout(state.server.saveTimer);
  setServerStatus("syncing", "Salvando");
  state.server.saveTimer = window.setTimeout(pushServerSave, SERVER_SAVE_DEBOUNCE_MS);
}

async function pushServerSave() {
  if (!state.server.enabled || !state.server.profile) return;
  const requestEpoch = state.server.saveEpoch;
  const requestPlayerId = state.server.playerId;
  const requestProfile = state.server.profile;
  const saveSnapshot = cloneSave(state.save);
  window.clearTimeout(state.server.saveTimer);
  state.server.saveTimer = null;
  setServerStatus("syncing", "Salvando");
  try {
    const response = await fetch(SERVER_SAVE_ENDPOINT, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: saveSnapshot })
    });
    if (!response.ok) throw new Error("Falha ao salvar no servidor");
    const payload = await response.json();
    if (!isCurrentServerRequest(requestEpoch, requestPlayerId)) return;
    state.server.playerId = payload.playerId || state.server.playerId;
    if ("profile" in payload) applyProfile(payload.profile);
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave({
        playerId: payload.playerId || requestPlayerId,
        profile: Object.prototype.hasOwnProperty.call(payload, "profile") ? payload.profile : requestProfile
      });
    }
    state.server.localChangedWhileLoading = false;
    setServerStatus("online", payload.ignoredProtectedFields?.length ? "Protegido" : "Salvo");
  } catch (error) {
    if (!isCurrentServerRequest(requestEpoch, requestPlayerId)) return;
    setServerStatus("error", "Local");
  }
}

async function postServerMutation(endpoint, body, statusLabel) {
  if (!requireOnlineProfile()) throw new Error("Entre em uma conta para continuar jogando.");
  if (state.server.saveTimer) await pushServerSave();
  const requestEpoch = state.server.saveEpoch;
  const requestPlayerId = state.server.playerId;
  const requestProfile = state.server.profile;
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
    if (!isCurrentServerRequest(requestEpoch, requestPlayerId)) throw error;
    state.server.enabled = false;
    disconnectOnlineSocket();
    setServerStatus("error", "Local");
    throw error;
  }

  if (!isCurrentServerRequest(requestEpoch, requestPlayerId)) {
    throw new Error("Operacao ignorada porque a conta mudou.");
  }
  state.server.playerId = payload.playerId || state.server.playerId;
  if ("profile" in payload) applyProfile(payload.profile);
  if (payload.save) {
    state.save = normalizeSave(payload.save);
    persistLocalSave({
      playerId: payload.playerId || requestPlayerId,
      profile: Object.prototype.hasOwnProperty.call(payload, "profile") ? payload.profile : requestProfile
    });
  }
  if (payload.friends || payload.incomingInvites || payload.outgoingInvites || payload.trades || payload.clashes) {
    applySocialPayload(payload);
  }
  if (!response.ok) {
    setServerStatus("online", "Salvo");
    throw new Error(payload.error || "Operacao recusada pelo servidor.");
  }

  state.server.localChangedWhileLoading = false;
  setServerStatus("online", "Salvo");
  return payload;
}

function applySocialPayload(payload = {}, options = {}) {
  if (Array.isArray(payload.trades)) {
    applySocialTradeNotices(payload.trades, options);
  }
  if (Array.isArray(payload.clashes)) {
    applyTazzoClashNotices(payload.clashes, options);
  }
  state.social.friends = Array.isArray(payload.friends) ? payload.friends : state.social.friends;
  state.social.incomingInvites = Array.isArray(payload.incomingInvites) ? payload.incomingInvites : state.social.incomingInvites;
  state.social.outgoingInvites = Array.isArray(payload.outgoingInvites) ? payload.outgoingInvites : state.social.outgoingInvites;
  state.social.messages = Array.isArray(payload.messages) ? payload.messages : state.social.messages;
  state.social.trades = Array.isArray(payload.trades) ? payload.trades : state.social.trades;
  state.social.clashes = Array.isArray(payload.clashes) ? payload.clashes : state.social.clashes;
  state.social.loadedAt = Date.now();
  state.social.loading = false;
  state.social.error = "";
  if (!state.social.selectedFriendId && state.social.friends[0]) state.social.selectedFriendId = state.social.friends[0].playerId;
  if (!state.social.tradeFriendId && state.social.friends[0]) state.social.tradeFriendId = state.social.friends[0].playerId;
  if (!state.social.clashFriendId && state.social.friends[0]) state.social.clashFriendId = state.social.friends[0].playerId;
}

function socialNoticeStorageKey() {
  return `${SOCIAL_NOTICE_STORAGE_PREFIX}:${state.server.playerId || "guest"}`;
}

function readSocialNoticeKeys(storageKey) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : []);
  } catch (error) {
    return new Set();
  }
}

function writeSocialNoticeKeys(storageKey, keys) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...keys].slice(-180)));
  } catch (error) {}
}

function hydrateSocialNoticeKeys() {
  const storageKey = socialNoticeStorageKey();
  if (state.social.noticeHydratedFor === storageKey) {
    return {
      storageKey,
      keys: new Set(state.social.notifiedTradeKeys)
    };
  }
  const keys = readSocialNoticeKeys(storageKey);
  state.social.noticeHydratedFor = storageKey;
  state.social.notifiedTradeKeys = [...keys];
  return { storageKey, keys };
}

function applySocialTradeNotices(trades = [], options = {}) {
  const playerId = state.server.playerId;
  if (!playerId) return;
  const { storageKey, keys } = hydrateSocialNoticeKeys();
  const candidates = trades.flatMap((trade) => socialTradeNoticeCandidates(trade, playerId));
  const silentInitial = Boolean(options.silentInitial && !state.social.loadedAt);
  if (silentInitial) {
    candidates.forEach((candidate) => keys.add(candidate.key));
    state.social.notifiedTradeKeys = [...keys];
    writeSocialNoticeKeys(storageKey, keys);
    return;
  }

  candidates.forEach((candidate) => {
    if (keys.has(candidate.key)) return;
    keys.add(candidate.key);
    enqueueSocialNotice(candidate);
  });
  state.social.notifiedTradeKeys = [...keys];
  writeSocialNoticeKeys(storageKey, keys);
}

function socialTradeNoticeCandidates(trade, playerId) {
  if (!trade?.id) return [];
  const status = String(trade.status || "");
  const fromYou = trade.fromPlayerId === playerId;
  const toYou = trade.toPlayerId === playerId;
  if (!fromYou && !toYou) return [];
  const friend = fromYou ? trade.to : trade.from;
  const friendName = friend?.name || "um amigo";
  const stamp = trade.resolvedAt || trade.updatedAt || trade.createdAt || "";
  if (status === "pending" && toYou) {
    return [{
      key: `trade:${trade.id}:offered:${trade.createdAt || stamp}`,
      kind: "offer",
      title: "Nova troca oferecida",
      body: `${friendName} enviou uma proposta de troca.`,
      tradeId: trade.id
    }];
  }
  if (status === "pending" && fromYou) {
    return [{
      key: `trade:${trade.id}:sent:${trade.createdAt || stamp}`,
      kind: "sent",
      title: "Troca oferecida",
      body: `Sua proposta foi enviada para ${friendName}.`,
      tradeId: trade.id
    }];
  }
  if (status === "accepted") {
    return [{
      key: `trade:${trade.id}:accepted:${stamp}`,
      kind: "accepted",
      title: "Troca concluida",
      body: `A troca com ${friendName} foi concluida.`,
      tradeId: trade.id
    }];
  }
  return [];
}

function applyTazzoClashNotices(clashes = [], options = {}) {
  const playerId = state.server.playerId;
  if (!playerId) return;
  const { storageKey, keys } = hydrateSocialNoticeKeys();
  const candidates = clashes.flatMap((clash) => tazzoClashNoticeCandidates(clash, playerId));
  const silentInitial = Boolean(options.silentInitial && !state.social.loadedAt);
  if (silentInitial) {
    candidates.forEach((candidate) => keys.add(candidate.key));
    state.social.notifiedTradeKeys = [...keys];
    writeSocialNoticeKeys(storageKey, keys);
    return;
  }

  candidates.forEach((candidate) => {
    if (keys.has(candidate.key)) return;
    keys.add(candidate.key);
    enqueueSocialNotice(candidate);
  });
  state.social.notifiedTradeKeys = [...keys];
  writeSocialNoticeKeys(storageKey, keys);
}

function tazzoClashNoticeCandidates(clash, playerId) {
  if (!clash?.id) return [];
  const status = String(clash.status || "");
  const fromYou = clash.fromPlayerId === playerId;
  const toYou = clash.toPlayerId === playerId;
  if (!fromYou && !toYou) return [];
  const friend = fromYou ? clash.to : clash.from;
  const friendName = friend?.name || "um amigo";
  const stamp = clash.resolvedAt || clash.updatedAt || clash.createdAt || "";
  if (status === "pending" && toYou) {
    return [{
      key: `clash:${clash.id}:offered:${clash.createdAt || stamp}`,
      kind: "clash",
      targetTab: "online",
      title: "Convite para bater tazzos",
      body: `${friendName} chamou voce para um duelo de tazzos.`,
      clashId: clash.id
    }];
  }
  if (status === "active" && clash.currentTurnPlayerId === playerId) {
    return [{
      key: `clash:${clash.id}:turn:${stamp}`,
      kind: "clash-turn",
      targetTab: "online",
      title: "Sua vez de bater",
      body: `O duelo com ${friendName} esta esperando sua batida.`,
      clashId: clash.id
    }];
  }
  if (status === "selecting") {
    const yourReady = fromYou ? clash.fromReady : clash.toReady;
    if (!yourReady) {
      return [{
        key: `clash:${clash.id}:pick:${stamp}`,
        kind: "clash",
        targetTab: "online",
        title: "Escolha seus tazzos",
        body: `O duelo com ${friendName} foi aceito. Coloque seus tazzos na mesa.`,
        clashId: clash.id
      }];
    }
  }
  if (status === "finished") {
    const youWon = clash.winnerPlayerId === playerId;
    return [{
      key: `clash:${clash.id}:finished:${stamp}`,
      kind: youWon ? "accepted" : "clash",
      targetTab: "online",
      title: youWon ? "Duelo vencido" : "Duelo finalizado",
      body: `O bater tazzos com ${friendName} terminou.`,
      clashId: clash.id
    }];
  }
  return [];
}

function enqueueSocialNotice(notice) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.social.notices = [{ ...notice, id }, ...state.social.notices.filter((item) => item.key !== notice.key)].slice(0, 4);
  renderSocialNotices();
  window.setTimeout(() => dismissSocialNotice(id), SOCIAL_NOTICE_TTL_MS);
}

function dismissSocialNotice(id) {
  const next = state.social.notices.filter((notice) => notice.id !== id);
  if (next.length === state.social.notices.length) return;
  state.social.notices = next;
  renderSocialNotices();
}

function renderSocialNotices() {
  const stack = document.getElementById("social-notice-stack");
  if (!stack) return;
  stack.innerHTML = "";
  state.social.notices.forEach((notice) => {
    const card = document.createElement("article");
    card.className = `social-notice-card is-${notice.kind || "trade"}`;
    card.dataset.noticeId = notice.id;

    const icon = document.createElement("img");
    icon.src = "assets/generated-ui/icon-trade.png";
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = notice.title || "Troca atualizada";
    const body = document.createElement("span");
    body.textContent = notice.body || "A aba de trocas recebeu uma atualizacao.";
    text.append(title, body);

    const actions = document.createElement("div");
    actions.className = "social-notice-actions";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.dataset.socialNoticeOpen = notice.id;
    openButton.textContent = "Ver";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.dataset.socialNoticeDismiss = notice.id;
    closeButton.setAttribute("aria-label", "Fechar aviso de troca");
    closeButton.textContent = "x";
    actions.append(openButton, closeButton);

    card.append(icon, text, actions);
    stack.append(card);
  });
}

function handleSocialNoticeClick(event) {
  const openButton = event.target.closest("[data-social-notice-open]");
  if (openButton) {
    const id = openButton.dataset.socialNoticeOpen;
    const notice = state.social.notices.find((item) => item.id === id);
    dismissSocialNotice(id);
    switchTab(notice?.targetTab || "trade");
    refreshSocial({ force: true });
    return;
  }
  const closeButton = event.target.closest("[data-social-notice-dismiss]");
  if (closeButton) {
    dismissSocialNotice(closeButton.dataset.socialNoticeDismiss);
  }
}

function clearRewardCelebrationTimers() {
  state.rewardCelebrationTimers.forEach((timer) => window.clearTimeout(timer));
  state.rewardCelebrationTimers = [];
}

function showRewardCelebration(details = {}) {
  clearRewardCelebrationTimers();
  state.rewardCelebration = {
    stage: "closed",
    title: details.title || "Recompensa resgatada",
    message: details.message || "",
    rewards: Array.isArray(details.rewards) ? details.rewards.filter(Boolean) : []
  };
  renderRewardCelebration();
  playSfx("reward-shake");
  state.rewardCelebrationTimers.push(window.setTimeout(() => {
    if (!state.rewardCelebration) return;
    state.rewardCelebration.stage = "open";
    renderRewardCelebration();
    playSfx("reward-open");
    if (state.rewardCelebration.rewards.length) playSfx("coins", { volume: 0.72, pitch: 0.04 });
  }, REWARD_GIFT_SHAKE_MS));
  state.rewardCelebrationTimers.push(window.setTimeout(hideRewardCelebration, REWARD_CELEBRATION_TTL_MS));
}

function hideRewardCelebration() {
  clearRewardCelebrationTimers();
  state.rewardCelebration = null;
  renderRewardCelebration();
}

function renderRewardCelebration() {
  const overlay = document.getElementById("reward-celebration");
  if (!overlay) return;
  const celebration = state.rewardCelebration;
  overlay.innerHTML = "";
  if (!celebration) {
    overlay.hidden = true;
    overlay.className = "reward-celebration";
    return;
  }

  overlay.hidden = false;
  overlay.className = `reward-celebration is-${celebration.stage || "closed"}`;
  const panel = document.createElement("section");
  panel.className = "reward-celebration-card";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", celebration.title);

  const gift = document.createElement("div");
  gift.className = "reward-gift-shell";
  const giftImage = document.createElement("img");
  giftImage.src = celebration.stage === "open" ? REWARD_GIFT_OPEN_ART : REWARD_GIFT_CLOSED_ART;
  giftImage.alt = "";
  gift.append(giftImage);

  const title = document.createElement("strong");
  title.textContent = celebration.title;
  const message = document.createElement("span");
  message.textContent = celebration.message || "Itens adicionados ao seu perfil.";

  const list = document.createElement("div");
  list.className = "reward-celebration-rewards";
  celebration.rewards.forEach((reward) => {
    const item = document.createElement("span");
    item.textContent = reward;
    list.append(item);
  });

  const close = document.createElement("button");
  close.type = "button";
  close.dataset.rewardClose = "true";
  close.setAttribute("aria-label", "Fechar recompensa");
  close.textContent = "Fechar";

  panel.append(gift, title, message, list, close);
  overlay.append(panel);
}

function handleRewardCelebrationClick(event) {
  if (event.target === event.currentTarget || event.target.closest("[data-reward-close]")) {
    hideRewardCelebration();
  }
}

function missionRewardLines(missions = []) {
  const totalMerreis = missions.reduce((sum, mission) => sum + (Number(mission.reward) || 0), 0);
  const totalFragments = missions.reduce((sum, mission) => sum + (Number(mission.fragments) || 0), 0);
  const rewards = [];
  if (totalMerreis) rewards.push(`${totalMerreis.toLocaleString("pt-BR")} Merreis`);
  if (totalFragments) rewards.push(`${totalFragments.toLocaleString("pt-BR")} fragmentos`);
  return rewards;
}

async function refreshSocial(options = {}) {
  if (!hasOnlineProfile()) return;
  if (state.social.loading) return;
  const freshEnough = Date.now() - state.social.loadedAt < 5000;
  if (!options.force && freshEnough) return;
  const preserveClashPick = isEditingTazzoClashPick();
  state.social.loading = true;
  state.social.error = "";
  if (state.currentTab === "friends" || state.currentTab === "trade") {
    renderFriends();
    renderTrade();
  }
  if (state.currentTab === "online" && !preserveClashPick) {
    renderOnline();
  }
  try {
    const response = await fetch(SERVER_SOCIAL_ENDPOINT, {
      method: "GET",
      credentials: "same-origin"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Social indisponivel.");
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    applySocialPayload(payload, { silentInitial: true });
  } catch (error) {
    state.social.error = error.message || "Social indisponivel.";
    state.social.loading = false;
  }
  if (state.currentTab === "friends" || state.currentTab === "trade") {
    renderFriends();
    renderTrade();
  }
  if (state.currentTab === "online") {
    if (preserveClashPick || isEditingTazzoClashPick()) refreshVisibleTazzoClashSelectionUi();
    else renderOnline();
  }
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
  refreshWalletInfoContent();
  renderEntryGate();
}

function startMatchmakingSearch(type, label) {
  state.matchmaking = {
    active: true,
    type,
    label,
    startedAt: Date.now()
  };
  setServerStatus("syncing", "Procurando");
  renderCompetitive();
}

function finishMatchmakingSearch() {
  state.matchmaking = { active: false, type: "", label: "", startedAt: 0 };
  renderCompetitive();
}

function matchmakingLogText(matchmaking, fallback = "bot") {
  const waitSeconds = Math.round((Number(matchmaking?.waitMs) || 0) / 1000);
  if (matchmaking?.source === "player") return `Pareado com jogador real em ${waitSeconds}s.`;
  if (matchmaking?.source === "bot") return `Fila sem jogador em ${waitSeconds}s; bot chamado.`;
  return fallback;
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
    if (payload.type === "social:update") {
      state.online.socketStatus = "online";
      if (payload.save) {
        state.save = normalizeSave(payload.save);
        persistLocalSave();
        renderWallet();
      }
      applySocialPayload(payload);
      if (state.currentTab === "friends" || state.currentTab === "trade") {
        renderFriends();
        renderTrade();
      }
      if (state.currentTab === "online") {
        if (isEditingTazzoClashPick()) refreshVisibleTazzoClashSelectionUi();
        else renderOnline();
      }
      return;
    }
    if (payload.type !== "online:update") return;
    state.online.socketStatus = "online";
    applyOnlineLobbyPayload(payload);
    state.online.error = "";
    if (state.currentTab === "online") {
      if (isEditingTazzoClashPick()) refreshVisibleTazzoClashSelectionUi();
      else renderOnline();
    }
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

function resetAccountScopedState() {
  clearTurnTimer();
  clearMatchTimer();
  clearPackOpeningTimers();
  clearRewardCelebrationTimers();
  disconnectOnlineSocket();
  state.pendingTournament = null;
  state.pendingRanked = null;
  state.matchmaking = { active: false, type: "", label: "", startedAt: 0 };
  state.packOpening = null;
  state.packPurchasePending = false;
  state.packReveal = [];
  state.tutorialResult = null;
  state.missionClaimPending = false;
  state.tutorialRewardPending = false;
  state.rewardCelebration = null;
  state.tradeLog = [];
  state.competitiveLog = [];
  state.selectedTrade = { offer: "", wish: "" };
  state.social.friends = [];
  state.social.incomingInvites = [];
  state.social.outgoingInvites = [];
  state.social.messages = [];
  state.social.trades = [];
  state.social.clashes = [];
  state.social.loading = false;
  state.social.loadedAt = 0;
  state.social.error = "";
  state.social.message = "";
  state.social.selectedFriendId = "";
  state.social.tradeFriendId = "";
  state.social.tradeDraft = { offerIds: [], requestIds: [] };
  state.social.clashFriendId = "";
  state.social.clashDraft = { offerIds: [], requestIds: [] };
  state.social.clashPickDrafts = {};
  state.social.clashAnimation = null;
  state.social.notices = [];
  state.social.notifiedTradeKeys = [];
  state.social.noticeHydratedFor = "";
  state.online.lobbies = [];
  state.online.currentLobby = null;
  state.online.loading = false;
  state.online.loadedAt = 0;
  state.online.error = "";
  state.online.message = "";
  state.online.joinCode = "";
  state.online.inviteMessage = "";
  state.online.inviteMessageType = "info";
  state.online.inviteHandled = false;
  state.battle = null;
  state.battleSceneOpen = false;
}

function applyProfile(profile) {
  const previousProfileId = state.server.profile?.playerId || "";
  const nextProfileId = profile?.playerId || "";
  if (previousProfileId !== nextProfileId) {
    resetAccountScopedState();
  }
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
  refreshWalletInfoContent();
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
  if (appliedSnapshot) showOnlineKeeperFeedback(match.lastAction);
  const appliedAction = !appliedSnapshot && applyOnlineBattleEvent(match.lastAction);
  state.battle.online.message = match.message;
  state.battle.online.isYourTurn = match.isYourTurn;
  state.battle.online.pendingAction = false;
  state.battle.online.round = match.round;
  state.battle.online.sequence = match.sequence || 0;
  state.battle.online.actionDeadlineAt = match.actionDeadlineAt || null;
  state.battle.online.absence = match.absence || null;
  state.battle.online.cosmetics = {
    player: normalizeFieldCosmetics(match.playerCosmetics),
    cpu: normalizeFieldCosmetics(match.enemyCosmetics)
  };
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
    if (state.currentTab === "online") {
      if (isEditingTazzoClashPick()) refreshVisibleTazzoClashSelectionUi();
      else renderOnline();
    }
    return;
  }
  if (state.online.socketStatus === "online" && !options.force) return;
  if (state.online.loading) return;
  const now = Date.now();
  if (!options.force && now - state.online.loadedAt < 4000) return;
  state.online.loading = true;
  state.online.error = "";
  if (state.currentTab === "online" && !isEditingTazzoClashPick()) renderOnline();
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
    if (state.currentTab === "online") {
      if (isEditingTazzoClashPick()) refreshVisibleTazzoClashSelectionUi();
      else renderOnline();
    }
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
  handlePaymentReturnNotice();
  setupShopCheckoutRecovery();
  setupTabs();
  setupFilters();
  setupActions();
  setupWalletInfo();
  setupStarterOnboardingActions();
  setupEntryGateActions();
  setupProfileActions();
  setupFirebaseAuth();
  setupSoundEffects();
  setupMusicPlayer();
  setupOnlineLobbyRealtime();
  setupSocialRealtime();
  setupCompetitiveRealtime();
  loadShopPaymentConfig();
  loadCryptoConfig();
  setupServerSave();
  renderAll();
}

function setupShopCheckoutRecovery() {
  const recover = () => recoverInterruptedCheckout();
  window.addEventListener("pageshow", recover);
  window.addEventListener("focus", recover);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") recover();
  });
}

function clearCheckoutFallbackTimer() {
  if (!state.shopPayments.checkoutFallbackTimer) return;
  window.clearTimeout(state.shopPayments.checkoutFallbackTimer);
  state.shopPayments.checkoutFallbackTimer = null;
}

function markCheckoutPending(message = "Abrindo checkout seguro do Mercado Pago...") {
  clearCheckoutFallbackTimer();
  state.shopPayments.checkoutPending = true;
  state.shopPayments.checkoutStartedAt = Date.now();
  state.shopMessage = message;
  setServerStatus("syncing", "Checkout");
}

function resetCheckoutPending(message = "") {
  clearCheckoutFallbackTimer();
  state.shopPayments.checkoutPending = false;
  state.shopPayments.checkoutStartedAt = 0;
  if (message) state.shopMessage = message;
}

function recoverInterruptedCheckout() {
  if (!state.shopPayments.checkoutPending) return;
  const elapsed = Date.now() - (state.shopPayments.checkoutStartedAt || 0);
  if (elapsed < CHECKOUT_RETURN_RECOVERY_MS) return;
  resetCheckoutPending("Checkout interrompido. Tente novamente ou use uma conta de comprador diferente da conta vendedora.");
  setServerStatus("online", state.server.profile ? "Online" : "Salvo");
  renderShop();
}

function waitForCheckoutSaveFlush() {
  if (!state.server.saveTimer) return Promise.resolve();
  return Promise.race([
    pushServerSave(),
    new Promise((resolve) => window.setTimeout(resolve, CHECKOUT_SAVE_FLUSH_TIMEOUT_MS))
  ]).catch(() => {});
}

function mercadoPagoDeviceSessionId() {
  return String(window.MP_DEVICE_SESSION_ID || window.deviceId || "")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 180);
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });
}

function setupWalletInfo() {
  const wallet = document.querySelector(".wallet");
  if (!wallet) return;
  wallet.querySelectorAll("[data-wallet-info]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleWalletInfo(button.dataset.walletInfo, button);
    });
  });
  document.addEventListener("click", (event) => {
    if (!wallet.contains(event.target)) closeWalletInfo();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWalletInfo();
  });
}

function toggleWalletInfo(kind, button) {
  const popover = document.getElementById("wallet-popover");
  if (!popover) return;
  const wasOpen = !popover.hidden && popover.dataset.info === kind;
  closeWalletInfo();
  if (wasOpen) return;
  renderWalletInfoContent(kind);
  popover.dataset.info = kind;
  popover.hidden = false;
  button.classList.add("is-open");
  button.setAttribute("aria-expanded", "true");
}

function closeWalletInfo() {
  const popover = document.getElementById("wallet-popover");
  if (popover) {
    popover.hidden = true;
    popover.dataset.info = "";
  }
  document.querySelectorAll("[data-wallet-info].is-open").forEach((button) => {
    button.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  });
}

function refreshWalletInfoContent() {
  const popover = document.getElementById("wallet-popover");
  if (!popover || popover.hidden || !popover.dataset.info) return;
  renderWalletInfoContent(popover.dataset.info);
}

function renderWalletInfoContent(kind) {
  const popover = document.getElementById("wallet-popover");
  if (!popover) return;
  const info = walletInfoDetails(kind);
  popover.replaceChildren();
  const title = document.createElement("h3");
  const value = document.createElement("strong");
  const body = document.createElement("p");
  const meta = document.createElement("small");
  title.textContent = info.title;
  value.textContent = info.value;
  body.textContent = info.body;
  meta.textContent = info.meta;
  popover.append(title, value, body, meta);
}

function walletInfoDetails(kind) {
  const visibleMonsters = visibleCollectionMonsters();
  const owned = visibleMonsters.filter((monster) => state.save.collection[monster.id] > 0).length;
  const total = visibleMonsters.length || 1;
  const missing = Math.max(0, total - owned);
  const percent = Math.round((owned / total) * 100);
  const profileName = state.server.profile?.name || "sem conta conectada";
  const serverMode = state.server.enabled ? "salvando no servidor" : "salvamento local";
  const details = {
    merreis: {
      title: "Merreis",
      value: formatNumber(state.save.merreis),
      body: "Moeda do recreio para abrir pacotinhos, entrar em torneios e comprar itens da loja.",
      meta: "Ganhe jogando batalhas, torneios, missoes e recompensas."
    },
    fragments: {
      title: "Fragmentos",
      value: formatNumber(state.save.fragments),
      body: "Material usado para melhorar tazzos e fortalecer o time sem depender so de sorte.",
      meta: "Repetidos, missoes e torneios ajudam a juntar fragmentos."
    },
    album: {
      title: "Album",
      value: `${owned}/${visibleMonsters.length}`,
      body: `${percent}% da colecao visivel completa.`,
      meta: missing ? `Ainda faltam ${missing} tazzo(s) para completar esta lista.` : "Album completo nesta lista."
    },
    server: {
      title: "Servidor",
      value: state.server.message,
      body: `Status atual: ${serverMode}.`,
      meta: `Perfil: ${profileName}.`
    }
  };
  return details[kind] || details.merreis;
}

function switchTab(tabName) {
  const previousTab = state.currentTab;
  state.currentTab = PLAYER_TABS.has(tabName) ? tabName : "home";
  const tutorialStepId = currentTutorialStep()?.id || "";
  trackTelemetry("tab:view", {
    tab: state.currentTab,
    previousTab
  }, { dedupeKey: `tab:${state.currentTab}`, cooldown: 700 });
  if (state.currentTab === "collection") progressTutorial("collection");
  if (state.currentTab === "trade" && isCurrentTutorialStep("trade")) progressTutorial("trade");
  if (state.currentTab === "online" && tutorialStepId === "clash") progressTutorial("clash");
  if (state.currentTab === "competitive" && (tutorialStepId === "tournament" || tutorialStepId === "ranked")) {
    progressTutorial(tutorialStepId);
  }
  if (state.currentTab === "competitive") refreshLeaderboard({ force: true });
  if (state.currentTab === "online") refreshOnlineLobbies({ force: true });
  if (state.currentTab === "friends" || state.currentTab === "trade" || state.currentTab === "online") refreshSocial({ force: true });
  document.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === state.currentTab);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${state.currentTab}`);
  });
  renderAll();
  if (state.currentTab !== previousTab) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

const IMAGE_BUTTON_SELECTOR = [
  ".tab-button",
  ".slot-picker button",
  ".primary-button",
  ".secondary-button",
  ".ghost-button",
  ".action-grid button",
  ".pack-card button",
  ".monster-card button",
  ".mission-card button",
  ".mission-economy-actions button",
  ".shop-card button",
  ".battle-resume-card button",
  ".tournament-card button",
  ".edit-actions button",
  ".friend-actions button",
  ".trade-offer-actions button",
  ".result-actions button",
  ".tutorial-panel button",
  ".tutorial-coach button",
  ".tutorial-popover button",
  ".tutorial-active-card button",
  ".tutorial-result-dialog button",
  ".online-code-form button",
  ".online-current-actions button",
  ".online-lobby-list button",
  ".tazzo-clash-panel button",
  ".opening-copy button",
  ".pack-results-actions button",
  ".starter-actions button",
  ".music-controls button",
  ".profile-mode-tabs button",
  ".setup-start"
].join(",");
const imageButtonCache = new Map();
const COMBAT_BUTTON_ART = {
  move: "assets/icones/mover.png",
  dribble: "assets/icones/driblar.png",
  shot: "assets/icones/chutar.png",
  keeper: "assets/icones/goleiro.png",
  pressure: "assets/icones/pressionar.png",
  retreat: "assets/icones/recuar.png",
  swap: "assets/icones/trocar.png",
  pass: "assets/icones/passar.png",
  start: "assets/icones/iniciar jogo.png",
  enter: "assets/icones/entrar.png",
  team: "assets/icones/trocar_time.png",
  gameMenu: "assets/icones/menu_de_jogo.png",
  rematch: "assets/icones/revanche.png",
  createRoom: "assets/icones/criar_sala.png",
  refresh: "assets/icones/atualizar.png",
  claim: "assets/icones/resgatar.png",
  claimed: "assets/icones/resgatada.png"
};

const BUTTON_LABEL_ART = {
  "abrir": "assets/icones/botao_abrir.png",
  "abrir cena": "assets/icones/botao_abrir_cena.png",
  "abrir pacotinhos": "assets/icones/botao_abrir_pacotinhos.png",
  "abrir premio": "assets/icones/botao_abrir_premio.png",
  "abrir trocas": "assets/icones/botao_abrir_trocas.png",
  "adicionar tazzo": "assets/icones/botao_adicionar_tazzo.png",
  "ativo": "assets/icones/botao_ativo.png",
  "ativar": "assets/icones/botao_ativar.png",
  "bater agora": "assets/icones/botao_bater_agora.png",
  "comprar": "assets/icones/botao_comprar.png",
  "comprar merreis": "assets/icones/botao_comprar_merreis.png",
  "continuar": "assets/icones/botao_continuar.png",
  "continuar assistindo": "assets/icones/botao_continuar_assistindo.png",
  "continuar batalha": "assets/icones/botao_continuar_batalha.png",
  "continuar seu turno": "assets/icones/botao_continuar_turno.png",
  "continuar turno": "assets/icones/botao_continuar_turno.png",
  "copiar convite": "assets/icones/botao_copiar_convite.png",
  "desafiar": "assets/icones/botao_desafiar.png",
  "desistir": "assets/icones/botao_desistir.png",
  "disputar ranqueada": "assets/icones/botao_disputar_ranqueada.png",
  "disputar ranqueada tutorial": "assets/icones/botao_disputar_ranqueada.png",
  "em batalha": "assets/icones/botao_em_batalha.png",
  "em andamento": "assets/icones/botao_em_andamento.png",
  "entrar e batalhar": "assets/icones/botao_entrar_batalhar.png",
  "entrar na cena": "assets/icones/botao_entrar_cena.png",
  "entrar pelo tutorial": "assets/icones/botao_entrar_tutorial.png",
  "enviado": "assets/icones/botao_enviado.png",
  "fechar": "assets/icones/botao_fechar.png",
  "finalize o torneio": "assets/icones/botao_finalize_torneio.png",
  "ir": "assets/icones/botao_ir.png",
  "ir para batalha": "assets/icones/botao_ir_batalha.png",
  "inspecionar tazzo": "assets/icones/botao_inspecionar_tazzo.png",
  "liga e torneios": "assets/icones/botao_ver_liga_torneios.png",
  "montar time": "assets/icones/botao_montar_time.png",
  "novo tazzo": "assets/icones/botao_novo_tazzo.png",
  "preparar batalha": "assets/icones/botao_preparar_batalha.png",
  "presente": "assets/icones/botao_presente.png",
  "pronto": "assets/icones/botao_pronto.png",
  "ranqueada ativa": "assets/icones/botao_ranqueada_ativa.png",
  "recompensa resgatada": "assets/icones/botao_recompensa_resgatada.png",
  "reiniciar save": "assets/icones/botao_reiniciar_save.png",
  "resgatar tutorial": "assets/icones/botao_resgatar_tutorial.png",
  "sair": "assets/icones/botao_sair.png",
  "sair da conta google": "assets/icones/botao_sair_perfil.png",
  "sair da sala": "assets/icones/botao_sair_sala.png",
  "sair do perfil": "assets/icones/botao_sair_perfil.png",
  "sair sem punicao": "assets/icones/botao_sair_sem_punicao.png",
  "salvar tazzo": "assets/icones/botao_salvar_tazzo.png",
  "torneio ativo": "assets/icones/botao_torneio_ativo.png",
  "treinar chute": "assets/icones/botao_treinar_chute.png",
  "treinar drible": "assets/icones/botao_treinar_drible.png",
  "treinar movimento": "assets/icones/botao_treinar_movimento.png",
  "treinar passe": "assets/icones/botao_treinar_passe.png",
  "treinar pressao": "assets/icones/botao_treinar_pressao.png",
  "treinar recuo": "assets/icones/botao_treinar_recuo.png",
  "treinar troca": "assets/icones/botao_treinar_troca.png",
  "treino de borda": "assets/icones/botao_treino_borda.png",
  "trocar repetido": "assets/icones/botao_trocar_repetido.png",
  "usar goleiro": "assets/icones/botao_usar_goleiro.png",
  "vencer por w.o.": "assets/icones/botao_vencer_wo.png",
  "ver colecao": "assets/icones/botao_ver_colecao.png",
  "ver liga": "assets/icones/botao_ver_liga.png",
  "ver resultado": "assets/icones/botao_ver_resultado.png",
  "ver torneios": "assets/icones/botao_ver_torneios.png",
  "virar todos": "assets/icones/botao_virar_todos.png",
  "voltar": "assets/icones/botao_voltar.png",
  "voltar para sala": "assets/icones/botao_voltar_sala.png"
};

const GENERATED_BUTTON_FRAMES = {
  green: "assets/generated-ui/button-frame-green.png",
  red: "assets/generated-ui/button-frame-red.png",
  dark: "assets/generated-ui/button-frame-dark.png",
  paper: "assets/generated-ui/button-frame-paper.png",
  disabled: "assets/generated-ui/button-frame-disabled.png"
};

const GENERATED_BUTTON_ICONS = {
  accept: "assets/generated-ui/icon-accept.png",
  battle: "assets/generated-ui/icon-battle.png",
  book: "assets/generated-ui/icon-book.png",
  cards: "assets/generated-ui/icon-cards.png",
  check: "assets/generated-ui/icon-check.png",
  close: "assets/generated-ui/icon-close.png",
  copy: "assets/generated-ui/icon-copy.png",
  decline: "assets/generated-ui/icon-decline.png",
  dribble: "assets/generated-ui/icon-battle.png",
  edit: "assets/generated-ui/icon-edit.png",
  exit: "assets/generated-ui/icon-exit.png",
  field: "assets/generated-ui/icon-field.png",
  flip: "assets/generated-ui/icon-flip.png",
  friends: "assets/generated-ui/icon-friends.png",
  gift: "assets/generated-ui/icon-gift.png",
  hand: "assets/generated-ui/icon-hand.png",
  keeper: "assets/generated-ui/icon-field.png",
  login: "assets/generated-ui/icon-login.png",
  menu: "assets/generated-ui/icon-menu.png",
  missions: "assets/generated-ui/icon-missions.png",
  move: "assets/generated-ui/icon-field.png",
  next: "assets/generated-ui/icon-next.png",
  online: "assets/generated-ui/icon-online.png",
  pack: "assets/generated-ui/icon-pack.png",
  pass: "assets/generated-ui/icon-send.png",
  pause: "assets/generated-ui/icon-pause.png",
  play: "assets/generated-ui/icon-play.png",
  plus: "assets/generated-ui/icon-plus.png",
  pressure: "assets/generated-ui/icon-battle.png",
  ready: "assets/generated-ui/icon-ready.png",
  refresh: "assets/generated-ui/icon-refresh.png",
  rematch: "assets/generated-ui/icon-rematch.png",
  reset: "assets/generated-ui/icon-reset.png",
  retreat: "assets/generated-ui/icon-exit.png",
  send: "assets/generated-ui/icon-send.png",
  shop: "assets/generated-ui/icon-shop.png",
  shot: "assets/generated-ui/icon-send.png",
  star: "assets/generated-ui/icon-star.png",
  swap: "assets/generated-ui/icon-trade.png",
  trade: "assets/generated-ui/icon-trade.png",
  trophy: "assets/generated-ui/icon-trophy.png",
  upgrade: "assets/generated-ui/icon-upgrade.png",
  versus: "assets/generated-ui/icon-versus.png",
  wallet: "assets/generated-ui/icon-wallet.png"
};

function generatedButtonFrameAsset(variant) {
  return GENERATED_BUTTON_FRAMES[variant] || GENERATED_BUTTON_FRAMES.green;
}

function generatedButtonIconAsset(icon) {
  return GENERATED_BUTTON_ICONS[icon] || "";
}

function escapeSvgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buttonImageLabel(button) {
  return String(button.dataset.imageLabel || button.textContent || button.getAttribute("aria-label") || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buttonImageVariant(button) {
  if (button.disabled || button.classList.contains("is-tutorial-locked")) return "disabled";
  if (button.matches(".viewer-close")) return "red";
  if (button.classList.contains("is-active") || button.closest(".slot-picker") && button.classList.contains("is-active")) return "dark";
  if (button.matches(".ghost-button, .secondary-button, .online-code-form button")) return "paper";
  if (button.matches("[data-result-action='battle-menu'], [data-result-action='online-leave']")) return "red";
  if (button.dataset.clashDecline) return "red";
  if (button.closest(".action-grid") && button.classList.contains("is-active")) return "red";
  if (button.closest(".action-grid")) return "dark";
  if (button.closest(".friend-actions") && button.matches(":last-child")) return "dark";
  return "green";
}

function splitButtonLabel(label) {
  if (label.length <= 18 || !label.includes(" ")) return [label];
  const words = label.split(" ");
  const lines = [""];
  words.forEach((word) => {
    const next = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (next.length > 16 && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = next;
  });
  return lines.slice(0, 2);
}

function normalizedButtonLabel(label) {
  return String(label || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buttonImageAsset(button, label) {
  const normalizedLabel = normalizedButtonLabel(label);
  if (button.matches(".viewer-close")) return "";
  if (button.dataset.action && COMBAT_BUTTON_ART[button.dataset.action]) {
    return COMBAT_BUTTON_ART[button.dataset.action];
  }
  if (BUTTON_LABEL_ART[normalizedLabel]) return BUTTON_LABEL_ART[normalizedLabel];
  if (button.id === "new-battle-button" || button.dataset.startBattle !== undefined) {
    if (button.disabled && !/(abrir|iniciar|nova)/.test(normalizedLabel)) return "";
    return COMBAT_BUTTON_ART.start;
  }
  if (button.id === "create-lobby-button") return COMBAT_BUTTON_ART.createRoom;
  if (button.id === "refresh-lobbies-button") return COMBAT_BUTTON_ART.refresh;
  if (button.id === "back-to-battle-menu-button") return COMBAT_BUTTON_ART.gameMenu;
  if (button.id === "entry-login-button" || button.id === "profile-submit-button" && normalizedLabel === "entrar") return COMBAT_BUTTON_ART.enter;
  if (button.id === "profile-submit-button" && normalizedLabel.includes("criar")) return "assets/icones/botao_criar_jogador.png";
  if (button.id === "entry-register-button") return "assets/icones/botao_criar_jogador.png";
  if (button.matches(".online-code-form button")) return COMBAT_BUTTON_ART.enter;
  if (button.dataset.joinLobby) {
    return normalizedLabel.includes("entrar") ? COMBAT_BUTTON_ART.enter : "";
  }
  if (button.dataset.team && !/^(por no slot|no trio)/.test(normalizedLabel)) return COMBAT_BUTTON_ART.team;
  if (button.dataset.goalkeeper) return COMBAT_BUTTON_ART.team;
  if (button.dataset.claim || button.dataset.tutorialReward) {
    if (BUTTON_LABEL_ART[normalizedLabel]) return BUTTON_LABEL_ART[normalizedLabel];
    return normalizedLabel.includes("resgatad") ? COMBAT_BUTTON_ART.claimed : COMBAT_BUTTON_ART.claim;
  }
  if (button.dataset.claimReady) return COMBAT_BUTTON_ART.claim;
  if (button.dataset.resultAction) {
    return {
      "battle-menu": COMBAT_BUTTON_ART.gameMenu,
      rematch: COMBAT_BUTTON_ART.rematch,
      "online-rematch": COMBAT_BUTTON_ART.rematch,
      collection: COMBAT_BUTTON_ART.team
    }[button.dataset.resultAction] || "";
  }
  if (button.dataset.lobbyAction) {
    if (button.dataset.lobbyAction === "open-battle") return COMBAT_BUTTON_ART.enter;
    if (button.dataset.lobbyAction === "rematch") return COMBAT_BUTTON_ART.rematch;
  }
  if (button.dataset.clashHit) return BUTTON_LABEL_ART["bater agora"];
  if (button.dataset.clashCreate || button.dataset.clashPickSubmit) return "";
  if (button.dataset.tournament && normalizedLabel.includes("entrar")) return COMBAT_BUTTON_ART.enter;
  return "";
}

function imageAssetUrl(path) {
  return `url("${String(path).replace(/"/g, "%22").replace(/ /g, "%20")}")`;
}

function buttonImageIcon(button, label) {
  const normalizedLabel = normalizedButtonLabel(label);
  if (button.dataset.action) {
    return {
      move: "move",
      dribble: "dribble",
      shot: "shot",
      keeper: "keeper",
      pressure: "pressure",
      retreat: "retreat",
      swap: "swap",
      pass: "pass"
    }[button.dataset.action] || "";
  }
  if (button.dataset.resultAction) {
    return {
      "battle-menu": "menu",
      rematch: "rematch",
      tournaments: "trophy",
      online: "online",
      "online-rematch": "rematch",
      "online-leave": "exit",
      packs: "pack",
      collection: "book"
    }[button.dataset.resultAction] || "";
  }
  if (button.dataset.lobbyAction) {
    return {
      "copy-invite": "copy",
      ready: "check",
      leave: "exit",
      "open-battle": "battle",
      "claim-forfeit": "trophy",
      rematch: "rematch"
    }[button.dataset.lobbyAction] || "";
  }
  if (button.dataset.clashCreate) return "battle";
  if (button.dataset.clashAccept) return "check";
  if (button.dataset.clashDecline) return "exit";
  if (button.dataset.clashPickSubmit) return "cards";
  if (button.dataset.clashHit) return "flip";
  if (button.matches(".tab-button")) return {
    Batalha: "battle",
    Online: "online",
    Torneios: "trophy",
    Pacotinhos: "pack",
    Colecao: "book",
    Amigos: "friends",
    Trocas: "trade",
    Loja: "shop",
    Missoes: "missions"
  }[label] || "";
  if (button.closest(".slot-picker")) return "cards";
  if (button.id === "new-battle-button" || button.dataset.startBattle !== undefined) return "battle";
  if (button.id === "ranked-button") return "trophy";
  if (button.id === "create-lobby-button") return "online";
  if (button.id === "refresh-lobbies-button") return "refresh";
  if (button.id === "reveal-all-button" || button.dataset.revealAllPulls !== undefined) return "flip";
  if (button.id === "trade-button") return "trade";
  if (button.id === "reset-save-button") return "reset";
  if (button.id === "edit-new-button") return "edit";
  if (button.id === "music-play-button") return normalizedLabel.includes("pausar") ? "pause" : "play";
  if (button.id === "music-next-button") return "next";
  if (button.matches(".viewer-close")) return "close";
  if (button.dataset.joinLobby) return "online";
  if (button.dataset.pack) return "pack";
  if (button.dataset.shop) return "shop";
  if (button.dataset.tournament) return "trophy";
  if (button.dataset.claim || button.dataset.tutorialReward) return "check";
  if (button.dataset.claimReady) return "check";
  if (button.dataset.gift) return "gift";
  if (button.dataset.challenge) return "battle";
  if (button.dataset.team || button.dataset.goalkeeper) return "plus";
  if (button.dataset.upgrade) return "upgrade";
  if (button.dataset.profileMode) return normalizedLabel.includes("criar") ? "plus" : "login";
  if (button.dataset.friendAccept || button.dataset.tradeAccept) return "accept";
  if (button.dataset.friendDecline || button.dataset.tradeDecline) return "decline";
  if (button.dataset.friendMessage !== undefined) return "send";
  if (normalizedLabel.includes("entrar")) return "login";
  if (normalizedLabel.includes("criar")) return "plus";
  if (normalizedLabel.includes("abrir")) return "pack";
  if (normalizedLabel.includes("aceitar")) return "accept";
  if (normalizedLabel.includes("recusar") || normalizedLabel.includes("cancelar")) return "decline";
  if (normalizedLabel.includes("enviar")) return "send";
  if (normalizedLabel.includes("amigo")) return "friends";
  if (normalizedLabel.includes("trocar")) return "trade";
  if (normalizedLabel.includes("salvar") || normalizedLabel.includes("adicionar")) return "check";
  if (normalizedLabel.includes("continuar") || normalizedLabel.includes("ir")) return "next";
  return "";
}

function imageButtonIconSvg(icon, palette) {
  if (!icon) return "";
  const stroke = "#f6d66d";
  const fill = "#ffffff";
  const glow = "rgba(246,214,109,.38)";
  const icons = {
    battle: `
      <path d="M137 18 L181 50 M183 18 L139 50" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <path d="M130 13 L142 18 L137 29 Z M190 13 L178 18 L183 29 Z" fill="${fill}"/>
      <circle cx="137" cy="50" r="5" fill="${stroke}"/><circle cx="183" cy="50" r="5" fill="${stroke}"/>
    `,
    online: `
      <circle cx="160" cy="32" r="22" fill="none" stroke="${stroke}" stroke-width="5"/>
      <path d="M138 32 H182 M160 10 V54 M146 15 C155 27 155 37 146 49 M174 15 C165 27 165 37 174 49" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round"/>
    `,
    trophy: `
      <path d="M143 12 H177 V29 C177 42 168 49 160 49 C152 49 143 42 143 29 Z" fill="${stroke}"/>
      <path d="M143 18 H132 C132 33 139 37 145 38 M177 18 H188 C188 33 181 37 175 38" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
      <path d="M154 49 H166 V57 H182 V63 H138 V57 H154 Z" fill="${fill}"/>
    `,
    pack: `
      <path d="M138 22 L160 11 L182 22 V51 L160 63 L138 51 Z" fill="${stroke}"/>
      <path d="M138 22 L160 34 L182 22 M160 34 V63" fill="none" stroke="#173047" stroke-width="4" stroke-linecap="round"/>
      <path d="M150 17 L172 29" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
    `,
    book: `
      <path d="M134 16 C144 12 153 14 160 21 V59 C153 53 144 52 134 56 Z M186 16 C176 12 167 14 160 21 V59 C167 53 176 52 186 56 Z" fill="${stroke}"/>
      <path d="M145 24 H154 M145 34 H154 M166 24 H175 M166 34 H175" stroke="#173047" stroke-width="3" stroke-linecap="round"/>
    `,
    edit: `
      <path d="M143 53 L148 39 L176 11 L188 23 L160 51 Z" fill="${stroke}"/>
      <path d="M171 16 L183 28 M148 39 L160 51" stroke="#173047" stroke-width="4" stroke-linecap="round"/>
      <path d="M140 58 H185" stroke="${fill}" stroke-width="5" stroke-linecap="round"/>
    `,
    friends: `
      <circle cx="149" cy="25" r="10" fill="${stroke}"/><circle cx="173" cy="25" r="10" fill="${fill}"/>
      <path d="M129 57 C132 44 141 38 150 38 C158 38 164 44 166 57 Z" fill="${stroke}"/>
      <path d="M158 57 C160 44 168 38 176 38 C184 38 190 44 192 57 Z" fill="${fill}"/>
    `,
    trade: `
      <path d="M134 26 H181 L172 17 M186 43 H139 L148 52" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="160" cy="34" r="7" fill="${fill}"/>
    `,
    shop: `
      <path d="M137 19 H148 L154 45 H180 L187 27 H153" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="157" cy="57" r="5" fill="${fill}"/><circle cx="179" cy="57" r="5" fill="${fill}"/>
    `,
    missions: `
      <path d="M160 10 L168 27 L187 29 L173 42 L177 61 L160 51 L143 61 L147 42 L133 29 L152 27 Z" fill="${stroke}"/>
      <path d="M150 36 L157 43 L172 28" fill="none" stroke="#173047" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    move: `
      <path d="M160 9 V61 M160 9 L149 20 M160 9 L171 20 M160 61 L149 50 M160 61 L171 50 M134 35 H186 M134 35 L145 24 M134 35 L145 46 M186 35 L175 24 M186 35 L175 46" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    dribble: `
      <path d="M148 15 C161 18 170 28 170 41 C170 51 164 58 154 61" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="150" cy="25" r="7" fill="${fill}"/><circle cx="178" cy="51" r="9" fill="${stroke}"/>
    `,
    shot: `
      <path d="M134 50 L171 15 M158 13 H183 V38" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="144" cy="54" r="8" fill="${fill}"/>
    `,
    keeper: `
      <path d="M136 19 H184 V55 H136 Z" fill="none" stroke="${stroke}" stroke-width="6"/>
      <path d="M145 47 C154 31 165 31 175 47 M160 19 V55" fill="none" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
    `,
    pressure: `
      <path d="M136 36 C146 19 174 19 184 36 C174 53 146 53 136 36 Z" fill="${stroke}"/>
      <path d="M150 36 H170 M160 26 V46" stroke="#173047" stroke-width="6" stroke-linecap="round"/>
    `,
    retreat: `
      <path d="M185 21 H143 L154 10 M143 21 L154 32 M135 49 H177 L166 38 M177 49 L166 60" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    swap: `
      <path d="M139 24 H179 L169 14 M181 46 H141 L151 56" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="151" cy="46" r="5" fill="${fill}"/><circle cx="169" cy="24" r="5" fill="${fill}"/>
    `,
    pass: `
      <path d="M135 43 C151 22 171 22 187 43 M178 42 L187 43 L184 33" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="138" cy="46" r="7" fill="${fill}"/>
    `,
    menu: `
      <path d="M138 20 H183 M138 35 H183 M138 50 H183" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
    `,
    rematch: `
      <path d="M181 25 C174 16 160 12 149 18 C137 25 135 42 146 52 C156 61 173 57 181 45" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <path d="M181 25 L181 12 L191 21" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    exit: `
      <path d="M140 16 H164 V25 M164 45 V54 H140 Z" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M158 35 H189 M178 24 L189 35 L178 46" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    copy: `
      <path d="M145 22 H175 V56 H145 Z M155 14 H185 V48" fill="none" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>
    `,
    check: `
      <path d="M139 37 L154 52 L184 19" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    refresh: `
      <path d="M181 28 C176 18 163 13 151 18 C141 22 135 31 136 41 M139 55 C146 63 160 65 171 58 C180 52 184 42 181 32" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <path d="M181 28 L188 16 M181 28 L169 25 M139 55 L132 64 M139 55 L151 58" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round"/>
    `,
    flip: `
      <path d="M140 20 H180 V55 H140 Z" fill="${stroke}"/>
      <path d="M180 20 C168 28 160 39 156 55" fill="none" stroke="#173047" stroke-width="5" stroke-linecap="round"/>
    `,
    reset: `
      <path d="M181 25 C174 16 160 12 149 18 C137 25 135 42 146 52 C155 60 169 58 178 50" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <path d="M181 25 L181 12 L191 21" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M152 31 L169 48 M169 31 L152 48" stroke="#173047" stroke-width="5" stroke-linecap="round"/>
    `,
    play: `
      <path d="M146 15 L184 36 L146 57 Z" fill="${stroke}"/>
    `,
    next: `
      <path d="M139 16 L164 36 L139 56 Z M164 16 L189 36 L164 56 Z" fill="${stroke}"/>
    `,
    close: `
      <path d="M143 18 L181 56 M181 18 L143 56" stroke="${stroke}" stroke-width="9" stroke-linecap="round"/>
    `,
    gift: `
      <path d="M138 29 H184 V58 H138 Z M134 22 H188 V32 H134 Z M161 22 V58" fill="${stroke}"/>
      <path d="M161 22 C153 12 141 15 145 25 M161 22 C169 12 181 15 177 25" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round"/>
    `,
    plus: `
      <circle cx="160" cy="36" r="25" fill="${stroke}"/>
      <path d="M160 23 V49 M147 36 H173" stroke="#173047" stroke-width="7" stroke-linecap="round"/>
    `,
    upgrade: `
      <path d="M160 11 L184 35 H170 V60 H150 V35 H136 Z" fill="${stroke}"/>
      <path d="M151 35 H169" stroke="${fill}" stroke-width="5" stroke-linecap="round"/>
    `,
    login: `
      <path d="M139 17 H166 V27 M166 45 V55 H139" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M136 36 H183 M172 25 L183 36 L172 47" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `
  };
  return `
    <g filter="url(#iconGlow)">
      <circle cx="160" cy="35" r="31" fill="${glow}"/>
      ${icons[icon] || ""}
    </g>
  `;
}

function imageButtonSvg(label, variant, icon = "") {
  const palette = {
    green: ["#178c45", "#064c2b", "#ffffff", "#10231b", "#f6d66d"],
    red: ["#e45138", "#8d251b", "#ffffff", "#2d1210", "#f6d66d"],
    dark: ["#153855", "#071929", "#ffffff", "#07111d", "#f6d66d"],
    paper: ["#1e4a66", "#0a2237", "#ffffff", "#07111d", "#f6d66d"],
    disabled: ["#6f7f94", "#293545", "#e5e7eb", "#172033", "#cbd5e1"]
  }[variant] || ["#178c45", "#064c2b", "#ffffff", "#10231b", "#f6d66d"];
  const lines = splitButtonLabel(label).map(escapeSvgText);
  const twoLines = lines.length > 1;
  const hasIcon = Boolean(icon);
  const fontSize = hasIcon ? 21 : twoLines ? 21 : label.length > 22 ? 23 : 27;
  const textStroke = palette[3];
  const y = hasIcon ? (twoLines ? 71 : 76) : twoLines ? 32 : 43;
  const textLengthFor = (line) => Math.min(twoLines ? 226 : 242, Math.max(twoLines ? 128 : 136, line.length * fontSize * 1.1));
  const text = lines.map((line, index) => (
    `<text x="160" y="${y + index * (hasIcon ? 17 : 23)}" text-anchor="middle" textLength="${textLengthFor(line)}" lengthAdjust="spacingAndGlyphs">${line}</text>`
  )).join("");
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ${hasIcon ? 100 : 72}">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="1" stop-color="${palette[1]}"/>
        </linearGradient>
        <filter id="shadow" x="-8%" y="-16%" width="116%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#1c2430" flood-opacity=".22"/>
        </filter>
        <filter id="iconGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${palette[4]}" flood-opacity=".45"/>
        </filter>
        <linearGradient id="shine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset=".5" stop-color="#ffffff" stop-opacity=".22"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="M15 10 C49 5 86 9 123 7 C172 4 223 5 303 12 C310 24 309 ${hasIcon ? 77 : 49} 303 ${hasIcon ? 89 : 61} C230 ${hasIcon ? 96 : 67} 182 ${hasIcon ? 92 : 63} 135 ${hasIcon ? 94 : 66} C86 ${hasIcon ? 97 : 69} 47 ${hasIcon ? 93 : 65} 15 ${hasIcon ? 88 : 60} C8 ${hasIcon ? 71 : 46} 8 24 15 10 Z" fill="url(#g)" filter="url(#shadow)"/>
      <path d="M18 13 C70 9 105 13 158 11 C207 9 258 12 299 17" fill="none" stroke="#ffffff" stroke-opacity=".34" stroke-width="3" stroke-linecap="round"/>
      <path d="M45 17 C87 16 128 18 168 16 C205 15 242 16 279 20 L267 31 C205 27 149 29 82 27 Z" fill="url(#shine)" opacity=".82"/>
      <path d="M23 ${hasIcon ? 84 : 56} C76 ${hasIcon ? 90 : 61} 117 ${hasIcon ? 86 : 58} 166 ${hasIcon ? 86 : 58} C209 ${hasIcon ? 85 : 57} 251 ${hasIcon ? 90 : 62} 292 ${hasIcon ? 84 : 56}" fill="none" stroke="${palette[4]}" stroke-opacity=".54" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="22" r="4" fill="#ffffff" fill-opacity=".62"/>
      <circle cx="291" cy="${hasIcon ? 76 : 51}" r="3" fill="#ffffff" fill-opacity=".34"/>
      ${imageButtonIconSvg(icon, palette)}
      <g font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="${palette[2]}" stroke="${textStroke}" stroke-width="${variant === "paper" ? 5 : 3}" paint-order="stroke" letter-spacing="0">
        ${text}
      </g>
    </svg>
  `.replace(/\s+/g, " ").trim();
}

function imageButtonUrl(label, variant, icon = "") {
  const key = `${variant}:${icon}:${label}`;
  if (!imageButtonCache.has(key)) {
    imageButtonCache.set(key, `url("data:image/svg+xml,${encodeURIComponent(imageButtonSvg(label, variant, icon))}")`);
  }
  return imageButtonCache.get(key);
}

function decorateImageButtons(root = document) {
  if (!root) return;
  root.querySelectorAll(IMAGE_BUTTON_SELECTOR).forEach((button) => {
    if (button.classList.contains("viewer-close")) {
      button.classList.remove("image-button");
      button.classList.remove("combat-art-button", "combat-start-button", "generated-text-button", "has-button-icon");
      button.style.removeProperty("--button-min-width");
      button.style.removeProperty("--button-art");
      button.style.removeProperty("--button-icon-art");
      button.dataset.imageButtonKey = "";
      return;
    }
    const label = buttonImageLabel(button);
    if (!label || button.childElementCount > 0 || button.classList.contains("art-view-button")) {
      button.classList.remove("image-button");
      button.classList.remove("combat-art-button", "combat-start-button", "generated-text-button", "has-button-icon");
      button.style.removeProperty("--button-min-width");
      button.style.removeProperty("--button-art");
      button.style.removeProperty("--button-icon-art");
      button.dataset.imageButtonKey = "";
      return;
    }
    const variant = buttonImageVariant(button);
    const asset = buttonImageAsset(button, label);
    const icon = asset ? "" : buttonImageIcon(button, label);
    const frame = asset ? "" : generatedButtonFrameAsset(variant);
    const iconAsset = asset ? "" : generatedButtonIconAsset(icon);
    const key = `${variant}:${asset || frame}:${iconAsset}:${label}:${button.disabled ? "off" : "on"}`;
    if (button.dataset.imageButtonKey === key) return;
    button.dataset.imageButtonKey = key;
    button.classList.add("image-button");
    button.classList.toggle("combat-art-button", Boolean(asset));
    button.classList.toggle("generated-text-button", !asset);
    button.classList.toggle("combat-start-button", asset === COMBAT_BUTTON_ART.start);
    button.classList.toggle("has-button-icon", Boolean(iconAsset));
    button.style.setProperty("--button-min-width", `${asset ? 132 : Math.min(iconAsset ? 188 : 250, Math.max(iconAsset ? 140 : 92, label.length * (iconAsset ? 9 : 8) + (iconAsset ? 74 : 44)))}px`);
    button.style.setProperty("--button-art", imageAssetUrl(asset || frame));
    if (iconAsset) button.style.setProperty("--button-icon-art", imageAssetUrl(iconAsset));
    else button.style.removeProperty("--button-icon-art");
  });
}

function setupOnlineLobbyRealtime() {
  window.setInterval(() => {
    if (state.server.enabled && state.online.socketStatus !== "online") connectOnlineSocket();
    if (state.currentTab === "online" && state.online.socketStatus !== "online") refreshOnlineLobbies();
  }, 10000);
}

function setupSocialRealtime() {
  window.setInterval(() => {
    if (!hasOnlineProfile()) return;
    refreshSocial();
  }, 6000);
}

function setupCompetitiveRealtime() {
  window.setInterval(() => {
    if (!state.matchmaking?.active || state.currentTab !== "competitive") return;
    renderCompetitive();
  }, 1000);
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
  document.getElementById("view-home")?.addEventListener("click", (event) => {
    if (handleShopPurchaseClick(event)) return;
    const button = event.target.closest("button[data-home-jump]");
    if (!button || button.disabled) return;
    switchTab(button.dataset.homeJump);
  });
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
  document.getElementById("trade-button").addEventListener("click", createFriendTrade);
  document.getElementById("reset-save-button").addEventListener("click", resetSave);
  document.getElementById("ranked-button").addEventListener("click", () => runRankedMatch("ranked"));
  document.getElementById("create-lobby-button").addEventListener("click", createOnlineLobby);
  document.getElementById("refresh-lobbies-button").addEventListener("click", () => refreshOnlineLobbies({ force: true }));
  document.getElementById("online-code-form").addEventListener("submit", handleOnlineCodeSubmit);
  document.getElementById("online-code-input").addEventListener("input", handleOnlineCodeInput);
  document.getElementById("online-current-card").addEventListener("click", handleOnlineLobbyClick);
  document.getElementById("online-lobby-list").addEventListener("click", handleOnlineLobbyClick);
  document.getElementById("tazzo-clash-panel")?.addEventListener("click", handleTazzoClashClick);
  document.getElementById("tazzo-clash-panel")?.addEventListener("change", handleTazzoClashChange);
  document.getElementById("tutorial-panel").addEventListener("click", handleTutorialControls);
  document.getElementById("tutorial-coach").addEventListener("click", handleTutorialControls);
  document.getElementById("tutorial-popover").addEventListener("click", handleTutorialControls);
  document.getElementById("tutorial-result-popup").addEventListener("click", handleTutorialControls);
  document.getElementById("reward-celebration")?.addEventListener("click", handleRewardCelebrationClick);
  document.getElementById("social-notice-stack")?.addEventListener("click", handleSocialNoticeClick);

  document.getElementById("friends-grid").addEventListener("click", (event) => {
    handleFriendsClick(event);
  });
  document.getElementById("friends-grid").addEventListener("submit", (event) => {
    handleFriendsSubmit(event);
  });

  document.getElementById("trade-offer").addEventListener("change", (event) => {
    updateTradeDraft("offerIds", selectedValues(event.target));
  });

  document.getElementById("trade-wish").addEventListener("change", (event) => {
    updateTradeDraft("requestIds", selectedValues(event.target));
  });
  document.getElementById("trade-friend")?.addEventListener("change", (event) => {
    state.social.tradeFriendId = event.target.value;
    renderTrade();
  });
  document.querySelector(".trade-board")?.addEventListener("click", handleTradeBoardClick);

  if (ENABLE_PLAYER_EDIT) setupEditActions();

  document.getElementById("tournament-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tournament]");
    if (!button || button.disabled) return;
    runTournament(button.dataset.tournament);
  });

  document.getElementById("shop-grid").addEventListener("click", handleShopPurchaseClick);
  document.getElementById("shop-grid").addEventListener("keydown", handleShopPurchaseKeydown);
  document.getElementById("shop-promo")?.addEventListener("click", handleShopPurchaseClick);
  document.getElementById("shop-reward-reveal")?.addEventListener("click", handleShopRewardRevealClick);

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
      if (state.rewardCelebration) hideRewardCelebration();
      if (state.shopRewardReveal) closeShopRewardReveal();
      closeTazzoViewer();
      const profileModal = document.getElementById("profile-modal");
      if (profileModal && !profileModal.hidden) closeProfileModal();
    }
  });
  setupHolographicArtMotion();
}

function handleShopPurchaseClick(event) {
  const target = event.target.closest("[data-shop]");
  if (!target) return false;
  const disabled = target.matches("button:disabled")
    || target.getAttribute("aria-disabled") === "true"
    || target.dataset.disabled === "true";
  if (disabled) return false;
  buyShopItem(target.dataset.shop);
  return true;
}

function handleShopPurchaseKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target.closest("[data-shop]");
  if (!target || target.tagName === "BUTTON") return;
  event.preventDefault();
  handleShopPurchaseClick(event);
}

function handleShopRewardRevealClick(event) {
  if (!event.target.closest("[data-close-shop-reward]")) return;
  closeShopRewardReveal();
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

function handleTazzoClashChange(event) {
  if (event.target.id === "tazzo-clash-friend") {
    state.social.clashFriendId = event.target.value;
    state.social.clashDraft = { offerIds: [], requestIds: [] };
    renderOnline();
    return;
  }
  if (event.target.dataset.clashPick) {
    updateTazzoClashPickDraft(event.target.dataset.clashPick, selectedValues(event.target));
  }
}

function handleTazzoClashClick(event) {
  const createButton = event.target.closest("button[data-clash-create]");
  if (createButton && !createButton.disabled) {
    createTazzoClash();
    return;
  }
  const acceptButton = event.target.closest("button[data-clash-accept]");
  if (acceptButton && !acceptButton.disabled) {
    respondTazzoClash(acceptButton.dataset.clashAccept, true);
    return;
  }
  const declineButton = event.target.closest("button[data-clash-decline]");
  if (declineButton && !declineButton.disabled) {
    respondTazzoClash(declineButton.dataset.clashDecline, false);
    return;
  }
  const pickButton = event.target.closest("button[data-clash-pick-submit]");
  if (pickButton && !pickButton.disabled) {
    submitTazzoClashPick(pickButton.dataset.clashPickSubmit);
    return;
  }
  const hitButton = event.target.closest("button[data-clash-hit]");
  if (hitButton && !hitButton.disabled) {
    hitTazzoClash(hitButton.dataset.clashHit, tazzoClashTimingScore(hitButton));
  }
}

function updateTazzoClashPickDraft(duelId, ids) {
  state.social.clashPickDrafts[duelId] = ids.filter((id) => MONSTER_BY_ID[id]).slice(0, 3);
  refreshTazzoClashSelectionUi(duelId);
}

function isEditingTazzoClashPick() {
  return Boolean(document.activeElement?.matches?.("[data-clash-pick]"));
}

function refreshVisibleTazzoClashSelectionUi() {
  const select = document.activeElement?.matches?.("[data-clash-pick]")
    ? document.activeElement
    : document.querySelector("[data-clash-pick]");
  const duelId = select?.dataset?.clashPick;
  if (duelId) refreshTazzoClashSelectionUi(duelId);
}

function refreshTazzoClashSelectionUi(duelId) {
  const clash = state.social.clashes.find((item) => item.id === duelId);
  const card = document.querySelector(`[data-clash-duel-card="${CSS.escape(duelId)}"]`);
  if (!clash || !card) return;
  const playerId = state.server.playerId;
  const fromYou = clash.fromPlayerId === playerId;
  const friendIds = fromYou ? clash.requestedIds || [] : clash.offeredIds || [];
  const draftIds = state.social.clashPickDrafts[duelId] || [];
  const draftValue = tazzoClashValue(draftIds);
  const friendValue = tazzoClashValue(friendIds);
  const balanced = Boolean(friendIds.length && draftValue === friendValue);
  const statusText = !friendIds.length
    ? "Aguardando a escolha do amigo."
    : balanced
    ? "Valores iguais. Ao confirmar, a mesa comeca."
    : `Valores ainda diferentes: ${draftValue} x ${friendValue}.`;
  const balance = card.querySelector("[data-clash-balance]");
  balance?.classList.toggle("is-balanced", balanced);
  balance?.classList.toggle("is-warning", !balanced);
  const yourValue = card.querySelector("[data-clash-your-value]");
  const friendValueNode = card.querySelector("[data-clash-friend-value]");
  const status = card.querySelector("[data-clash-pick-status]");
  if (yourValue) yourValue.textContent = String(draftValue);
  if (friendValueNode) friendValueNode.textContent = String(friendValue);
  if (status) status.textContent = statusText;
  const submit = card.querySelector("[data-clash-pick-submit]");
  if (submit) submit.disabled = !draftIds.length;
}

function tazzoClashTimingScore(button) {
  const card = button.closest(".tazzo-clash-duel");
  const meter = card?.querySelector("[data-clash-meter]");
  const thumb = meter?.querySelector(".clash-meter-thumb");
  const zone = meter?.querySelector(".clash-meter-zone");
  if (!meter || !thumb || !zone) return 0;
  const meterRect = meter.getBoundingClientRect();
  const thumbRect = thumb.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  if (!meterRect.width || !thumbRect.width || !zoneRect.width) return 0;
  const thumbCenter = thumbRect.left + thumbRect.width / 2;
  const zoneCenter = zoneRect.left + zoneRect.width / 2;
  const distance = Math.abs(thumbCenter - zoneCenter);
  const maxDistance = meterRect.width / 2;
  return clamp(1 - distance / maxDistance, 0, 1);
}

async function createTazzoClash() {
  if (!requireOnlineProfile("Entre em uma conta para bater tazzos com amigos.")) return;
  const friendPlayerId = state.social.clashFriendId;
  if (!friendPlayerId) return;
  try {
    await postServerMutation(SERVER_TAZZO_CLASH_CREATE_ENDPOINT, {
      friendPlayerId
    }, "Convidando");
    state.social.message = "Convite para bater tazzos enviado.";
    state.social.error = "";
    playSfx("tazzo-clash-invite");
  } catch (error) {
    state.social.error = error.message || "Convite nao enviado.";
  }
  renderAll();
}

async function respondTazzoClash(duelId, accept) {
  if (!requireOnlineProfile()) return;
  try {
    await postServerMutation(SERVER_TAZZO_CLASH_RESPOND_ENDPOINT, { duelId, accept }, accept ? "Aceitando duelo" : "Recusando duelo");
    state.social.message = accept ? "Duelo aceito. Agora escolham os tazzos." : "Duelo recusado.";
    state.social.error = "";
    playSfx(accept ? "tazzo-clash-accept" : "trade-decline");
  } catch (error) {
    state.social.error = error.message || "Nao foi possivel responder ao duelo.";
  }
  renderAll();
}

async function submitTazzoClashPick(duelId) {
  if (!requireOnlineProfile()) return;
  const monsterIds = state.social.clashPickDrafts[duelId] || [];
  if (!monsterIds.length) {
    state.social.error = "Escolha de 1 a 3 tazzos para colocar na mesa.";
    renderOnline();
    return;
  }
  try {
    const payload = await postServerMutation(SERVER_TAZZO_CLASH_PICK_ENDPOINT, {
      duelId,
      monsterIds
    }, "Escolhendo tazzos");
    const result = payload?.clashResult || {};
    state.social.message = result.status === "active"
      ? "Apostas equilibradas. Cara ou coroa definiu a primeira batida."
      : `Escolha enviada (${result.offerValue || 0} x ${result.requestValue || 0}).`;
    state.social.error = "";
    playSfx(result.status === "active" ? "tazzo-clash-coin" : "ui-confirm", { pitch: 0.03 });
  } catch (error) {
    state.social.error = error.message || "Escolha nao enviada.";
  }
  renderAll();
}

async function hitTazzoClash(duelId, timingScore = 0) {
  if (!requireOnlineProfile()) return;
  try {
    const payload = await postServerMutation(SERVER_TAZZO_CLASH_HIT_ENDPOINT, {
      duelId,
      timingScore
    }, timingScore >= TAZZO_CLASH_PERFECT_SCORE ? "Batida perfeita" : "Batendo");
    const result = payload?.clashResult || {};
    state.social.clashAnimation = {
      duelId,
      at: Date.now(),
      flippedKeys: result.flippedKeys || [],
      perfect: Boolean(result.perfect)
    };
    state.social.message = result.flippedKeys?.length
      ? `${result.flippedKeys.length} tazzo(s) viraram${result.perfect ? " com timing perfeito" : ""}.`
      : "Nenhum tazzo virou nessa batida.";
    state.social.error = "";
    playSfx(result.perfect ? "tazzo-clash-perfect" : "tazzo-clash-hit", { pitch: 0.04 });
    window.setTimeout(() => {
      playSfx(result.flippedKeys?.length ? "tazzo-clash-flip" : "tazzo-clash-miss", { pitch: 0.04 });
    }, 280);
    window.setTimeout(() => {
      if (state.social.clashAnimation?.duelId !== duelId) return;
      state.social.clashAnimation = null;
      if (state.currentTab === "online") renderOnline();
    }, TAZZO_CLASH_HIT_ANIMATION_MS);
  } catch (error) {
    state.social.error = error.message || "Batida recusada.";
  }
  renderAll();
}

async function createOnlineLobby() {
  const payload = await postOnlineLobbyAction("create", {}, "Criando sala");
  if (payload?.currentLobby?.id) {
    state.online.inviteMessage = `Sala ${payload.currentLobby.id} criada. Copie o convite para chamar alguem.`;
    state.online.inviteMessageType = "success";
    playSfx("online-lobby");
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
  if (payload?.currentLobby?.id === code) playSfx("online-lobby");
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
  playSfx("ui-confirm");
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
    acted: Boolean(piece.acted),
    cosmetics: normalizeFieldCosmetics(piece.cosmetics)
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
    if (event.action === "keeper") showOnlineKeeperFeedback(event);
    playBattleActionSfx(event.action, { volume: event.isYours ? 0.86 : 0.68 });
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

function showOnlineKeeperFeedback(event) {
  if (!state.battle?.online || event?.action !== "keeper") return;
  const sequence = Number(event.sequence) || 0;
  if (sequence && sequence <= (Number(state.battle.online.keeperFeedbackSequence) || 0)) return;
  const side = event.isYours ? "player" : "cpu";
  const keeper = battleGoalkeeper(side);
  if (!keeper?.monsterId) return;
  const actor = state.battle.pieces.find((piece) => piece.side === side && piece.hp > 0);
  const from = actor ? { x: actor.x, y: actor.y } : { x: side === "player" ? 0 : 6, y: 2 };
  const animation = {
    side,
    stage: "resolve",
    actorId: actor?.id || null,
    targetId: null,
    keeperMonsterId: keeper.monsterId,
    action: "keeper",
    from,
    to: from,
    text: event.message || `${event.actorName || "Jogador"} usou o goleiro.`
  };
  state.battle.online.keeperFeedbackSequence = sequence || Date.now();
  state.battle.animation = animation;
  state.battle.status = animation.text;
  if (typeof scheduleBattleAnimationClear === "function") {
    scheduleBattleAnimationClear(animation);
  }
  playSfx("keeper-activate", { volume: event.isYours ? 0.9 : 0.72 });
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
  playBattleActionSfx(action);
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
  playSfx(state.battle.pendingAction ? "action-select" : "ui-back");
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
  playSfx("target-select");
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
    cosmetics: {
      player: normalizeFieldCosmetics(match.playerCosmetics),
      cpu: normalizeFieldCosmetics(match.enemyCosmetics)
    },
    stateSequence: -1,
    lastActionSequence: 0,
    keeperFeedbackSequence: 0,
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
    state.server.profileMode = "login";
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
    state.firebase.message = "Login social nao carregou. Tente novamente em instantes.";
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
    beginServerIdentityTransition();
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
    applyProfile(payload.profile);
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
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
  if (!gate || !loginButton) return;

  loginButton.addEventListener("click", () => openProfileModal("login", { fromEntryGate: true }));
  if (registerButton) registerButton.addEventListener("click", () => openProfileModal("register", { fromEntryGate: true }));
}

function entryGateStatusText() {
  if (state.firebase.loading) return state.firebase.message || "Abrindo login social...";
  if (state.firebase.message) return state.firebase.message;
  if (!canUseServerSave()) return "Abra pelo servidor online para criar ou entrar em um perfil.";
  if (state.server.loading || state.server.status === "connecting") return "Conectando ao servidor...";
  if (!state.server.enabled || state.server.status === "error") return "Servidor indisponivel agora. Conta online obrigatoria para jogar.";
  if (state.firebase.enabled) return `Servidor online. Use ${firebaseProviderListLabel()} para criar ou entrar na sua conta.`;
  return "Servidor online. Login social obrigatorio para criar conta nova.";
}

function renderEntryGate() {
  const gate = document.getElementById("entry-gate");
  if (!gate) return;
  const status = document.getElementById("entry-status");
  const loginButton = document.getElementById("entry-login-button");
  const registerButton = document.getElementById("entry-register-button");
  const shouldShow = canUseServerSave()
    && !state.server.profile
    && !state.server.entryGatePaused;
  gate.hidden = !shouldShow;
  if (status) status.textContent = entryGateStatusText();

  const accountDisabled = state.server.loading || !state.server.enabled;
  if (loginButton) loginButton.disabled = accountDisabled;
  if (registerButton) registerButton.disabled = accountDisabled;
  decorateImageButtons(gate);
}

function openProfileModal(mode = state.server.profileMode, options = {}) {
  state.server.profileMessage = "";
  state.server.profileMode = "login";
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
  const mode = "login";
  state.server.profileMode = mode;
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
  title.textContent = "Entrar no perfil";
  submit.textContent = "Entrar";
  message.textContent = state.server.profileMessage;
  message.classList.toggle("is-error", state.server.profileMessageType === "error");
  logoutButton.hidden = !profile;
  logoutButton.textContent = profile?.authProvider === "firebase" ? "Sair da conta social" : "Sair do perfil";
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
  const action = "login";
  setProfileMessage("Entrando...");

  try {
    if (state.server.saveTimer) await pushServerSave();
    beginServerIdentityTransition();
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
    applyProfile(payload.profile);
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
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
    beginServerIdentityTransition();
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
  state.server.playerId = "";
  persistLocalSave();
  applyProfile(null);
  closeProfileModal();
  setServerStatus("connecting", "Conectando");
  await loadServerSave();
  renderAll();
}

function setupSoundEffects() {
  SFX_NAMES.forEach((name) => preloadSfx(name));
  document.addEventListener("pointerdown", unlockSoundEffects, { once: true, capture: true });
  document.addEventListener("keydown", unlockSoundEffects, { once: true, capture: true });
  document.addEventListener("click", handleGlobalSfxClick, true);
}

function audioConstructor() {
  if (typeof Audio !== "undefined") return Audio;
  if (typeof window !== "undefined" && typeof window.Audio !== "undefined") return window.Audio;
  return null;
}

function preloadSfx(name) {
  const AudioCtor = audioConstructor();
  if (state.sfx.cache.has(name) || !SFX_FILES[name] || !AudioCtor) return null;
  const audio = new AudioCtor(SFX_FILES[name]);
  audio.preload = "auto";
  state.sfx.cache.set(name, audio);
  return audio;
}

function sfxContext() {
  if (state.sfx.context) return state.sfx.context;
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    state.sfx.context = new AudioContextCtor();
  } catch (error) {
    state.sfx.context = null;
  }
  return state.sfx.context;
}

function sfxMasterVolume() {
  const volume = Number(state.save?.sfxVolume);
  return Number.isFinite(volume) ? clamp(volume, 0, 1) : DEFAULT_SFX_VOLUME;
}

function sfxPlaybackRate(options = {}) {
  return clamp(options.rate || (options.pitch ? 1 + (Math.random() * 2 - 1) * options.pitch : 1), 0.72, 1.35);
}

function decodeSfx(name) {
  if (!SFX_FILES[name] || typeof fetch !== "function") return Promise.resolve(null);
  const context = sfxContext();
  if (!context) return Promise.resolve(null);
  if (state.sfx.buffers.has(name)) return Promise.resolve(state.sfx.buffers.get(name));
  if (state.sfx.loading.has(name)) return state.sfx.loading.get(name);

  const request = fetch(SFX_FILES[name])
    .then((response) => {
      if (!response.ok) throw new Error(`SFX ${name} HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      state.sfx.buffers.set(name, buffer);
      state.sfx.loading.delete(name);
      return buffer;
    })
    .catch(() => {
      state.sfx.loading.delete(name);
      return null;
    });
  state.sfx.loading.set(name, request);
  return request;
}

function unlockSoundEffects() {
  state.sfx.unlocked = true;
  const context = sfxContext();
  if (context?.state === "suspended") context.resume().catch(() => {});
  decodeSfx("ui-click").catch(() => {});
  const audio = preloadSfx("ui-click");
  if (!audio) return;
  audio.muted = true;
  audio.play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    })
    .catch(() => {
      audio.muted = false;
    });
}

function playSfx(name, options = {}) {
  if (!SFX_FILES[name]) return;
  const now = Date.now();
  const cooldown = options.cooldown ?? SFX_COOLDOWN_MS[name] ?? 0;
  if (cooldown && now - (state.sfx.lastPlayed[name] || 0) < cooldown) return;
  state.sfx.lastPlayed[name] = now;
  const baseVolume = SFX_VOLUME[name] ?? 0.88;
  const volume = clamp(baseVolume * sfxMasterVolume() * (options.volume ?? 1), 0, 1);
  if (!volume) return;
  const rate = sfxPlaybackRate(options);
  const context = sfxContext();
  if (context) {
    if (context.state === "suspended") context.resume().catch(() => {});
    const buffer = state.sfx.buffers.get(name);
    if (buffer) {
      playSfxBuffer(buffer, volume, rate);
      return;
    }
    decodeSfx(name).then((decoded) => {
      if (decoded) {
        playSfxBuffer(decoded, volume, rate);
      } else {
        playSfxElement(name, volume, rate);
      }
    });
    return;
  }
  playSfxElement(name, volume, rate);
}

function playSfxBuffer(buffer, volume, rate) {
  const context = state.sfx.context;
  if (!context || !buffer) return;
  try {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    state.sfx.active.add(source);
    source.onended = () => state.sfx.active.delete(source);
    source.start(0);
  } catch (error) {}
}

function playSfxElement(name, volume, rate) {
  const AudioCtor = audioConstructor();
  if (!AudioCtor) return;
  const source = preloadSfx(name);
  const audio = source?.cloneNode ? source.cloneNode() : new AudioCtor(SFX_FILES[name]);
  if (!audio.src) audio.src = SFX_FILES[name];
  audio.preload = "auto";
  audio.volume = volume;
  audio.playbackRate = rate;
  state.sfx.active.add(audio);
  const cleanup = () => state.sfx.active.delete(audio);
  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });
  audio.play().catch(cleanup);
}

function handleGlobalSfxClick(event) {
  const button = event.target.closest?.("button");
  if (!button) return;
  const sound = buttonSfx(button);
  if (sound) playSfx(sound);
}

function buttonSfx(button) {
  if (button.disabled) return "ui-disabled";
  if (button.matches(".tab-button")) return "tab-switch";
  if (button.matches(".wallet-info-button")) return "wallet-pop";
  if (button.matches(".viewer-close") || button.dataset.closePackResults || button.dataset.rewardClose) return "ui-back";
  if (button.dataset.startBattle) return "battle-start";
  if (button.dataset.openBattleScene || button.dataset.openOnlineBattle) return "modal-open";
  if (button.dataset.pack) return "pack-buy";
  if (button.dataset.shop) return "purchase";
  if (button.dataset.tournament) return "matchmaking";
  if (button.dataset.claim || button.dataset.claimReady || button.dataset.tutorialReward) return "mission-claim";
  if (button.dataset.shareReward) return "friend-invite";
  if (button.dataset.friendAccept || button.dataset.tradeAccept) return "trade-accept";
  if (button.dataset.friendDecline || button.dataset.tradeDecline) return "trade-decline";
  if (button.dataset.lobbyAction || button.dataset.joinLobby) return "online-lobby";
  if (button.dataset.clashCreate) return "tazzo-clash-invite";
  if (button.dataset.clashRespond === "accept") return "tazzo-clash-accept";
  if (button.dataset.clashRespond === "decline") return "trade-decline";
  if (button.dataset.clashPickSubmit) return "tazzo-clash-coin";
  if (button.dataset.clashHit) return "tazzo-clash-hit";
  if (button.dataset.team || button.dataset.slot) return "team-slot";
  if (button.dataset.goalkeeper) return "goalkeeper-set";
  if (button.dataset.upgrade) return "upgrade";
  if (button.dataset.action || button.dataset.reveal) return "";
  return "ui-click";
}

function revealSfxForRarity(rarity) {
  const normalized = normalizeRarity(rarity, "Comum");
  if (normalized === "Mistico" || normalized === "Mistico Secreto") return "reveal-mystic";
  if (normalized === "Lendario") return "reveal-legendary";
  if (normalized === "Epico") return "reveal-epic";
  if (normalized === "Raro") return "reveal-rare";
  if (normalized === "Incomum") return "reveal-uncommon";
  return "reveal-common";
}

function battleActionSfx(action) {
  return {
    move: "move-slide",
    retreat: "retreat-slide",
    swap: "swap",
    dribble: "dribble-hit",
    shot: "shot-kick",
    pressure: "pressure-push",
    pass: "pass-turn",
    keeper: "keeper-charge"
  }[action] || "action-select";
}

function playBattleActionSfx(action, options = {}) {
  const sound = battleActionSfx(action);
  if (sound) playSfx(sound, { pitch: 0.04, ...options });
}

function setupMusicPlayer() {
  const player = document.getElementById("music-player");
  const audio = document.getElementById("music-audio");
  const playButton = document.getElementById("music-play-button");
  const toggleButton = document.getElementById("music-toggle-button");
  const collapseButton = document.getElementById("music-collapse-button");
  const nextButton = document.getElementById("music-next-button");
  const volumeControl = document.getElementById("music-volume-control");
  if (!player || !audio || !playButton || !toggleButton || !collapseButton || !nextButton || !volumeControl) return;

  state.music.audio = audio;
  audio.volume = clamp(Number(state.save.musicVolume), 0, 1);
  volumeControl.value = String(audio.volume);
  setMusicTrack(state.save.musicTrackIndex, { autoplay: false });

  playButton.addEventListener("click", toggleMusicPlayback);
  toggleButton.addEventListener("click", () => {
    if (state.music.collapsed) {
      setMusicPlayerCollapsed(false);
      return;
    }
    toggleMusicPlayback();
  });
  collapseButton.addEventListener("click", () => setMusicPlayerCollapsed(!state.music.collapsed));
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
  requestMusicAutoplay();
}

function requestMusicAutoplay() {
  playMusic({ fallbackToGesture: true });
}

function armMusicAutoplay() {
  if (state.music.autoplayArmed) return;
  state.music.autoplayArmed = true;
  const resume = () => {
    state.music.autoplayArmed = false;
    window.removeEventListener("pointerdown", resume, true);
    window.removeEventListener("keydown", resume, true);
    window.removeEventListener("touchstart", resume, true);
    playMusic();
  };
  window.addEventListener("pointerdown", resume, { once: true, capture: true });
  window.addEventListener("keydown", resume, { once: true, capture: true });
  window.addEventListener("touchstart", resume, { once: true, capture: true });
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

function setMusicPlayerCollapsed(collapsed) {
  state.music.collapsed = Boolean(collapsed);
  syncMusicPlayer();
}

function playMusic(options = {}) {
  const audio = state.music.audio;
  if (!audio || !MUSIC_TRACKS.length) return;
  audio.play().catch(() => {
    state.music.isPlaying = false;
    if (options.fallbackToGesture) armMusicAutoplay();
    syncMusicPlayer();
  });
}

function syncMusicPlayer() {
  const player = document.getElementById("music-player");
  const trackName = document.getElementById("music-track-name");
  const playButton = document.getElementById("music-play-button");
  const toggleButton = document.getElementById("music-toggle-button");
  const collapseButton = document.getElementById("music-collapse-button");
  const volumeControl = document.getElementById("music-volume-control");
  const audio = state.music.audio;
  const track = MUSIC_TRACKS[state.save.musicTrackIndex] || MUSIC_TRACKS[0];
  const isPlaying = Boolean(audio && !audio.paused && !audio.ended);
  const collapsed = Boolean(state.music.collapsed);
  if (trackName && track) trackName.textContent = track.name;
  if (playButton) playButton.textContent = isPlaying ? "Pausar" : "Play";
  if (toggleButton) toggleButton.setAttribute("aria-label", collapsed ? "Expandir player de musicas" : isPlaying ? "Pausar musica" : "Tocar musica");
  if (collapseButton) {
    collapseButton.setAttribute("aria-label", collapsed ? "Expandir player de musicas" : "Recolher player de musicas");
    collapseButton.setAttribute("aria-expanded", String(!collapsed));
  }
  if (volumeControl && audio) volumeControl.value = String(audio.volume);
  if (player) player.classList.toggle("is-playing", isPlaying);
  if (player) {
    player.classList.toggle("is-collapsed", collapsed);
    decorateImageButtons(player);
  }
}

function holographicArtFromPointerTarget(target) {
  const directArt = target.closest?.("[data-holo-art]");
  if (directArt) return directArt;
  const revealedPullCard = target.closest?.(".pull-card:not(.is-hidden):not(.is-flipping)");
  return revealedPullCard?.querySelector("[data-holo-art]") || null;
}

function canUseHolographicPointerMotion(art) {
  if (!art || art.closest("[data-viewer-tilt]")) return false;
  const pullCard = art.closest(".pull-card");
  return !pullCard || (!pullCard.classList.contains("is-hidden") && !pullCard.classList.contains("is-flipping"));
}

function setupHolographicArtMotion() {
  document.addEventListener("pointermove", (event) => {
    const art = holographicArtFromPointerTarget(event.target);
    if (!canUseHolographicPointerMotion(art)) return;
    const rect = art.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    updateHolographicArt(art, x, y, art.closest(".pull-card") ? 0 : 8);
  });

  document.addEventListener("pointerout", (event) => {
    const art = holographicArtFromPointerTarget(event.target);
    if (!canUseHolographicPointerMotion(art)) return;
    if (event.relatedTarget && art.contains(event.relatedTarget)) return;
    const pullCard = art.closest(".pull-card");
    if (event.relatedTarget && pullCard?.contains(event.relatedTarget)) return;
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
  const wishlistButton = event.target.closest("[data-viewer-wishlist]");
  const viewer = document.getElementById("tazzo-viewer");
  if (flipButton) {
    event.preventDefault();
    event.stopPropagation();
    flipTazzoViewer(flipButton);
    return;
  }

  if (wishlistButton) {
    event.preventDefault();
    event.stopPropagation();
    const monsterId = wishlistButton.dataset.viewerWishlist;
    if (MONSTER_BY_ID[monsterId]) {
      toggleWishlist(monsterId, { render: false });
      syncViewerWishlistButton(wishlistButton, monsterId);
    }
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
  playSfx("card-zoom", { pitch: 0.03 });
  const copies = state.save.collection[monster.id] || 0;
  const stats = monsterStats(monster);
  const keeper = isGoalkeeper(monster);
  const level = keeper ? 0 : upgradeLevel(monster.id);
  const abilityText = keeperAbilityText(monster);
  const ownedText = copies ? `${copies} copia(s) no album` : "Ainda nao obtido";
  const wishlist = viewerWishlistState(monster.id);
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
        <div class="viewer-title-row">
          <h2 id="tazzo-viewer-title">${monster.name}</h2>
          <button class="wishlist-button viewer-wishlist-button${wishlist.wanted ? " is-active" : ""}" type="button" data-viewer-wishlist="${monster.id}" aria-pressed="${wishlist.wanted ? "true" : "false"}" aria-label="${wishlist.label}" title="${wishlist.label}">
            <span aria-hidden="true">&#9829;</span>
            <span>${wishlist.text}</span>
          </button>
        </div>
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
  decorateImageButtons(viewer);
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

function viewerWishlistState(monsterId) {
  const wanted = Boolean(state.save.wishlist?.[monsterId]);
  return {
    wanted,
    label: wanted ? "Remover dos favoritos" : "Favoritar tazzo",
    text: wanted ? "Favoritado" : "Favoritar"
  };
}

function syncViewerWishlistButton(button, monsterId) {
  const wishlist = viewerWishlistState(monsterId);
  button.classList.toggle("is-active", wishlist.wanted);
  button.setAttribute("aria-pressed", wishlist.wanted ? "true" : "false");
  button.setAttribute("aria-label", wishlist.label);
  button.setAttribute("title", wishlist.label);
  const text = button.querySelector("span:last-child");
  if (text) text.textContent = wishlist.text;
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
  }) && state.save.team.length === 3 && Boolean(state.save.goalkeeper);
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

function activeSavedCompetitive() {
  const match = state.save.activeCompetitive;
  return match && !match.resolved ? match : null;
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
  const toggleButton = event.target.closest("button[data-tutorial-toggle]");
  if (toggleButton) {
    state.tutorialExpanded = !state.tutorialExpanded;
    renderTutorialCoach();
    decorateImageButtons(document.getElementById("tutorial-coach"));
    return;
  }

  const collapseButton = event.target.closest("button[data-tutorial-collapse]");
  if (collapseButton) {
    state.tutorialExpanded = false;
    renderTutorialCoach();
    decorateImageButtons(document.getElementById("tutorial-coach"));
    return;
  }

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
  state.tutorialExpanded = false;
  handleTutorialAction(actionButton.dataset.tutorialAction);
}

function handleTutorialAction(stepId) {
  trackTelemetry("tutorial:action", { stepId }, {
    dedupeKey: `tutorial:action:${stepId}`,
    cooldown: 400
  });

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

  if (stepId === "clash") {
    switchTab("online");
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
  renderHome();
  renderBattle();
  renderPacks();
  renderCollection();
  if (ENABLE_PLAYER_EDIT) renderEdit();
  renderFriends();
  renderTrade();
  renderOnline();
  renderCompetitive();
  renderShop();
  renderTutorial();
  renderMissions();
  renderEntryGate();
  renderStarterOnboarding();
  renderTutorialCoach();
  renderTutorialPopover();
  renderTutorialResultPopup();
  renderShopRewardReveal();
  decorateImageButtons();
}

function applySelectedCosmetic() {
  ["cosmetic", "cosmeticTeam", "cosmeticAlbum", "cosmeticPack", "cosmeticProfile"].forEach((key) => {
    delete document.body.dataset[key];
  });
  const equipped = sanitizeEquippedCosmetics(state.save.equippedCosmetics, state.save.cosmetics, state.save.selectedCosmetic);
  state.save.equippedCosmetics = equipped;
  Object.entries(equipped).forEach(([slot, itemId]) => {
    const datasetKey = `cosmetic${slot.charAt(0).toUpperCase()}${slot.slice(1)}`;
    document.body.dataset[datasetKey] = itemId;
  });
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
      title: "Trocas apresentadas",
      body: "A mesa de trocas mostra amigos, oferta, pedido e desejo. Ela fica disponivel quando voce tiver amigos jogando, mas nao trava seu progresso."
    },
    clash: {
      title: "Bater tazzos apresentado",
      body: "O duelo social fica em Online. Primeiro voce convida um amigo; se ele aceitar, os dois escolhem tazzos equivalentes e batem na mesa."
    },
    tournament: {
      title: "Torneios apresentados",
      body: "Aqui ficam as chaves com entrada, premio e adversario. O tutorial so mostra onde elas estao; jogar fica para quando voce quiser."
    },
    ranked: {
      title: "Ranqueada apresentada",
      body: "A liga competitiva e o matchmaking ficam nesta area. Voce viu onde entrar sem precisar disputar uma partida agora."
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
  trackTelemetry("tutorial:step_ready", { stepId }, {
    dedupeKey: `tutorial:step_ready:${stepId}`,
    cooldown: 0
  });
  renderTutorialResultPopup();
  return true;
}

function confirmTutorialResult() {
  const result = state.tutorialResult;
  if (!result) return;
  state.tutorialResult = null;
  let newlyCompleted = false;
  if (state.save.tutorial && !state.save.tutorial[result.stepId]) {
    state.save.tutorial[result.stepId] = true;
    newlyCompleted = true;
  }
  if (newlyCompleted) {
    trackTelemetry("tutorial:complete", {
      stepId: result.stepId,
      completed: completedTutorialCount(),
      total: TUTORIAL_STEPS.length
    }, {
      dedupeKey: `tutorial:complete:${result.stepId}`,
      cooldown: 0
    });
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
  refreshWalletInfoContent();
}

function homeCollectionProgress() {
  const visibleMonsters = visibleCollectionMonsters();
  const owned = visibleMonsters.filter((monster) => state.save.collection[monster.id] > 0).length;
  return { owned, total: visibleMonsters.length };
}

function renderHome() {
  const bannerGrid = document.getElementById("home-banner-grid");
  const summaryGrid = document.getElementById("home-summary-grid");
  if (!bannerGrid || !summaryGrid) return;
  renderHomePromo();

  const collection = homeCollectionProgress();
  const rank = currentRank();
  const next = nextRank();
  const tutorialDone = completedTutorialCount();
  const tutorialTotal = TUTORIAL_STEPS.length;
  const activeCompetitive = activeSavedCompetitive();
  const profileName = state.server.profile?.name || "Visitante";
  const starterReady = Boolean(state.save.starterOnboardingComplete);

  const banners = [
    {
      tab: starterReady ? "packs" : "packs",
      art: "assets/icones/abrir_salgadinhos.png",
      eyebrow: starterReady ? "Pacotinhos" : "Boas-vindas",
      title: starterReady ? "Salgadinhos no recreio" : "Abra seu primeiro recheado",
      body: starterReady
        ? "Revele tazzos, junte fragmentos e procure raridades para fortalecer o album."
        : "O time inicial vem de um salgadinho especial com atacante, meia, zagueiro, goleiro e lendario.",
      cta: starterReady ? "Abrir pacotinhos" : "Comecar"
    },
    {
      tab: "shop",
      art: "assets/icones/banner_loja.png",
      eyebrow: "Promocoes",
      title: "Merreis na loja",
      body: "Veja pacotes de Merreis para abrir pacotinhos, entrar em torneios e acelerar sua colecao.",
      cta: "Ver loja"
    },
    {
      tab: activeCompetitive ? "battle" : "competitive",
      art: "assets/icones/banner_torneios.png",
      eyebrow: "Competitivo",
      title: activeCompetitive ? "Partida ativa" : "Liga e torneios",
      body: activeCompetitive
        ? "Existe uma partida competitiva esperando resolucao na arena."
        : "Suba no ranking, entre em torneios e proteja seu piso de divisao.",
      cta: activeCompetitive ? "Continuar batalha" : "Ver torneios"
    },
    {
      tab: "trade",
      art: "assets/icones/banner_troca.png",
      eyebrow: "Trocas",
      title: "Mesa de propostas",
      body: "Conheca ofertas, lista de desejo e valores antes de depender de amigos online.",
      cta: "Ver trocas"
    }
  ];

  bannerGrid.innerHTML = banners.map(homeBannerTemplate).join("");
  summaryGrid.innerHTML = [
    homeSummaryTemplate("Jogador", profileName, state.server.profile ? "Perfil online" : "Entre para salvar online", "home"),
    homeSummaryTemplate("Album", `${collection.owned}/${collection.total}`, `${formatNumber(state.save.fragments)} fragmentos`, "collection"),
    homeSummaryTemplate("Time", `${state.save.team.length}/3`, `Custo ${teamCost()} - poder ${Math.round(teamPower())}`, "battle"),
    homeSummaryTemplate("Liga", rank.name, next ? `${Math.max(0, next.min - state.save.trophies)} pontos ate ${next.name}` : "Topo atual", "competitive"),
    homeSummaryTemplate("Tutorial", `${tutorialDone}/${tutorialTotal}`, state.save.tutorialRewardClaimed ? "Recompensa recebida" : "Recompensa pendente", "missions"),
    homeSummaryTemplate("Carteira", `${formatNumber(state.save.merreis)} Merreis`, `${formatNumber(state.save.fragments)} fragmentos`, "shop")
  ].join("");
}

function renderHomePromo() {
  const slot = document.getElementById("home-promo-banner");
  if (!slot) return;
  const promoItem = shopPromoItem();
  const promoHtml = promoItem && shopPromoAvailable(promoItem)
    ? shopPromoBanner(promoItem, "home")
    : "";
  slot.innerHTML = promoHtml;
  slot.hidden = !promoHtml;
}

function shopPromoItem() {
  return SHOP_ITEMS.find((item) => item.id === STARTER_PROMO_ITEM_ID && item.featured) || null;
}

function shopPromoAvailable(item = shopPromoItem()) {
  if (!item) return false;
  if (state.shopRewardReveal?.itemId === item.id) return false;
  return !shopPromoPurchased(item);
}

function shopPromoPurchased(item = shopPromoItem()) {
  return Boolean(item?.oneTime && state.save.oneTimePurchases?.[item.id]);
}

function shopPromoBanner(item = shopPromoItem(), placement = "shop") {
  if (!item) return "";
  if (shopPromoPurchased(item) || state.shopRewardReveal?.itemId === item.id) return "";
  const payments = state.shopPayments || {};
  const purchased = Boolean(state.save.oneTimePurchases?.[item.id]);
  const paymentUnavailable = item.type === "merreis" && payments.checked && !payments.configured;
  const disabled = purchased || payments.checkoutPending || paymentUnavailable;
  const status = purchased ? "Oferta indisponivel" : "Compra unica por conta";
  const actionLabel = purchased
    ? "Ja comprado nesta conta"
    : payments.checkoutPending
    ? "Abrindo checkout..."
    : paymentUnavailable
    ? "Indisponivel"
    : `Comprar por ${item.priceLabel}`;
  const rewardText = [
    item.merreis ? `${formatNumber(item.merreis)} Merreis` : "",
    item.fragments ? `${formatNumber(item.fragments)} fragmentos` : "",
    item.legendaryCards ? `${formatNumber(item.legendaryCards)} lendarios` : ""
  ].filter(Boolean).join(" + ");
  return `
    <article class="shop-promo-banner is-${escapeHtmlAttribute(placement)}${disabled ? " is-disabled" : ""}">
      <button class="shop-promo-button" type="button" data-shop="${escapeHtmlAttribute(item.id)}" ${disabled ? "disabled" : ""}>
        <img class="shop-promo-image" src="${escapeHtmlAttribute(item.bannerImage || item.image)}" alt="${escapeHtmlAttribute(item.name)}">
        <span class="shop-promo-info">
          <span class="eyebrow">${status}</span>
          <strong>${escapeHtmlAttribute(item.name)}</strong>
          <small>${escapeHtmlAttribute(rewardText)}</small>
        </span>
        <span class="shop-promo-action">
          <span class="chip">${escapeHtmlAttribute(item.priceLabel)}</span>
          <span>${escapeHtmlAttribute(actionLabel)}</span>
        </span>
      </button>
    </article>
  `;
}

function homeBannerTemplate(card) {
  return `
    <article class="home-banner-card">
      <img src="${card.art}" alt="">
      <div>
        <span class="eyebrow">${card.eyebrow}</span>
        <h2>${card.title}</h2>
        <p>${card.body}</p>
      </div>
      <button type="button" data-home-jump="${card.tab}">${card.cta}</button>
    </article>
  `;
}

function homeSummaryTemplate(label, value, meta, tab) {
  return `
    <button class="home-summary-card" type="button" data-home-jump="${tab}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${meta}</small>
    </button>
  `;
}

function menuViews() {
  if (!window.TazzoMenuViews) {
    throw new Error("Modulo de menus nao carregado.");
  }
  return window.TazzoMenuViews;
}

function menuViewContext() {
  return {
    state,
    PACKS,
    MONSTERS,
    MONSTER_BY_ID,
    TOURNAMENTS,
    TOURNAMENT_OPPONENTS,
    SHOP_ITEMS,
    MISSIONS,
    MISSION_PERIOD_ORDER,
    MISSION_PERIOD_LABELS,
    ECONOMY_REWARD_RULES,
    SOCIAL_SHARE_REWARDS,
    COMPETITIVE_MATCHMAKING_TIMEOUT_MS,
    LEGENDARY_BOOST_TAZZOS,
    LEGENDARY_BOOST_MAX_TAZZOS,
    LEGENDARY_BOOST_MULTIPLIER,
    LEGENDARY_BOOST_MAX_MULTIPLIER,
    hasOnlineProfile,
    formatNumber,
    clamp,
    cosmeticSlot,
    cosmeticSlotLabel,
    isCosmeticEquipped,
    missionPeriod,
    isPackBusy,
    legendaryBoostMultiplier,
    openPack,
    tearOpenPack,
    showPackCards,
    renderMonsterArt,
    monsterBackImage,
    isAtLeastRarity,
    premiumRevealLabel,
    monsterStats,
    monsterStatsLine,
    typeChips,
    holographicChip,
    hasHolographicArt,
    visibleCollectionMonsters,
    matchesCollectionFilters,
    isGoalkeeper,
    upgradeLevel,
    upgradeCost,
    setTeamSlot,
    upgradeMonster,
    toggleWishlist,
    setGoalkeeper,
    decorateImageButtons,
    currentRank,
    nextRank,
    teamCost,
    teamPower,
    rankedChance,
    rankedOpponentForCurrentRank,
    isCurrentTutorialStep,
    activeSavedCompetitive,
    activeTournamentBattle,
    activeRankedBattle,
    claimMission,
    claimableMissions,
    claimReadyMissions,
    dailyEconomyStats,
    shareRewardClaimed,
    shareRewardValidated,
    shareRewardRequested,
    shareGameForReward,
    tradeValue,
    shopPromoItem,
    shopPromoAvailable,
    shopPromoBanner
  };
}

function renderPackPity() {
  return menuViews().renderPackPity(menuViewContext());
}

function renderPacks() {
  return menuViews().renderPacks(menuViewContext());
}

function rarityAuraClass(rarity) {
  return menuViews().rarityAuraClass(rarity);
}

function packResultsRenderKey() {
  return menuViews().packResultsRenderKey(menuViewContext());
}

function renderPullCard(pull, index) {
  return menuViews().renderPullCard(menuViewContext(), pull, index);
}

function renderShopRewardReveal() {
  const root = document.getElementById("shop-reward-reveal");
  if (!root) return;
  const reveal = state.shopRewardReveal;
  if (!reveal?.pulls?.length) {
    root.hidden = true;
    root.innerHTML = "";
    return;
  }
  const cards = reveal.pulls.map((pull, index) => renderPullCard({ ...pull, revealed: true }, index)).join("");
  root.hidden = false;
  root.innerHTML = `
    <section class="pack-results-overlay shop-reward-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-reward-title">
      <div class="pack-results-dialog shop-reward-dialog">
        <div class="pack-results-head">
          <div>
            <span class="eyebrow">Promocao concluida</span>
            <h2 id="shop-reward-title">${escapeHtmlAttribute(reveal.title || "Tazzos recebidos!")}</h2>
          </div>
          <div class="pack-results-actions">
            <button class="viewer-close" type="button" data-close-shop-reward>Fechar</button>
          </div>
        </div>
        <p class="shop-reward-summary">${escapeHtmlAttribute(reveal.message || "Os tazzos abaixo ja foram adicionados ao seu album.")}</p>
        <div class="pack-results-grid shop-reward-grid">${cards}</div>
      </div>
    </section>
  `;
}

function closeShopRewardReveal() {
  state.shopRewardReveal = null;
  renderAll();
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

  playSfx("card-flip", { pitch: 0.05 });
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
    const revealedMonsters = readyIndexes
      .map((index) => MONSTER_BY_ID[state.packReveal[index]?.monsterId])
      .filter(Boolean);
    const bestRevealed = revealedMonsters.sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity))[0];
    if (bestRevealed) playSfx(revealSfxForRarity(bestRevealed.rarity), { pitch: 0.03 });
    if (readyIndexes.some((index) => Number(state.packReveal[index]?.fragments) > 0)) {
      window.setTimeout(() => playSfx("fragment-pop", { volume: 0.82, pitch: 0.04 }), 160);
    }
    triggerPremiumRevealEffect(readyIndexes);
    setTimeout(() => {
      readyIndexes.forEach((index) => {
        const revealed = state.packReveal[index];
        if (!revealed) return;
        revealed.justRevealed = false;
      });
      updatePullCards(readyIndexes);
    }, 360);
  }, 860);
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
  playSfx("snack-burst", { volume: 0.76, pitch: 0.03 });
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
  decorateImageButtons();
}

function renderPackOpening() {
  return menuViews().renderPackOpening(menuViewContext());
}

function renderCollection() {
  return menuViews().renderCollection(menuViewContext());
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
    state.save.team = normalizeTeam(state.save.team, state.save.collection);
    state.save.goalkeeper = edited.id;
  } else {
    state.save.team = normalizeTeam(state.save.team, state.save.collection);
    if (state.save.goalkeeper === edited.id) state.save.goalkeeper = normalizeGoalkeeper("", state.save.collection);
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
  return menuViews().renderTrade(menuViewContext());
}

function renderFriends() {
  return menuViews().renderFriends(menuViewContext());
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

  renderTazzoClashPanel();
  decorateImageButtons(document.getElementById("view-online"));
}

function renderTazzoClashPanel() {
  const panel = document.getElementById("tazzo-clash-panel");
  if (!panel) return;
  const social = state.social;
  const friend = tazzoClashSelectedFriend();
  const canInvite = Boolean(hasOnlineProfile() && friend);
  const sortedClashes = [...(social.clashes || [])].sort(tazzoClashSort);
  const liveClashes = sortedClashes.filter((clash) => ["pending", "selecting", "active"].includes(clash.status));
  const latestHistoryClash = sortedClashes.find((clash) => !["pending", "selecting", "active"].includes(clash.status));
  const visibleClashes = latestHistoryClash ? [...liveClashes, latestHistoryClash] : liveClashes;
  const runningCount = liveClashes.filter((clash) => clash.status === "active" || clash.status === "selecting").length;

  panel.innerHTML = `
    <div class="panel-heading">
      <div>
        <span class="eyebrow">Novo modo</span>
        <h2>Bater tazzos</h2>
      </div>
      <span class="chip">${runningCount} em andamento</span>
    </div>
    <p class="tazzo-clash-note">Primeiro convide um amigo. Se ele aceitar, cada um escolhe ate 3 tazzos para bater na mesa.</p>
    ${!hasOnlineProfile() ? `<p class="profile-message is-error">Entre em uma conta para duelar com amigos.</p>` : ""}
    <div class="tazzo-clash-builder">
      <div class="tazzo-clash-invite-row">
        <label>
          Amigo
          <select id="tazzo-clash-friend" ${social.friends.length ? "" : "disabled"}>
            ${social.friends.length
              ? social.friends.map((item) => `<option value="${escapeHtmlAttribute(item.playerId)}" ${item.playerId === social.clashFriendId ? "selected" : ""}>${escapeHtmlAttribute(item.name)}</option>`).join("")
              : `<option value="">Sem amigos</option>`}
          </select>
        </label>
        <button type="button" data-clash-create="true" ${canInvite ? "" : "disabled"}>Convidar duelo</button>
      </div>
      ${social.error ? `<p class="profile-message is-error">${escapeHtmlAttribute(social.error)}</p>` : ""}
      ${social.message ? `<p class="profile-message is-success">${escapeHtmlAttribute(social.message)}</p>` : ""}
    </div>
    <div class="tazzo-clash-duel-list">
      ${visibleClashes.length ? visibleClashes.map(renderTazzoClashDuel).join("") : `<p class="tazzo-clash-empty">Nenhum duelo ainda. Escolha um amigo e envie o convite.</p>`}
    </div>
  `;
}

function tazzoClashSelectedFriend() {
  const social = state.social;
  const selected = social.friends.find((friend) => friend.playerId === social.clashFriendId) || social.friends[0] || null;
  if (selected && social.clashFriendId !== selected.playerId) social.clashFriendId = selected.playerId;
  return selected;
}

function tazzoClashOwnedMonsters() {
  return sortedMonsters(MONSTERS).filter((monster) => (state.save.collection[monster.id] || 0) > 0);
}

function tazzoClashFriendMonsters(friend) {
  return (friend?.collection || [])
    .map((item) => ({
      monster: MONSTER_BY_ID[item.monsterId],
      count: Math.max(0, Math.floor(Number(item.count) || 0))
    }))
    .filter((item) => item.monster && item.count > 0)
    .sort((a, b) => a.monster.number - b.monster.number);
}

function tazzoClashOption(monster, selected, count) {
  return `<option value="${escapeHtmlAttribute(monster.id)}" ${selected ? "selected" : ""}>${escapeHtmlAttribute(monster.name)} - ${escapeHtmlAttribute(monster.rarity)} (${tradeValue(monster.id)} pts) x${formatNumber(count)}</option>`;
}

function tazzoClashValue(ids = []) {
  return ids.reduce((sum, id) => sum + tradeValue(id), 0);
}

function tazzoClashSort(a, b) {
  const order = { active: 0, selecting: 1, pending: 2, finished: 3, declined: 4, cancelled: 5 };
  return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    || String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
}

function renderTazzoClashDuel(clash) {
  const playerId = state.server.playerId;
  const fromYou = clash.fromPlayerId === playerId;
  const incoming = clash.toPlayerId === playerId && clash.status === "pending";
  const friend = fromYou ? clash.to : clash.from;
  const friendName = cleanText(friend?.name, "Amigo", 24);
  const isYourTurn = clash.status === "active" && clash.currentTurnPlayerId === playerId;
  const startedName = clash.startedByPlayerId === playerId ? "Voce" : clash.startedByPlayerId ? friendName : "Aguardando";
  const animation = state.social.clashAnimation?.duelId === clash.id && Date.now() - state.social.clashAnimation.at < TAZZO_CLASH_HIT_ANIMATION_MS
    ? state.social.clashAnimation
    : null;
  const latestLog = Array.isArray(clash.log) ? clash.log.slice(-1).reverse() : [];
  const scoreYou = clash.scores?.[playerId] || 0;
  const scoreFriend = clash.scores?.[friend?.playerId] || 0;
  const yourPickIds = fromYou ? clash.offeredIds || [] : clash.requestedIds || [];
  const friendPickIds = fromYou ? clash.requestedIds || [] : clash.offeredIds || [];
  const yourPickValue = tazzoClashValue(yourPickIds);
  const friendPickValue = tazzoClashValue(friendPickIds);
  const resultText = clash.status === "finished"
    ? clash.winnerPlayerId
      ? clash.winnerPlayerId === playerId ? "Voce venceu a mesa." : `${friendName} venceu a mesa.`
      : "Duelo empatado."
    : statusLabelTazzoClash(clash.status);

  return `
    <article class="tazzo-clash-duel is-${escapeHtmlAttribute(clash.status)}${isYourTurn ? " is-your-turn" : ""}${animation ? " is-impact" : ""}" data-clash-duel-card="${escapeHtmlAttribute(clash.id)}">
      <div class="tazzo-clash-duel-head">
        <div>
          <span class="eyebrow">${fromYou ? "Seu convite" : "Convite recebido"}</span>
          <strong>${fromYou ? `Contra ${escapeHtmlAttribute(friendName)}` : `${escapeHtmlAttribute(friendName)} chamou voce`}</strong>
        </div>
        <span class="chip">${escapeHtmlAttribute(resultText)}</span>
      </div>
      <div class="tazzo-clash-score">
        ${clash.status === "selecting" ? `
          <span>Sua escolha <strong>${yourPickValue}</strong></span>
          <span>${escapeHtmlAttribute(friendName)} <strong>${friendPickValue}</strong></span>
          <span>${clash.valuesBalanced ? "Valores iguais" : "Escolhendo apostas"}</span>
        ` : `
          <span>Voce <strong>${scoreYou}</strong></span>
          <span>${escapeHtmlAttribute(friendName)} <strong>${scoreFriend}</strong></span>
          <span>Cara ou coroa: <strong>${escapeHtmlAttribute(startedName)}</strong></span>
        `}
      </div>
      ${renderTazzoClashBoard(clash, animation)}
      ${clash.status === "pending" ? `
        <div class="tazzo-clash-pending">
          <span>Sem apostas ainda</span>
          ${incoming ? `
            <div class="tazzo-clash-actions">
              <button type="button" data-clash-accept="${escapeHtmlAttribute(clash.id)}">Aceitar duelo</button>
              <button type="button" data-clash-decline="${escapeHtmlAttribute(clash.id)}">Recusar duelo</button>
            </div>
          ` : `<span>Aguardando ${escapeHtmlAttribute(friendName)} aceitar.</span>`}
        </div>
      ` : ""}
      ${clash.status === "selecting" ? renderTazzoClashSelection(clash, friendName) : ""}
      ${isYourTurn ? renderTazzoClashMeter(clash.id) : clash.status === "active" ? `<p class="tazzo-clash-turn">Aguardando a batida de ${escapeHtmlAttribute(friendName)}.</p>` : ""}
      ${latestLog.length ? `<div class="tazzo-clash-log">${latestLog.map((item) => `<span>${escapeHtmlAttribute(item.message || "")}</span>`).join("")}</div>` : ""}
    </article>
  `;
}

function renderTazzoClashSelection(clash, friendName) {
  const playerId = state.server.playerId;
  const fromYou = clash.fromPlayerId === playerId;
  const yourIds = fromYou ? clash.offeredIds || [] : clash.requestedIds || [];
  const friendIds = fromYou ? clash.requestedIds || [] : clash.offeredIds || [];
  const draftIds = tazzoClashDraftForDuel(clash, yourIds);
  const owned = tazzoClashOwnedMonsters();
  const draftValue = tazzoClashValue(draftIds);
  const friendValue = tazzoClashValue(friendIds);
  const canSubmit = Boolean(draftIds.length && draftIds.length <= 3);
  const balanceClass = friendIds.length && draftValue === friendValue ? "is-balanced" : "is-warning";
  const statusText = !friendIds.length
    ? `${friendName} ainda esta escolhendo.`
    : draftValue === friendValue
    ? "Valores iguais. Ao confirmar, a mesa comeca."
    : `Valores ainda diferentes: ${draftValue} x ${friendValue}.`;
  return `
    <div class="tazzo-clash-selection">
      <div class="tazzo-clash-select-grid">
        <label>
          Seus tazzos para bater
          <select data-clash-pick="${escapeHtmlAttribute(clash.id)}" multiple size="5" ${owned.length ? "" : "disabled"}>
            ${owned.length ? owned.map((monster) => tazzoClashOption(monster, draftIds.includes(monster.id), state.save.collection[monster.id])).join("") : `<option value="">Sem tazzos</option>`}
          </select>
        </label>
        <section class="tazzo-clash-side-preview">
          <span>${escapeHtmlAttribute(friendName)} colocou</span>
          ${friendIds.length ? renderTazzoClashMiniStack(friendIds) : `<p>Aguardando escolha.</p>`}
        </section>
      </div>
      <div class="tazzo-clash-balance ${balanceClass}" data-clash-balance>
        <span>Sua mesa: <strong data-clash-your-value>${draftValue}</strong> pts</span>
        <span>Mesa do amigo: <strong data-clash-friend-value>${friendValue}</strong> pts</span>
        <span data-clash-pick-status>${escapeHtmlAttribute(statusText)}</span>
      </div>
      <button type="button" data-clash-pick-submit="${escapeHtmlAttribute(clash.id)}" ${canSubmit ? "" : "disabled"}>${yourIds.length ? "Atualizar escolha" : "Confirmar tazzos"}</button>
    </div>
  `;
}

function tazzoClashDraftForDuel(clash, fallbackIds = []) {
  if (!Array.isArray(state.social.clashPickDrafts[clash.id])) {
    state.social.clashPickDrafts[clash.id] = fallbackIds.slice(0, 3);
  }
  return state.social.clashPickDrafts[clash.id].filter((id) => MONSTER_BY_ID[id]).slice(0, 3);
}

function renderTazzoClashMiniStack(ids = []) {
  return `
    <div class="tazzo-clash-mini-stack">
      ${ids.map((id) => {
        const monster = MONSTER_BY_ID[id];
        if (!monster) return "";
        return `
          <button class="trade-tazzo-tile" type="button" data-monster-view="${escapeHtmlAttribute(monster.id)}">
            ${renderMonsterArt(monster, "trade-tazzo-art")}
            <span>
              <strong>${escapeHtmlAttribute(monster.name)}</strong>
              <small>${escapeHtmlAttribute(monster.rarity)} - ${tradeValue(monster.id)} pts</small>
            </span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderTazzoClashBoard(clash, animation) {
  const entries = Array.isArray(clash.entries) ? clash.entries : [];
  if (!entries.length) return "";
  const flippedKeys = new Set(animation?.flippedKeys || []);
  const visibleEntries = entries.filter((entry) => !entry.capturedByPlayerId || flippedKeys.has(entry.key));
  if (!visibleEntries.length) {
    return `
      <div class="tazzo-clash-board is-empty">
        <p class="tazzo-clash-empty">Mesa limpa. Todos os tazzos ja sairam da pilha.</p>
      </div>
    `;
  }
  return `
    <div class="tazzo-clash-board">
      ${visibleEntries.map((entry) => renderTazzoClashEntry(
        entry,
        clash,
        flippedKeys,
        Boolean(animation),
        Math.max(0, entries.findIndex((item) => item.key === entry.key)),
        visibleEntries.length
      )).join("")}
    </div>
  `;
}

function tazzoClashStackStyle(index, total) {
  const offsets = [
    { x: -10, y: 8, rot: -7 },
    { x: 15, y: -7, rot: 8 },
    { x: 0, y: 0, rot: -2 },
    { x: -22, y: -12, rot: 11 },
    { x: 24, y: 13, rot: -12 },
    { x: 8, y: 20, rot: 5 }
  ];
  const offset = offsets[index % offsets.length];
  const spread = total >= 5 ? 1 : total >= 3 ? 0.82 : 0.58;
  const side = index % 2 === 0 ? 1 : -1;
  const exitX = side * (190 + index * 12);
  const exitY = -84 + (index % 3) * 44;
  const exitRot = offset.rot + side * (42 + index * 7);
  return [
    `--stack-x: ${Math.round(offset.x * spread)}px`,
    `--stack-y: ${Math.round(offset.y * spread)}px`,
    `--stack-rot: ${offset.rot}deg`,
    `--stack-z: ${index + 1}`,
    `--mid-exit-x: ${Math.round(exitX * 0.42)}px`,
    `--mid-exit-y: ${Math.round(exitY * 0.42)}px`,
    `--mid-exit-rot: ${Math.round(exitRot * 0.52)}deg`,
    `--exit-x: ${exitX}px`,
    `--exit-y: ${exitY}px`,
    `--exit-rot: ${exitRot}deg`
  ].join("; ");
}

function renderTazzoClashEntry(entry, clash, flippedKeys, isHitAnimating = false, stackIndex = 0, stackTotal = 1) {
  const monster = MONSTER_BY_ID[entry.monsterId];
  const playerId = state.server.playerId;
  const friend = clash.fromPlayerId === playerId ? clash.to : clash.from;
  const ownerName = entry.ownerPlayerId === playerId ? "Seu" : cleanText(friend?.name, "Amigo", 16);
  const capturedBy = entry.capturedByPlayerId;
  const capturedName = capturedBy ? capturedBy === playerId ? "voce" : cleanText(friend?.name, "amigo", 16) : "";
  const isNewFlip = flippedKeys.has(entry.key);
  const shouldSpin = isHitAnimating && (isNewFlip || !capturedBy);
  if (!monster) return "";
  const ariaLabel = capturedBy
    ? `${monster.name}, tazzo de ${ownerName}, virou para ${capturedName}`
    : `${monster.name}, tazzo de ${ownerName} na pilha`;
  return `
    <button class="tazzo-clash-entry${capturedBy ? " is-flipped" : ""}${isNewFlip ? " is-new-flip" : ""}${shouldSpin ? " is-hit-spinning" : ""}" type="button" data-monster-view="${escapeHtmlAttribute(monster.id)}" style="${escapeHtmlAttribute(tazzoClashStackStyle(stackIndex, stackTotal))}" aria-label="${escapeHtmlAttribute(ariaLabel)}">
      <span class="tazzo-clash-disc">
        <span class="tazzo-clash-face tazzo-clash-back">
          <img src="${escapeHtmlAttribute(monsterBackImage(monster))}" alt="">
        </span>
        <span class="tazzo-clash-face tazzo-clash-front">
          ${renderMonsterArt(monster, "tazzo-clash-art", { revealHolographic: Boolean(capturedBy || isNewFlip) })}
        </span>
      </span>
      <span class="tazzo-clash-entry-meta">
        <strong>${escapeHtmlAttribute(monster.name)}</strong>
        <small>${escapeHtmlAttribute(ownerName)} tazzo${capturedBy ? ` | virou para ${escapeHtmlAttribute(capturedName)}` : ""}</small>
      </span>
    </button>
  `;
}

function renderTazzoClashMeter(duelId) {
  return `
    <div class="tazzo-clash-hitbox">
      <div class="clash-meter-track" data-clash-meter>
        <span class="clash-meter-zone"></span>
        <span class="clash-meter-thumb"></span>
      </div>
      <button type="button" data-clash-hit="${escapeHtmlAttribute(duelId)}">Bater agora</button>
    </div>
  `;
}

function statusLabelTazzoClash(status) {
  return {
    pending: "Pendente",
    selecting: "Escolhendo",
    active: "Na mesa",
    finished: "Finalizado",
    declined: "Recusado",
    cancelled: "Cancelado"
  }[status] || "Duelo";
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
  return menuViews().renderCompetitive(menuViewContext());
}

function renderLeaderboardRows(currentPlayerRank) {
  return menuViews().renderLeaderboardRows(menuViewContext(), currentPlayerRank);
}

function renderShop() {
  return menuViews().renderShop(menuViewContext());
}

function smallSummary(title, value, meta) {
  return menuViews().smallSummary(title, value, meta);
}

function renderMissions() {
  return menuViews().renderMissions(menuViewContext());
}

function missionCardTemplate(mission) {
  return menuViews().missionCardTemplate(menuViewContext(), mission);
}

function missionPeriodTitle(period) {
  return menuViews().missionPeriodTitle(period);
}

function missionRewardText(mission) {
  return menuViews().missionRewardText(menuViewContext(), mission);
}

function missionStatus(mission) {
  return menuViews().missionStatus(menuViewContext(), mission);
}

function albumMissionProgress(mission) {
  return menuViews().albumMissionProgress(menuViewContext(), mission);
}

function renderTutorial() {
  const current = currentTutorialStep();
  const done = completedTutorialCount();
  const complete = done === TUTORIAL_STEPS.length;
  const rewardReady = complete && !state.save.tutorialRewardClaimed;
  const rewardDisabled = !rewardReady || state.tutorialRewardPending;
  const rewardLabel = state.tutorialRewardPending
    ? "Resgatando..."
    : state.save.tutorialRewardClaimed ? "Recompensa resgatada" : "Resgatar tutorial";
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
        ? `<button type="button" data-tutorial-reward="true" ${rewardDisabled ? "disabled" : ""}>${rewardLabel}</button>`
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
  const total = TUTORIAL_STEPS.length;
  const complete = done === total;
  const dismissed = complete && state.save.tutorialRewardClaimed;
  if (dismissed) {
    state.tutorialExpanded = false;
    coach.hidden = true;
    coach.innerHTML = "";
    coach.classList.remove("is-complete", "is-expanded", "has-reward");
    return;
  }

  coach.hidden = false;
  const percent = total ? Math.round((done / total) * 100) : 100;
  const rewardReady = complete && !state.save.tutorialRewardClaimed;
  const rewardDisabled = !rewardReady || state.tutorialRewardPending;
  const rewardLabel = state.tutorialRewardPending
    ? "Resgatando..."
    : state.save.tutorialRewardClaimed ? "Recompensa resgatada" : "Resgatar";
  const statusLabel = complete ? "Tutorial completo" : `Tutorial ${done + 1}/${total}`;
  const title = complete ? "Primeira liga concluida" : current.title;
  const description = complete ? "O loop principal ja esta validado no seu save." : current.description;
  const compactMeta = rewardReady ? "Premio pronto" : `${done}/${total}`;
  const action = complete
    ? `<button type="button" data-tutorial-reward="true" ${rewardDisabled ? "disabled" : ""}>${rewardLabel}</button>`
    : `<button type="button" data-tutorial-action="${current.id}">${current.action || "Continuar"}</button>`;
  coach.classList.toggle("is-complete", complete);
  coach.classList.toggle("is-expanded", state.tutorialExpanded);
  coach.classList.toggle("has-reward", rewardReady);
  coach.innerHTML = `
    <button class="tutorial-coach-orb" type="button" data-tutorial-toggle aria-expanded="${state.tutorialExpanded ? "true" : "false"}" aria-controls="tutorial-coach-card" aria-label="${state.tutorialExpanded ? "Recolher tutorial" : "Abrir tutorial"}">
      <span class="tutorial-orb-mark" aria-hidden="true">?</span>
      <span class="tutorial-orb-copy">
        <strong>Tutorial</strong>
        <small>${compactMeta}</small>
      </span>
      <span class="tutorial-orb-meter" style="--tutorial-percent:${percent}%;" aria-hidden="true"></span>
    </button>
    ${state.tutorialExpanded ? `
      <article class="tutorial-coach-card" id="tutorial-coach-card">
        <button class="viewer-close tutorial-coach-close" type="button" data-tutorial-collapse aria-label="Recolher tutorial">Fechar</button>
        <div class="tutorial-coach-copy">
          <span class="eyebrow">${statusLabel}</span>
          <strong>${title}</strong>
          <p>${description}</p>
          ${complete ? "" : `<span class="tutorial-next-line">${tutorialQuickLine(current)}</span>`}
        </div>
        <div class="tutorial-coach-progress" aria-label="Progresso do tutorial">
          <span style="width:${percent}%"></span>
        </div>
        ${action}
      </article>
    ` : ""}
  `;
}

function renderTutorialPopover() {
  const popover = document.getElementById("tutorial-popover");
  if (!popover) return;
  popover.hidden = true;
  popover.innerHTML = "";
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

function starterPack() {
  return PACKS.find((pack) => pack.id === STARTER_PACK_ID) || PACKS[0];
}

function starterRoleInfo(label) {
  return {
    Atacante: {
      title: "Atacante",
      subtitle: "Finaliza as jogadas e pressiona o rival."
    },
    Meia: {
      title: "Meia",
      subtitle: "Liga o time, abre espaco e ajuda no controle."
    },
    Zagueiro: {
      title: "Zagueiro",
      subtitle: "Segura a arena e protege o goleiro."
    },
    Goleiro: {
      title: "Goleiro",
      subtitle: "Guarda o gol e libera uma habilidade especial."
    },
    Lendario: {
      title: "Lendario",
      subtitle: "Carta rara para voce ajustar o time depois."
    }
  }[label] || {
    title: label || "Tazzo",
    subtitle: "Novo reforco para a colecao."
  };
}

function starterRolePromiseList() {
  return ["Atacante", "Meia", "Zagueiro", "Goleiro", "Lendario"].map((label, index) => {
    const info = starterRoleInfo(label);
    return `
      <li>
        <span>${index + 1}</span>
        <strong>${info.title}</strong>
        <small>${info.subtitle}</small>
      </li>
    `;
  }).join("");
}

function starterLineupCard(pull, index) {
  const monster = MONSTER_BY_ID[pull.monsterId];
  if (!monster) return "";
  const info = starterRoleInfo(pull.roleLabel);
  const inLineup = index < 4;
  const meta = inLineup ? "Escalado" : "No album";
  return `
    <button class="starter-lineup-card${inLineup ? " is-lineup" : " is-bonus"}" type="button" data-monster-view="${monster.id}">
      <span class="starter-role-badge">${info.title}</span>
      ${renderMonsterArt(monster, "starter-lineup-art", { revealHolographic: true })}
      <span class="starter-lineup-copy">
        <strong>${monster.name}</strong>
        <small>${monster.rarity} - ${info.subtitle}</small>
      </span>
      <span class="chip">${meta}</span>
    </button>
  `;
}

function starterCanShow() {
  return !state.save.starterOnboardingComplete && (!canUseServerSave() || hasOnlineProfile());
}

function starterOverlayVisible() {
  return starterCanShow() || state.starter.opening || state.starter.reveal.length > 0 || state.starter.loading || Boolean(state.starter.message);
}

function ensureStarterOnboardingRoot() {
  let root = document.getElementById("starter-onboarding");
  if (!root) {
    root = document.createElement("div");
    root.id = "starter-onboarding";
    root.className = "starter-onboarding";
    document.body.append(root);
  }
  return root;
}

function setupStarterOnboardingActions() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-starter-open]")) {
      openStarterOnboardingPack();
      return;
    }
    if (event.target.closest("[data-starter-continue]")) {
      finishStarterOnboardingView();
    }
  });
}

function renderStarterOnboarding() {
  const root = ensureStarterOnboardingRoot();
  if (!starterOverlayVisible()) {
    root.hidden = true;
    root.innerHTML = "";
    return;
  }

  root.hidden = false;
  if (state.starter.opening) {
    root.innerHTML = starterOpeningTemplate();
    return;
  }
  if (state.starter.reveal.length) {
    root.innerHTML = starterResultsTemplate();
    root.querySelector("[data-starter-continue]")?.addEventListener("click", finishStarterOnboardingView);
    decorateImageButtons(root);
    return;
  }
  root.innerHTML = starterIntroTemplate();
  root.querySelector("[data-starter-open]")?.addEventListener("click", openStarterOnboardingPack);
  decorateImageButtons(root);
}

function starterIntroTemplate() {
  const pack = starterPack();
  const loadingText = state.starter.loading ? "Abrindo..." : "Abrir meu primeiro salgadinho";
  const disabled = state.starter.loading ? "disabled" : "";
  return `
    <section class="pack-results-overlay starter-onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="starter-title">
      <div class="pack-results-dialog starter-dialog">
        <div class="pack-results-head">
          <div>
            <span class="eyebrow">Boas-vindas ao recreio</span>
            <h2 id="starter-title">Abra seu primeiro salgadinho recheado</h2>
          </div>
          <div class="pack-results-actions starter-actions">
            <button class="primary-button starter-main-action" type="button" data-starter-open data-image-label="Abrir" ${disabled}>${loadingText}</button>
          </div>
        </div>
        <div class="starter-intro-layout">
          <article class="pack-card starter-pack-card">
            <img class="pack-card-art" src="${pack.image}" alt="Pacote ${pack.name}">
            <h2>${pack.name}</h2>
            <p>Seu primeiro pacote monta a base inteira: campo, goleiro e um Lendario surpresa.</p>
            <div class="pack-meta">
              <span class="chip">5x</span>
              <span class="chip">Time inicial</span>
            </div>
          </article>
          <article class="starter-explainer">
            <span class="eyebrow">Sem extras escondidos</span>
            <h2>Seu inventario comeca daqui</h2>
            <p>Depois da abertura, apenas esses cinco tazzos entram no album. O atacante, meia, zagueiro e goleiro ja ficam escalados para a primeira partida.</p>
            <ol class="starter-role-list">${starterRolePromiseList()}</ol>
            ${state.starter.message ? `<p class="profile-message is-error">${state.starter.message}</p>` : ""}
          </article>
        </div>
      </div>
    </section>
  `;
}

function starterOpeningTemplate() {
  const pack = starterPack();
  return `
    <section class="pack-opening-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div class="pack-opening is-auto-opening">
        <div class="snack-pack has-image is-tearing" aria-label="Abrindo salgadinho ${pack.name}">
          <img class="snack-pack-art snack-pack-art-closed" src="${pack.image}" alt="Pacote ${pack.name}">
          <img class="snack-pack-art snack-pack-art-open" src="${pack.openImage || pack.image}" alt="Pacote ${pack.name} aberto">
        </div>
        <div class="opening-copy">
          <span class="eyebrow">Primeiro salgadinho</span>
          <h2>Abrindo ${pack.name}</h2>
          <p>Separando seu atacante, meia, zagueiro, goleiro e Lendario.</p>
          <div class="pack-opening-progress" aria-hidden="true"><span></span></div>
        </div>
      </div>
    </section>
  `;
}

function starterResultsTemplate() {
  const pullsHtml = state.starter.reveal.map((pull, index) => renderPullCard({ ...pull, revealed: true }, index)).join("");
  const lineupHtml = state.starter.reveal.map((pull, index) => starterLineupCard(pull, index)).join("");
  const summary = state.starter.reveal.map((pull) => {
    const monster = MONSTER_BY_ID[pull.monsterId];
    return monster ? `<span class="chip">${pull.roleLabel}: ${monster.name}</span>` : "";
  }).join("");
  return `
    <section class="pack-results-overlay starter-onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="starter-results-title">
      <div class="pack-results-dialog starter-dialog">
        <div class="pack-results-head">
          <div>
            <span class="eyebrow">Time inicial pronto</span>
            <h2 id="starter-results-title">Tazzos do primeiro salgadinho</h2>
          </div>
          <div class="pack-results-actions starter-actions">
            <button class="primary-button starter-main-action" type="button" data-starter-continue data-image-label="Continuar">Comecar batalha</button>
          </div>
        </div>
        <p class="starter-result-note">Esses cinco tazzos sao todo o seu inventario inicial. Os quatro primeiros ja foram escalados; o Lendario fica pronto para voce testar na colecao.</p>
        <div class="pack-meta">${summary}</div>
        <div class="starter-lineup-grid">${lineupHtml}</div>
        <div class="pack-results-grid starter-disc-grid">${pullsHtml}</div>
      </div>
    </section>
  `;
}

async function openStarterOnboardingPack() {
  if (state.starter.loading || state.starter.opening || state.starter.reveal.length || !starterCanShow()) return;
  state.starter.loading = true;
  state.starter.message = "";
  renderStarterOnboarding();

  try {
    const pulls = hasOnlineProfile()
      ? await openStarterPackOnServer()
      : openStarterPackLocally();
    if (!pulls.length && state.save.starterOnboardingComplete) {
      state.starter.reveal = [];
      state.starter.opening = false;
      state.starter.message = "";
      renderAll();
      return;
    }
    state.starter.reveal = pulls.map((pull) => ({ ...pull, revealed: true }));
    state.starter.opening = true;
    window.setTimeout(() => {
      state.starter.opening = false;
      renderAll();
    }, PACK_OPENING_DURATION_MS);
    renderAll();
  } catch (error) {
    state.starter.loading = false;
    if (state.save.starterOnboardingComplete) {
      state.starter.message = "";
      renderAll();
      return;
    }
    state.starter.message = error.message || "Nao foi possivel abrir o primeiro salgadinho.";
    renderStarterOnboarding();
  } finally {
    state.starter.loading = false;
  }
}

async function openStarterPackOnServer() {
  if (state.server.saveTimer) await pushServerSave();
  setServerStatus("syncing", "Starter");
  const response = await fetch(SERVER_STARTER_PACK_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (payload.save) {
      state.save = normalizeSave(payload.save);
      persistLocalSave();
    }
    throw new Error(payload.error || "Nao foi possivel abrir o primeiro salgadinho.");
  }
  state.server.playerId = payload.playerId || state.server.playerId;
  state.save = normalizeSave(payload.save);
  persistLocalSave();
  state.server.localChangedWhileLoading = false;
  setServerStatus("online", "Salvo");
  return payload.pulls || [];
}

function openStarterPackLocally() {
  const pulls = applyStarterPackToSave(state.save);
  saveGame();
  return pulls;
}

function applyStarterPackToSave(save) {
  const hasExistingProgress = hasLegacyStarterProgress(save);
  const starterSourceCollection = hasExistingProgress ? save.collection || {} : {};
  const starter = drawStarterPackPulls(starterSourceCollection);
  const collection = hasExistingProgress ? { ...(save.collection || {}) } : {};
  starter.pulls.forEach((pull) => {
    collection[pull.monsterId] = (collection[pull.monsterId] || 0) + 1;
  });
  save.collection = collection;
  save.team = starter.team;
  save.goalkeeper = starter.goalkeeper;
  if (!hasExistingProgress) {
    save.upgrades = {};
    save.wishlist = {};
    save.activeCompetitive = null;
  }
  save.starterOnboardingComplete = true;
  save.starterPackOpenedAt = new Date().toISOString();
  save.starterPackCards = starter.pulls.map((pull) => pull.monsterId);
  return starter.pulls;
}

function drawStarterPackPulls(collection = {}) {
  const used = new Set(Object.entries(collection).filter(([, count]) => Number(count) > 0).map(([id]) => id));
  const packUsed = new Set();
  const epicOrLower = (monster) => rarityIndex(monster.rarity) <= rarityIndex("Epico");
  const pick = (label, test) => {
    const pool = MONSTERS.filter((monster) => test(monster) && !packUsed.has(monster.id));
    const freshPool = pool.filter((monster) => !used.has(monster.id));
    const safePool = freshPool.length ? freshPool : pool;
    const monster = safePool[Math.floor(Math.random() * safePool.length)];
    packUsed.add(monster.id);
    return { monster, pull: { monsterId: monster.id, roleLabel: label, isNew: !collection[monster.id], fragments: 0, revealed: true } };
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

function finishStarterOnboardingView() {
  state.starter.reveal = [];
  state.starter.opening = false;
  state.starter.message = "";
  switchTab("home");
}

window.openStarterOnboardingPack = openStarterOnboardingPack;

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
  return state.starter.loading
    || state.starter.opening
    || state.packPurchasePending
    || Boolean(state.packOpening)
    || state.packReveal.some((pull) => !pull.revealed || pull.flipping);
}

function clearPackOpeningTimers() {
  state.packOpeningTimers.forEach((timer) => clearTimeout(timer));
  state.packOpeningTimers = [];
}

function schedulePackOpening() {
  clearPackOpeningTimers();
  playSfx("pack-rustle", { cooldown: 180, pitch: 0.04 });
  const timer = setTimeout(() => {
    if (!state.packOpening) return;
    state.packOpening = null;
    state.packOpeningTimers = [];
    playSfx("pack-open", { pitch: 0.04 });
    renderPacks();
  }, PACK_OPENING_DURATION_MS);
  state.packOpeningTimers = [timer];
}

async function openPack(packId) {
  if (!requireOnlineProfile()) return;
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

  state.packReveal = pulls;
  state.packOpening = {
    packId: pack.id,
    packName: pack.name,
    stage: "opening"
  };
  trackTelemetry("pack:open", {
    packId: pack.id,
    cards: pulls.length,
    source: "local"
  }, { cooldown: 0 });
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
    trackTelemetry("pack:open", {
      packId: payload.pack?.id || pack.id,
      cards: state.packReveal.length,
      source: "server"
    }, { cooldown: 0 });
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
  playSfx("pack-tear", { pitch: 0.05 });
  renderPacks();
}

function showPackCards() {
  if (!state.packOpening) return;
  clearPackOpeningTimers();
  state.packOpening = null;
  playSfx("pack-open", { pitch: 0.04 });
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

function tradeValue(monsterOrId) {
  const monster = typeof monsterOrId === "string" ? MONSTER_BY_ID[monsterOrId] : monsterOrId;
  return TAZZO_TRADE_VALUES?.[monster?.rarity] || 0;
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
  if (!requireOnlineProfile()) return;
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
  playSfx("upgrade", { pitch: 0.03 });
  renderAll();
}

async function upgradeMonsterOnServer(monsterId) {
  try {
    await postServerMutation(SERVER_UPGRADE_ENDPOINT, { monsterId }, "Melhorando");
    progressTutorial("team");
    playSfx("upgrade", { pitch: 0.03 });
    renderAll();
  } catch (error) {
    renderAll();
  }
}

function currentRankForPoints(points) {
  return [...RANKS].reverse().find((rank) => (Number(points) || 0) >= rank.min) || RANKS[0];
}

function currentRank() {
  return currentRankForPoints(Math.max(Number(state.save.trophies) || 0, Number(state.save.rankFloor) || 0));
}

function rankedOpponentForCurrentRank() {
  const rank = currentRank();
  return RANKED_OPPONENTS.find((opponent) => opponent.rank === rank.name) || RANKED_OPPONENTS[0];
}

function nextRank() {
  return RANKS.find((rank) => rank.min > state.save.trophies) || null;
}

function ensureCompetitiveRankFloor(save = state.save) {
  const currentFloor = currentRankForPoints(Math.max(Number(save.trophies) || 0, Number(save.rankFloor) || 0)).min;
  save.rankFloor = Math.max(0, Number(save.rankFloor) || 0, currentFloor);
  save.trophies = Math.max(save.rankFloor, Number(save.trophies) || 0);
  return save.rankFloor;
}

function competitiveWinBonus(streak) {
  const safeStreak = Math.max(0, Math.floor(Number(streak)) || 0);
  if (safeStreak >= 5) return COMPETITIVE_STREAK_BONUSES[5];
  return COMPETITIVE_STREAK_BONUSES[safeStreak] || 0;
}

function applyCompetitivePointsLocally(outcome) {
  const floorBefore = ensureCompetitiveRankFloor();
  if (outcome === "win") {
    state.save.competitiveWinStreak = Math.max(0, Math.floor(Number(state.save.competitiveWinStreak)) || 0) + 1;
    const bonus = competitiveWinBonus(state.save.competitiveWinStreak);
    const points = COMPETITIVE_WIN_POINTS + bonus;
    state.save.trophies += points;
    ensureCompetitiveRankFloor();
    return { points, bonus, streak: state.save.competitiveWinStreak, floorProtected: false };
  }
  state.save.competitiveWinStreak = 0;
  if (outcome === "draw") return { points: 0, bonus: 0, streak: 0, floorProtected: false };
  const before = Number(state.save.trophies) || 0;
  state.save.trophies = Math.max(floorBefore, before - COMPETITIVE_LOSS_POINTS);
  return {
    points: state.save.trophies - before,
    bonus: 0,
    streak: 0,
    floorProtected: before - COMPETITIVE_LOSS_POINTS < floorBefore
  };
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

function needsTutorialCompetitiveLoadout() {
  return state.save.team.length !== 3 || !state.save.goalkeeper || teamCost() > 10;
}

function competitiveBattleOptions(stepId) {
  if (!isCurrentTutorialStep(stepId)) return {};
  return {
    ...(needsTutorialCompetitiveLoadout() ? { ...tutorialCompetitiveLoadout(), preservePlayerLoadout: true } : {}),
    tutorialCompetitiveStep: stepId
  };
}

function resumeSavedCompetitiveBattle(match = activeSavedCompetitive()) {
  if (!match) return false;
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return true;
  }

  if (match.type === "tournament") {
    const tournament = TOURNAMENTS.find((item) => item.id === match.tournamentId) || TOURNAMENTS[0];
    const opponent = TOURNAMENT_OPPONENTS[tournament.id] || Object.values(TOURNAMENT_OPPONENTS)[0];
    if (!tournament || !opponent) return false;
    state.competitiveLog.unshift(`Torneio ${tournament.name} retomado contra ${match.opponent || opponent.name}.`);
    switchTab("battle");
    newBattle({
      enemyTeam: opponent.team,
      enemyGoalkeeper: opponent.goalkeeper,
      enemyName: match.opponent || opponent.name,
      mode: "tournament",
      matchTime: BATTLE_MODES.tournament.matchTime,
      actionTime: BATTLE_MODES.tournament.actionTime,
      playerPositions: selectedFormationPositions(),
      tournamentId: tournament.id,
      competitiveMatchId: match.id,
      matchmaking: match.matchmaking || null,
      logIntro: `Torneio ${tournament.name}: partida retomada contra ${match.opponent || opponent.name}.`
    });
    return true;
  }

  if (match.type === "ranked") {
    const opponent = rankedOpponentForCurrentRank();
    state.competitiveLog.unshift(`Ranqueada ${match.rank || currentRank().name} retomada contra ${match.opponent || opponent.name}.`);
    switchTab("battle");
    newBattle({
      enemyTeam: opponent.team,
      enemyGoalkeeper: opponent.goalkeeper,
      enemyName: match.opponent || opponent.name,
      mode: "ranked",
      matchTime: BATTLE_MODES.ranked.matchTime,
      actionTime: BATTLE_MODES.ranked.actionTime,
      playerPositions: selectedFormationPositions(),
      ranked: { rank: match.rank || currentRank().name, opponent: match.opponent || opponent.name, matchId: match.id, matchmaking: match.matchmaking || null },
      logIntro: `Ranqueada ${match.rank || currentRank().name}: partida retomada contra ${match.opponent || opponent.name}.`
    });
    return true;
  }

  return false;
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
  const savedCompetitive = activeSavedCompetitive();
  if (savedCompetitive?.type === "ranked") {
    resumeSavedCompetitiveBattle(savedCompetitive);
    return;
  }
  if (savedCompetitive) {
    state.competitiveLog.unshift("Finalize sua partida competitiva ativa antes de iniciar ranqueada.");
    renderCompetitive();
    return;
  }
  if (state.server.enabled && !requireOnlineProfile()) return;
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
  if (teamCost() > 10) return;
  const rank = currentRank();
  const opponent = rankedOpponentForCurrentRank();
  progressMission("ranked", 1);
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
    logIntro: `Ranqueada ${rank.name}: batalha contra ${opponent.name} comecou.`
  });
}

async function runRankedMatchOnServer() {
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  if (teamCost() > 10) return;

  try {
    startMatchmakingSearch("ranked", "Ranqueada");
    const payload = await postServerMutation(SERVER_RANKED_START_ENDPOINT, {}, "Ranqueada");
    finishMatchmakingSearch();
    const opponent = payload.opponent;
    const rank = payload.rank;
    const match = payload.match;
    if (!opponent || !rank || !match) return;
    const queueText = matchmakingLogText(payload.matchmaking, "bot");
    state.competitiveLog.unshift(`Ranqueada ${rank.name} iniciada contra ${opponent.name}. ${queueText}`);
    switchTab("battle");
    newBattle({
      enemyTeam: opponent.team,
      enemyGoalkeeper: opponent.goalkeeper,
      enemyName: opponent.name,
      mode: "ranked",
      matchTime: BATTLE_MODES.ranked.matchTime,
      actionTime: BATTLE_MODES.ranked.actionTime,
      playerPositions: selectedFormationPositions(),
      ranked: { rank: rank.name, opponent: opponent.name, matchId: match.id, matchmaking: payload.matchmaking },
      logIntro: `Ranqueada ${rank.name}: batalha contra ${opponent.name} comecou. ${queueText}`
    });
  } catch (error) {
    finishMatchmakingSearch();
    if (activeSavedCompetitive()?.type === "ranked" && resumeSavedCompetitiveBattle(activeSavedCompetitive())) return;
    state.competitiveLog.unshift(error.message || "Nao foi possivel iniciar a ranqueada.");
    renderAll();
  }
}

async function resolveRankedBattle(outcome, reason = "") {
  if (hasOnlineProfile()) {
    if (!state.battle?.ranked?.matchId) {
      state.battle.status = "Partida ranqueada sem validacao do servidor.";
      renderBattle();
      return { rewards: [] };
    }
    return resolveRankedBattleOnServer(outcome, reason);
  }
  if (canUseServerSave()) return { rewards: [] };
  return resolveRankedBattleLocally(outcome, reason);
}

function resolveRankedBattleLocally(outcome, reason = "") {
  state.pendingRanked = null;
  state.save.activeCompetitive = null;

  if (outcome === "win") {
    const points = applyCompetitivePointsLocally("win");
    const merreisReward = awardRankedWinMerreis();
    state.save.rankedWins += 1;
    const bonusText = points.bonus ? ` (+${points.bonus} bonus de sequencia ${points.streak})` : "";
    state.battle.status = `Vitoria ranqueada! +${points.points} pontos${bonusText}`;
    state.competitiveLog.unshift(`Vitoria ranqueada${reason ? ` por ${reason}` : ""}: +${points.points} pontos${bonusText}.`);
    return {
      rewards: [
        `+${points.points} pontos`,
        merreisReward.amount ? `+${formatNumber(merreisReward.amount)} Merreis` : "Limite diario de Merreis ranqueados atingido"
      ]
    };
  }

  if (outcome === "draw") {
    applyCompetitivePointsLocally("draw");
    state.battle.status = "Empate ranqueado. Sem Merreis";
    state.competitiveLog.unshift(`Empate ranqueado${reason ? ` por ${reason}` : ""}.`);
    return { rewards: ["Sem perda de trofeus"] };
  }

  const points = applyCompetitivePointsLocally("loss");
  state.save.rankedLosses += 1;
  const floorText = points.floorProtected ? " Piso de divisao segurou seus pontos." : "";
  state.battle.status = `Derrota ranqueada. ${points.points} pontos.${floorText}`;
  state.competitiveLog.unshift(`Derrota ranqueada${reason ? ` por ${reason}` : ""}: ${points.points} pontos.${floorText}`);
  return { rewards: [`${points.points} pontos`] };
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
    state.battle.status = error.message || "Resultado recusado pelo servidor.";
    setServerStatus("error", "Resultado");
    renderAll();
    return { rewards: [] };
  }
}

async function runTournament(tournamentId) {
  const savedCompetitive = activeSavedCompetitive();
  if (savedCompetitive?.type === "tournament") {
    resumeSavedCompetitiveBattle(savedCompetitive);
    return;
  }
  if (savedCompetitive) {
    state.competitiveLog.unshift("Finalize sua partida competitiva ativa antes de entrar em torneio.");
    renderCompetitive();
    return;
  }
  if (state.server.enabled && !requireOnlineProfile()) return;
  if (state.server.enabled) {
    await runTournamentOnServer(tournamentId);
    return;
  }
  runTournamentLocally(tournamentId);
}

function runTournamentLocally(tournamentId) {
  const tournament = TOURNAMENTS.find((item) => item.id === tournamentId);
  if (!tournament || teamCost() > 10 || state.save.merreis < tournament.entry) return;
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }

  state.save.merreis -= tournament.entry;
  progressMission("tournament", 1);
  state.competitiveLog.unshift(`Torneio ${tournament.name} iniciado. Resolva na arena.`);
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
    logIntro: `Torneio ${tournament.name}: batalha contra ${opponent.name} comecou.`
  });
}

async function runTournamentOnServer(tournamentId) {
  if (activeLockedBattle()) {
    state.battleSceneOpen = Boolean(state.battle);
    switchTab("battle");
    return;
  }
  if (teamCost() > 10) return;

  try {
    startMatchmakingSearch("tournament", "Torneio");
    const payload = await postServerMutation(SERVER_TOURNAMENT_START_ENDPOINT, { tournamentId }, "Torneio");
    finishMatchmakingSearch();
    const tournament = payload.tournament;
    const opponent = payload.opponent;
    const match = payload.match;
    if (!tournament || !opponent || !match) return;
    const queueText = matchmakingLogText(payload.matchmaking, "bot");
    state.competitiveLog.unshift(`Torneio ${tournament.name} iniciado contra ${opponent.name}. ${queueText}`);
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
      matchmaking: payload.matchmaking,
      logIntro: `Torneio ${tournament.name}: batalha contra ${opponent.name} comecou. ${queueText}`
    });
  } catch (error) {
    finishMatchmakingSearch();
    if (activeSavedCompetitive()?.type === "tournament" && resumeSavedCompetitiveBattle(activeSavedCompetitive())) return;
    state.competitiveLog.unshift(error.message || "Nao foi possivel iniciar o torneio.");
    renderAll();
  }
}

async function resolveTournamentBattle(won, reason = "") {
  if (hasOnlineProfile()) {
    if (!state.battle?.competitiveMatchId) {
      state.battle.status = "Torneio sem validacao do servidor.";
      renderBattle();
      return { rewards: [], packReward: false };
    }
    return resolveTournamentBattleOnServer(won, reason);
  }
  if (canUseServerSave()) return { rewards: [], packReward: false };
  return resolveTournamentBattleLocally(won, reason);
}

function resolveTournamentBattleLocally(won, reason = "") {
  const tournament = TOURNAMENTS.find((item) => item.id === state.battle.tournamentId);
  if (!tournament) return { rewards: [], packReward: false };

  state.pendingTournament = null;
  state.save.activeCompetitive = null;
  if (won) {
    const points = applyCompetitivePointsLocally("win");
    const bonusText = points.bonus ? ` (+${points.bonus} bonus de sequencia ${points.streak})` : "";
    const rewards = [`+${points.points} pontos`];
    state.save.tournamentWins += 1;
    if (tournament.id === "event") {
      state.save.merreis += 100;
      grantTournamentPack();
      state.battle.status = `Campeao do Evento! +${points.points} pontos${bonusText}. Pacotinho Recheado enviado.`;
      rewards.push("+100 Merreis", "Pacotinho Recheado");
      state.competitiveLog.unshift(`Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}: +${points.points} pontos${bonusText}.`);
      return { rewards, packReward: true };
    } else {
      state.save.merreis += tournament.reward;
      rewards.push(`+${formatNumber(tournament.reward)} Merreis`);
      if (tournament.id === "weekly") state.save.fragments += 24;
      if (tournament.id === "weekly") rewards.push("+24 fragmentos");
      state.battle.status = `Campeao do torneio ${tournament.name}! +${points.points} pontos${bonusText} e +${formatNumber(tournament.reward)} Merreis`;
    }
    state.competitiveLog.unshift(`Campeao do torneio ${tournament.name}${reason ? ` por ${reason}` : ""}: +${points.points} pontos${bonusText}.`);
    return { rewards, packReward: false };
  }

  const points = applyCompetitivePointsLocally("loss");
  const refund = Math.floor(tournament.entry * 0.25);
  state.save.merreis += refund;
  const floorText = points.floorProtected ? " Piso de divisao segurou seus pontos." : "";
  state.battle.status = `Eliminado no torneio ${tournament.name}. ${points.points} pontos. Reembolso ${formatNumber(refund)} Merreis.${floorText}`;
  state.competitiveLog.unshift(`Eliminado no torneio ${tournament.name}${reason ? ` por ${reason}` : ""}: ${points.points} pontos.${floorText}`);
  return { rewards: [`${points.points} pontos`, `+${formatNumber(refund)} Merreis reembolso`], packReward: false };
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
    state.battle.status = error.message || "Resultado recusado pelo servidor.";
    setServerStatus("error", "Resultado");
    renderAll();
    return { rewards: [], packReward: false };
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
  if (!requireOnlineProfile()) return;
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (item?.type === "merreis" && state.server.enabled) {
    await submitMerreisCheckout(itemId);
    return;
  }
  if (state.server.enabled) {
    await buyShopItemOnServer(itemId);
    return;
  }
  buyShopItemLocally(itemId);
}

async function submitMerreisCheckout(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId && entry.type === "merreis");
  if (!item) return;
  if (!state.shopPayments.checked || !state.shopPayments.configured) {
    state.shopMessage = state.shopPayments.message || "Compra de Merreis indisponivel.";
    renderShop();
    return;
  }

  markCheckoutPending();
  renderShop();

  await waitForCheckoutSaveFlush();

  const clientRequestId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
  const deviceId = mercadoPagoDeviceSessionId();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = SERVER_SHOP_CHECKOUT_ENDPOINT;
  form.style.display = "none";

  [
    ["itemId", item.id],
    ["clientRequestId", clientRequestId],
    ["deviceId", deviceId]
  ].forEach(([name, value]) => {
    if (!value) return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  let navigationStarted = false;
  const markNavigationStarted = () => {
    navigationStarted = true;
    clearCheckoutFallbackTimer();
  };
  window.addEventListener("pagehide", markNavigationStarted, { once: true });
  window.addEventListener("beforeunload", markNavigationStarted, { once: true });

  const fallbackToCheckoutUrl = async () => {
    if (navigationStarted) return;
    try {
      const payload = await postServerMutation(SERVER_SHOP_ENDPOINT, { itemId: item.id, clientRequestId, deviceId }, "Checkout");
      if (!payload?.checkoutUrl) throw new Error("Mercado Pago nao retornou URL de checkout.");
      navigationStarted = true;
      clearCheckoutFallbackTimer();
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      resetCheckoutPending(error.message || "Nao foi possivel abrir o checkout.");
      setServerStatus("online", state.server.profile ? "Online" : "Salvo");
      renderShop();
    }
  };

  state.shopPayments.checkoutFallbackTimer = window.setTimeout(fallbackToCheckoutUrl, CHECKOUT_NAVIGATION_FALLBACK_MS);
  try {
    HTMLFormElement.prototype.submit.call(form);
  } catch (error) {
    clearCheckoutFallbackTimer();
    await fallbackToCheckoutUrl();
  }
}

function buyShopItemLocally(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return;

  if (item.type === "merreis") {
    state.shopMessage = "Compra de Merreis precisa do checkout seguro no servidor.";
    renderAll();
    return;
  }

  if (state.save.cosmetics[item.id]) {
    equipCosmetic(item.id);
    state.shopMessage = `${item.name} equipado em ${cosmeticSlotLabel(item)}.`;
    saveGame();
    playSfx("ui-confirm");
    renderAll();
    return;
  }

  if (state.save.merreis < item.cost) return;
  state.save.merreis -= item.cost;
  state.save.cosmetics[item.id] = true;
  equipCosmetic(item.id);
  state.shopMessage = `${item.name} comprado.`;
  saveGame();
  playSfx("purchase");
  renderAll();
}

async function buyShopItemOnServer(itemId) {
  try {
    const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
    const clientRequestId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    if (item?.type === "merreis") state.shopPayments.checkoutPending = true;
    const payload = await postServerMutation(SERVER_SHOP_ENDPOINT, { itemId, clientRequestId }, "Comprando");
    if (payload?.message) state.shopMessage = payload.message;
    if (payload?.checkout && payload.checkoutUrl) {
      window.location.assign(payload.checkoutUrl);
      return;
    }
    playSfx("purchase");
    renderAll();
  } catch (error) {
    state.shopMessage = error.message || "Erro na loja.";
    renderAll();
  } finally {
    state.shopPayments.checkoutPending = false;
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
  state.save.team = normalizeTeam(team, state.save.collection);
  progressTutorial("team");
  saveGame();
  playSfx("team-slot", { pitch: 0.03 });
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

function toggleWishlist(monsterId, options = {}) {
  if (!MONSTER_BY_ID[monsterId]) return;
  const shouldRender = options.render !== false;
  state.save.wishlist = sanitizeWishlist(state.save.wishlist);
  const wasWanted = Boolean(state.save.wishlist[monsterId]);
  if (wasWanted) {
    delete state.save.wishlist[monsterId];
  } else {
    state.save.wishlist[monsterId] = true;
  }
  saveGame();
  playSfx(wasWanted ? "favorite-off" : "favorite-on", { pitch: 0.03 });
  if (shouldRender) renderAll();
}

function setGoalkeeper(monsterId) {
  if (!MONSTER_BY_ID[monsterId] || !isGoalkeeper(monsterId)) return;
  if (!state.save.collection[monsterId]) return;
  state.save.goalkeeper = monsterId;
  progressTutorial("team");
  saveGame();
  playSfx("goalkeeper-set");
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

function selectedValues(select) {
  return Array.from(select?.selectedOptions || []).map((option) => option.value).filter(Boolean);
}

function updateTradeDraft(field, ids) {
  state.social.tradeDraft[field] = ids.filter((id) => MONSTER_BY_ID[id]).slice(0, 3);
  renderTrade();
}

function handleFriendsClick(event) {
  const selectButton = event.target.closest("button[data-friend-select]");
  const acceptButton = event.target.closest("button[data-friend-accept]");
  const declineButton = event.target.closest("button[data-friend-decline]");
  if (selectButton) {
    state.social.selectedFriendId = selectButton.dataset.friendSelect;
    state.social.tradeFriendId = selectButton.dataset.friendSelect;
    renderFriends();
    return;
  }
  if (acceptButton && !acceptButton.disabled) {
    respondFriendInvite(acceptButton.dataset.friendAccept, true);
    return;
  }
  if (declineButton && !declineButton.disabled) {
    respondFriendInvite(declineButton.dataset.friendDecline, false);
  }
}

function handleFriendsSubmit(event) {
  if (event.target.id === "friend-add-form") {
    event.preventDefault();
    const input = document.getElementById("friend-name-input");
    state.social.inviteName = input?.value || "";
    sendFriendInvite();
    return;
  }
  if (event.target.id === "friend-chat-form") {
    event.preventDefault();
    const input = document.getElementById("friend-chat-input");
    state.social.draftMessage = input?.value || "";
    sendFriendChat();
  }
}

function handleTradeBoardClick(event) {
  const acceptButton = event.target.closest("button[data-trade-accept]");
  const declineButton = event.target.closest("button[data-trade-decline]");
  if (acceptButton && !acceptButton.disabled) {
    respondFriendTrade(acceptButton.dataset.tradeAccept, true);
    return;
  }
  if (declineButton && !declineButton.disabled) {
    respondFriendTrade(declineButton.dataset.tradeDecline, false);
  }
}

async function sendFriendInvite() {
  if (!requireOnlineProfile("Entre em uma conta para adicionar amigos.")) return;
  try {
    await postServerMutation(SERVER_FRIEND_INVITE_ENDPOINT, {
      name: state.social.inviteName
    }, "Convidando");
    state.social.message = "Convite enviado.";
    state.social.inviteName = "";
    playSfx("friend-invite");
  } catch (error) {
    state.social.error = error.message || "Nao foi possivel enviar o convite.";
  }
  renderAll();
}

async function respondFriendInvite(requestId, accept) {
  if (!requireOnlineProfile()) return;
  try {
    await postServerMutation(SERVER_FRIEND_RESPOND_ENDPOINT, { requestId, accept }, accept ? "Aceitando" : "Recusando");
    state.social.message = accept ? "Convite aceito." : "Convite recusado.";
    playSfx(accept ? "trade-accept" : "trade-decline");
  } catch (error) {
    state.social.error = error.message || "Nao foi possivel responder o convite.";
  }
  renderAll();
}

async function sendFriendChat() {
  if (!requireOnlineProfile()) return;
  const friendPlayerId = state.social.selectedFriendId;
  if (!friendPlayerId || !state.social.draftMessage.trim()) return;
  try {
    await postServerMutation(SERVER_FRIEND_MESSAGE_ENDPOINT, {
      friendPlayerId,
      message: state.social.draftMessage
    }, "Enviando");
    state.social.draftMessage = "";
    playSfx("friend-message");
  } catch (error) {
    state.social.error = error.message || "Mensagem nao enviada.";
  }
  renderAll();
}

async function createFriendTrade() {
  if (!requireOnlineProfile("Entre em uma conta para trocar com amigos.")) return;
  const friendPlayerId = state.social.tradeFriendId;
  const offeredIds = state.social.tradeDraft.offerIds;
  const requestedIds = state.social.tradeDraft.requestIds;
  if (!friendPlayerId || !offeredIds.length || !requestedIds.length) return;
  const offerValue = offeredIds.reduce((sum, id) => sum + tradeValue(id), 0);
  const requestValue = requestedIds.reduce((sum, id) => sum + tradeValue(id), 0);
  if (offerValue !== requestValue) {
    state.social.error = "Os valores da proposta precisam ser iguais.";
    renderTrade();
    return;
  }
  try {
    await postServerMutation(SERVER_SOCIAL_TRADE_CREATE_ENDPOINT, {
      friendPlayerId,
      offeredIds,
      requestedIds
    }, "Propondo");
    state.social.tradeDraft = { offerIds: [], requestIds: [] };
    state.social.message = "Proposta enviada.";
    progressTutorial("trade");
    playSfx("trade-offer");
  } catch (error) {
    state.social.error = error.message || "Proposta nao enviada.";
  }
  renderAll();
}

async function respondFriendTrade(tradeId, accept) {
  if (!requireOnlineProfile()) return;
  try {
    await postServerMutation(SERVER_SOCIAL_TRADE_RESPOND_ENDPOINT, { tradeId, accept }, accept ? "Trocando" : "Recusando");
    state.social.message = accept ? "Troca concluida." : "Proposta recusada.";
    if (accept) progressTutorial("trade");
    playSfx(accept ? "trade-accept" : "trade-decline");
  } catch (error) {
    state.social.error = error.message || "Nao foi possivel responder a proposta.";
  }
  renderAll();
}

async function doTrade() {
  if (!requireOnlineProfile()) return;
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
  if (!requireOnlineProfile()) return;
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
      playSfx("reward-open");
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
  playSfx("reward-open");
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
  if (!requireOnlineProfile()) return;
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission) return;
  let claimed = false;
  if (state.server.enabled) {
    claimed = await claimMissionOnServer(id);
  } else {
    claimed = claimMissionLocally(id);
  }
  if (claimed) {
    showRewardCelebration({
      title: "Missao resgatada",
      message: mission.title,
      rewards: missionRewardLines([mission])
    });
  }
}

function claimableMissions() {
  return MISSIONS.filter((mission) => {
    const status = missionStatus(mission);
    return !status.claimed && status.progress >= mission.target;
  });
}

async function claimReadyMissions() {
  if (state.missionClaimPending) return;
  const ready = claimableMissions();
  if (!ready.length) return;
  if (!requireOnlineProfile()) return;

  state.missionClaimPending = true;
  renderMissions();
  const claimed = [];
  try {
    for (const mission of ready) {
      if (state.server.enabled) {
        const ok = await claimMissionOnServer(mission.id);
        if (ok) claimed.push(mission);
      } else {
        const ok = claimMissionLocally(mission.id);
        if (ok) claimed.push(mission);
      }
    }
  } catch (error) {
    // The mission list can become stale after sync; refresh the UI either way.
  } finally {
    state.missionClaimPending = false;
    renderAll();
  }
  if (claimed.length) {
    showRewardCelebration({
      title: claimed.length === 1 ? "Missao resgatada" : "Missoes resgatadas",
      message: claimed.length === 1 ? claimed[0].title : `${claimed.length} recompensas foram para sua conta.`,
      rewards: missionRewardLines(claimed)
    });
  }
}

function claimMissionLocally(id) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission) return false;
  if (!state.save.missions[id]) {
    state.save.missions[id] = { progress: 0, claimed: false };
  }
  const status = missionStatus(mission);
  if (status.claimed || status.progress < mission.target) return false;
  state.save.missions[id].claimed = true;
  state.save.merreis += mission.reward;
  state.save.fragments += Number(mission.fragments) || 0;
  saveGame();
  renderAll();
  return true;
}

async function claimMissionOnServer(id) {
  try {
    await postServerMutation(SERVER_CLAIM_MISSION_ENDPOINT, { missionId: id }, "Resgatando");
    renderAll();
    return true;
  } catch (error) {
    renderAll();
    return false;
  }
}

function progressMission(eventId, amount) {
  const missions = MISSIONS.filter((mission) => missionEvent(mission) === eventId && mission.scope !== "album" && missionPeriod(mission) !== "album");
  if (!missions.length) return;
  missions.forEach((mission) => {
    if (!state.save.missions[mission.id]) {
      state.save.missions[mission.id] = { progress: 0, claimed: false };
    }
    const current = Number(state.save.missions[mission.id].progress) || 0;
    state.save.missions[mission.id].progress = clamp(current + amount, 0, mission.target);
  });
  saveGame();
}

function progressTutorial(id) {
  if (!state.save.tutorial || state.save.tutorial[id]) return;
  queueTutorialResult(id);
}

async function claimTutorialReward() {
  if (!requireOnlineProfile()) return;
  if (state.tutorialRewardPending) return;
  const complete = TUTORIAL_STEPS.every((step) => state.save.tutorial[step.id]);
  if (!complete || state.save.tutorialRewardClaimed) return;
  state.tutorialRewardPending = true;
  renderAll();
  try {
    const payload = await postServerMutation(SERVER_TUTORIAL_REWARD_ENDPOINT, {}, "Resgatando");
    const reward = payload.reward || { merreis: 500, fragments: 25 };
    showRewardCelebration({
      title: "Tutorial concluido",
      message: "Recompensa de boas-vindas resgatada.",
      rewards: [`${formatNumber(reward.merreis || 500)} Merreis`, `${formatNumber(reward.fragments || 25)} fragmentos`]
    });
  } finally {
    state.tutorialRewardPending = false;
    renderAll();
  }
}

function resetSave() {
  const confirmed = window.confirm("Reiniciar Merreis, colecao, time, liga e missoes?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  state.save = defaultSave();
  state.pendingTournament = null;
  state.pendingRanked = null;
  state.tutorialResult = null;
  state.tutorialRewardPending = false;
  clearRewardCelebrationTimers();
  state.rewardCelebration = null;
  clearPackOpeningTimers();
  state.packOpening = null;
  state.packPurchasePending = false;
  state.packReveal = [];
  state.tradeLog = [];
  state.competitiveLog = [];
  state.shopMessage = "Itens sem vantagem direta";
  state.selectedTrade = { offer: "", wish: "" };
  state.social.notices = [];
  state.social.notifiedTradeKeys = [];
  state.social.noticeHydratedFor = "";
  clearTurnTimer();
  clearMatchTimer();
  state.battle = null;
  state.battleSceneOpen = false;
  saveGame();
  renderAll();
}

document.addEventListener("DOMContentLoaded", setup);
