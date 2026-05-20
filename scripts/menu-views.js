(function () {
  "use strict";

  function requireMenuModule(name, api) {
    if (!api) {
      throw new Error(`Modulo de menu nao carregado: ${name}.`);
    }
    return api;
  }

  function shared() {
    return requireMenuModule("shared", window.TazzoMenuShared);
  }

  function packs() {
    return requireMenuModule("pacotinhos", window.TazzoMenuPacks);
  }

  function collection() {
    return requireMenuModule("colecao", window.TazzoMenuCollection);
  }

  function trades() {
    return requireMenuModule("trocas", window.TazzoMenuTrades);
  }

  function friends() {
    return requireMenuModule("amigos", window.TazzoMenuFriends);
  }

  function tournaments() {
    return requireMenuModule("torneios", window.TazzoMenuTournaments);
  }

  function shop() {
    return requireMenuModule("loja", window.TazzoMenuShop);
  }

  function missions() {
    return requireMenuModule("missoes", window.TazzoMenuMissions);
  }

  window.TazzoMenuViews = Object.freeze({
    renderPackPity: (ctx) => packs().renderPackPity(ctx),
    renderPacks: (ctx) => packs().renderPacks(ctx),
    rarityAuraClass: (rarity) => packs().rarityAuraClass(rarity),
    packResultsRenderKey: (ctx) => packs().packResultsRenderKey(ctx),
    renderPullCard: (ctx, pull, index) => packs().renderPullCard(ctx, pull, index),
    renderPackOpening: (ctx) => packs().renderPackOpening(ctx),

    renderCollection: (ctx) => collection().renderCollection(ctx),
    renderFriends: (ctx) => friends().renderFriends(ctx),
    renderTrade: (ctx) => trades().renderTrade(ctx),
    renderCompetitive: (ctx) => tournaments().renderCompetitive(ctx),
    renderLeaderboardRows: (ctx, currentPlayerRank) => tournaments().renderLeaderboardRows(ctx, currentPlayerRank),
    renderShop: (ctx) => shop().renderShop(ctx),

    smallSummary: (title, value, meta) => shared().smallSummary(title, value, meta),
    smallRow: (ctx, monster, meta) => shared().smallRow(ctx, monster, meta),

    renderMissions: (ctx) => missions().renderMissions(ctx),
    missionCardTemplate: (ctx, mission) => missions().missionCardTemplate(ctx, mission),
    missionPeriodTitle: (period) => missions().missionPeriodTitle(period),
    missionRewardText: (ctx, mission) => missions().missionRewardText(ctx, mission),
    missionStatus: (ctx, mission) => missions().missionStatus(ctx, mission),
    albumMissionProgress: (ctx, mission) => missions().albumMissionProgress(ctx, mission)
  });
})();
