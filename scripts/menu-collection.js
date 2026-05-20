(function () {
  "use strict";

  function renderCollection(ctx) {
    document.querySelectorAll("#slot-picker button").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.slot) === ctx.state.selectedSlot);
    });

    const grid = document.getElementById("collection-grid");
    if (!grid) return;
    const monsters = ctx.visibleCollectionMonsters().filter(ctx.matchesCollectionFilters);
    grid.innerHTML = monsters.map((monster) => collectionCard(ctx, monster)).join("");

    grid.querySelectorAll("button[data-team]").forEach((button) => {
      button.addEventListener("click", () => ctx.setTeamSlot(button.dataset.team));
    });

    grid.querySelectorAll("button[data-upgrade]").forEach((button) => {
      button.addEventListener("click", () => ctx.upgradeMonster(button.dataset.upgrade));
    });

    grid.querySelectorAll("button[data-goalkeeper]").forEach((button) => {
      button.addEventListener("click", () => ctx.setGoalkeeper(button.dataset.goalkeeper));
    });
    ctx.decorateImageButtons(grid);
    ctx.decorateImageButtons(document.getElementById("slot-picker"));
  }

  function collectionCard(ctx, monster) {
    const copies = ctx.state.save.collection[monster.id] || 0;
    const owned = copies > 0;
    const keeper = ctx.isGoalkeeper(monster);
    const inTeam = ctx.state.save.team.includes(monster.id);
    const activeGoalkeeper = ctx.state.save.goalkeeper === monster.id;
    const stats = ctx.monsterStats(monster);
    const level = keeper ? 0 : ctx.upgradeLevel(monster.id);
    const cost = keeper ? { fragments: 0, merreis: 0 } : ctx.upgradeCost(monster.id);
    const canUpgrade = !keeper && owned && level < 2 && ctx.state.save.fragments >= cost.fragments && ctx.state.save.merreis >= cost.merreis;
    const upgradeNote = keeper
      ? "Goleiro nao entra no campo: habilidade unica, 1 uso por partida."
      : level >= 2
      ? "Melhoria maxima: +20% em todos os stats."
      : `Melhoria +10% nos stats: ${ctx.formatNumber(cost.fragments)} fragmentos + ${ctx.formatNumber(cost.merreis)} Merreis. Nivel ${level}/2.`;
    const classes = ["monster-card"];
    if (!owned) classes.push("is-missing");
    if (inTeam || activeGoalkeeper) classes.push("is-team");

    return `
      <article class="${classes.join(" ")}">
        <span class="copy-badge">x${copies}</span>
        <button class="art-view-button" type="button" data-monster-view="${monster.id}">
          ${ctx.renderMonsterArt(monster, "monster-art", { loading: "lazy", revealHolographic: owned })}
        </button>
        <h3>#${String(monster.number).padStart(2, "0")} ${monster.name}</h3>
        <div class="stat-line">
          ${ctx.typeChips(monster)}
          <span class="rarity-chip">${monster.rarity}</span>
          ${ctx.holographicChip(monster)}
          ${level ? `<span class="rarity-chip">+${level}</span>` : ""}
          ${activeGoalkeeper ? `<span class="rarity-chip">Goleiro ativo</span>` : ""}
        </div>
        <div class="stat-line">
          ${ctx.monsterStatsLine(monster, stats)}
        </div>
        <p class="evolution-note">${owned ? upgradeNote : "Tazzo ainda nao obtido."}</p>
        <div class="card-actions">
          ${keeper
            ? `<button type="button" data-goalkeeper="${monster.id}" ${owned || activeGoalkeeper ? "" : "disabled"}>${activeGoalkeeper ? "Goleiro ativo" : "Usar como goleiro"}</button>`
            : `<button type="button" data-team="${monster.id}" ${owned ? "" : "disabled"}>${inTeam ? "No trio" : `Colocar no slot ${ctx.state.selectedSlot + 1}`}</button>
               <button class="secondary-button" type="button" data-upgrade="${monster.id}" ${canUpgrade ? "" : "disabled"}>${level >= 2 ? "Maximo" : "Melhorar"}</button>`}
        </div>
      </article>
    `;
  }

  window.TazzoMenuCollection = Object.freeze({
    renderCollection
  });
})();
