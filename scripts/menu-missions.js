(function () {
  "use strict";

  function renderMissions(ctx) {
    const grid = document.getElementById("mission-grid");
    if (!grid) return;
    const sections = ctx.MISSION_PERIOD_ORDER.map((period) => {
      const missions = ctx.MISSIONS.filter((mission) => ctx.missionPeriod(mission) === period);
      if (!missions.length) return "";
      const completed = missions.filter((mission) => {
        const status = missionStatus(ctx, mission);
        return status.claimed || status.progress >= mission.target;
      }).length;

      return `
        <section class="mission-period-section" data-mission-period="${period}">
          <div class="mission-period-heading">
            <div>
              <span class="eyebrow">${ctx.MISSION_PERIOD_LABELS[period] || "Missoes"}</span>
              <h2>${missionPeriodTitle(period)}</h2>
            </div>
            <span class="chip">${completed}/${missions.length}</span>
          </div>
          <div class="mission-period-grid">
            ${missions.map((mission) => missionCardTemplate(ctx, mission)).join("")}
          </div>
        </section>
      `;
    }).join("");

    grid.innerHTML = `${missionEconomyPanel(ctx)}${sections}`;

    grid.querySelectorAll("button[data-claim]").forEach((button) => {
      button.addEventListener("click", () => ctx.claimMission(button.dataset.claim));
    });
    grid.querySelector("[data-claim-ready]")?.addEventListener("click", () => ctx.claimReadyMissions());
  }

  function missionEconomyPanel(ctx) {
    const stats = ctx.dailyEconomyStats();
    const readyCount = ctx.claimableMissions().length;
    const totalTrainingMerreis = stats.training.limit * stats.training.merreis;
    const pending = ctx.state.missionClaimPending;
    const buttonLabel = pending
      ? "Resgatando..."
      : readyCount
        ? `Resgatar ${readyCount}`
        : "Nada pronto";

    return `
      <section class="mission-economy-panel">
        <div class="mission-economy-head">
          <div>
            <span class="eyebrow">Rotina de recompensas</span>
            <h2>Ganhos de hoje</h2>
          </div>
          <div class="mission-economy-actions">
            <span class="chip">Renova amanha</span>
            <button type="button" data-claim-ready="true" ${readyCount && !pending ? "" : "disabled"}>${buttonLabel}</button>
          </div>
        </div>
        <div class="mission-economy-grid">
          ${missionEconomyCard({
            title: "Treino contra IA",
            value: `${stats.training.used}/${stats.training.limit}`,
            detail: `${ctx.formatNumber(stats.training.merreis)} Merreis por treino`,
            meta: stats.training.remaining
              ? `${stats.training.remaining} treino(s) pagos restantes`
              : "Limite diario atingido",
            percent: stats.training.percent,
            footer: `Maximo diario: ${ctx.formatNumber(totalTrainingMerreis)} Merreis`
          })}
          ${missionEconomyCard({
            title: "Vitorias ranqueadas",
            value: `${ctx.formatNumber(stats.ranked.earned)}/${ctx.formatNumber(stats.ranked.cap)}`,
            detail: `${ctx.formatNumber(stats.ranked.merreis)} Merreis por vitoria`,
            meta: stats.ranked.remaining
              ? `${stats.ranked.winsRemaining} vitoria(s) pagas restantes`
              : "Limite diario atingido",
            percent: stats.ranked.percent,
            footer: `${ctx.formatNumber(stats.ranked.remaining)} Merreis disponiveis hoje`
          })}
        </div>
      </section>
    `;
  }

  function missionEconomyCard(card) {
    const width = Math.max(0, Math.min(100, Number(card.percent) || 0));
    return `
      <article class="mission-economy-card">
        <div>
          <span>${card.title}</span>
          <strong>${card.value}</strong>
        </div>
        <p>${card.detail}</p>
        <div class="progress" aria-label="${card.title}"><span style="width:${width}%"></span></div>
        <small>${card.meta}</small>
        <em>${card.footer}</em>
      </article>
    `;
  }

  function missionCardTemplate(ctx, mission) {
    const status = missionStatus(ctx, mission);
    const progress = ctx.clamp(status.progress, 0, mission.target);
    const ready = progress >= mission.target && !status.claimed;
    const done = status.claimed;
    const width = Math.round((progress / mission.target) * 100);
    return `
      <article class="mission-card${ready ? " is-ready" : ""}${done ? " is-claimed" : ""}">
        <div class="mission-card-heading">
          <h3>${mission.title}</h3>
          <span>${ctx.MISSION_PERIOD_LABELS[ctx.missionPeriod(mission)] || "Missao"}</span>
        </div>
        <p>${progress}/${mission.target} - ${missionRewardText(ctx, mission)}</p>
        <div class="progress" aria-label="Progresso da missao"><span style="width:${width}%"></span></div>
        <button type="button" data-claim="${mission.id}" ${ready ? "" : "disabled"}>${done ? "Resgatada" : ready ? "Resgatar" : "Em andamento"}</button>
      </article>
    `;
  }

  function missionPeriodTitle(period) {
    if (period === "daily") return "Hoje";
    if (period === "weekly") return "Semana";
    if (period === "monthly") return "Mes";
    return "Colecao";
  }

  function missionRewardText(ctx, mission) {
    const rewards = [];
    if (mission.reward) rewards.push(`${ctx.formatNumber(mission.reward)} Merreis`);
    if (mission.fragments) rewards.push(`${ctx.formatNumber(mission.fragments)} fragmentos`);
    return rewards.join(" + ") || "Recompensa";
  }

  function missionStatus(ctx, mission) {
    const saved = ctx.state.save.missions[mission.id] || { progress: 0, claimed: false };
    if (mission.scope === "album") {
      return {
        progress: albumMissionProgress(ctx, mission),
        claimed: Boolean(saved.claimed)
      };
    }
    return saved;
  }

  function albumMissionProgress(ctx, mission) {
    const [from, to] = mission.range || [0, -1];
    return ctx.MONSTERS
      .filter((monster) => monster.number >= from && monster.number <= to)
      .filter((monster) => (ctx.state.save.collection[monster.id] || 0) > 0)
      .length;
  }

  window.TazzoMenuMissions = Object.freeze({
    renderMissions,
    missionEconomyPanel,
    missionEconomyCard,
    missionCardTemplate,
    missionPeriodTitle,
    missionRewardText,
    missionStatus,
    albumMissionProgress
  });
})();
