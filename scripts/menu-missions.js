(function () {
  "use strict";

  function renderMissions(ctx) {
    const grid = document.getElementById("mission-grid");
    if (!grid) return;
    grid.innerHTML = ctx.MISSION_PERIOD_ORDER.map((period) => {
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

    grid.querySelectorAll("button[data-claim]").forEach((button) => {
      button.addEventListener("click", () => ctx.claimMission(button.dataset.claim));
    });
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
    missionCardTemplate,
    missionPeriodTitle,
    missionRewardText,
    missionStatus,
    albumMissionProgress
  });
})();
