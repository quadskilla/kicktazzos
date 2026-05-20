(function () {
  "use strict";

  function renderPackPity(ctx) {
    const pity = ctx.state.save.packPity;
    const legendaryCount = Math.min(pity.sinceLegendaryPlus, ctx.LEGENDARY_BOOST_MAX_TAZZOS);
    const boostMultiplier = ctx.legendaryBoostMultiplier(pity.sinceLegendaryPlus);
    const boostReady = boostMultiplier > 1;
    const boostMaxReady = boostMultiplier >= ctx.LEGENDARY_BOOST_MAX_MULTIPLIER;
    const nextGoal = boostReady ? ctx.LEGENDARY_BOOST_MAX_TAZZOS : ctx.LEGENDARY_BOOST_TAZZOS;
    const nextBoost = boostReady ? ctx.LEGENDARY_BOOST_MAX_MULTIPLIER : ctx.LEGENDARY_BOOST_MULTIPLIER;
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
          <small>${legendaryCount}/${ctx.LEGENDARY_BOOST_MAX_TAZZOS} sem Lendario+${boostReady && !boostMaxReady ? " - 2x ativo" : ""}</small>
        </div>
        <div class="progress" aria-label="Progresso para boost lendario">
          <span style="width:${Math.round((legendaryCount / ctx.LEGENDARY_BOOST_MAX_TAZZOS) * 100)}%"></span>
        </div>
      </article>
    `;
  }

  function renderPacks(ctx) {
    const grid = document.getElementById("pack-grid");
    if (!grid) return;

    const packBusy = ctx.isPackBusy();
    const canRevealAll = !ctx.state.packOpening && ctx.state.packReveal.some((pull) => !pull.revealed && !pull.flipping);
    const pityPanel = document.getElementById("pack-pity");
    const revealAllButton = document.getElementById("reveal-all-button");
    if (pityPanel) pityPanel.innerHTML = renderPackPity(ctx);
    if (revealAllButton) revealAllButton.disabled = !canRevealAll;

    const gridKey = `packs:${packBusy}:${ctx.state.save.merreis}:${ctx.PACKS.length}:${ctx.state.save.packPity.sinceLegendaryPlus}`;
    if (grid.dataset.renderKey !== gridKey) {
      grid.dataset.renderKey = gridKey;
      grid.innerHTML = ctx.PACKS.map((pack) => `
        <article class="pack-card${packBusy ? " is-disabled" : ""}">
          <img class="pack-card-art" src="${pack.image}" alt="Pacote ${pack.name}">
          <h2>${pack.name}</h2>
          <p>${pack.note}</p>
          <div class="pack-meta">
            <span class="chip">${pack.cards}x</span>
            <span class="chip">${ctx.formatNumber(pack.cost)} Merreis</span>
          </div>
          <button type="button" data-pack="${pack.id}" ${packBusy || ctx.state.save.merreis < pack.cost ? "disabled" : ""}>Abrir</button>
        </article>
      `).join("");

      grid.querySelectorAll("button[data-pack]").forEach((button) => {
        button.addEventListener("click", () => ctx.openPack(button.dataset.pack));
      });
    }

    const results = document.getElementById("pack-results");
    if (!results) return;
    results.classList.remove("has-reveal-shortcut", "is-results-popup");
    if (ctx.state.packOpening) {
      const openingKey = `opening:${ctx.state.packOpening.packId}:${ctx.state.packOpening.packName}:${ctx.state.packReveal.length}`;
      if (results.dataset.renderKey !== openingKey) {
        results.dataset.renderKey = openingKey;
        results.innerHTML = renderPackOpening(ctx);
        results.querySelectorAll("[data-pack-stage='tear']").forEach((button) => {
          button.addEventListener("click", ctx.tearOpenPack);
        });
        results.querySelectorAll("[data-pack-stage='cards']").forEach((button) => {
          button.addEventListener("click", ctx.showPackCards);
        });
      }
      return;
    }

    if (!ctx.state.packReveal.length) {
      if (results.dataset.renderKey !== "empty") {
        results.dataset.renderKey = "empty";
        results.innerHTML = "";
      }
      return;
    }

    const canRevealAllNow = ctx.state.packReveal.some((pull) => !pull.revealed && !pull.flipping);
    const revealedCount = ctx.state.packReveal.filter((pull) => pull.revealed).length;
    const resultsKey = packResultsRenderKey(ctx);
    results.classList.toggle("has-reveal-shortcut", canRevealAllNow);
    results.classList.add("is-results-popup");
    if (results.dataset.renderKey === resultsKey) return;
    results.dataset.renderKey = resultsKey;
    const revealShortcut = canRevealAllNow
      ? `<button class="pack-reveal-all-corner" type="button" data-reveal-all-pulls aria-label="Virar todos os tazzos"></button>`
      : "";
    const pullsHtml = ctx.state.packReveal.map((pull, index) => renderPullCard(ctx, pull, index)).join("");

    results.innerHTML = `
      <section class="pack-results-overlay" role="dialog" aria-modal="true" aria-labelledby="pack-results-title">
        <div class="pack-results-dialog">
          <div class="pack-results-head">
            <div>
              <span class="eyebrow">Pacotinho aberto</span>
              <h2 id="pack-results-title">Tazzos encontrados</h2>
            </div>
            <div class="pack-results-actions">
              <span class="chip" data-pack-results-count>${revealedCount}/${ctx.state.packReveal.length}</span>
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

  function packResultsRenderKey(ctx) {
    if (!ctx.state.packReveal.length) return "empty";
    return `results:${ctx.state.packReveal.map((pull) => [
      pull.monsterId,
      pull.isNew ? 1 : 0,
      pull.fragments,
      pull.revealed ? 1 : 0,
      pull.flipping ? 1 : 0,
      pull.justRevealed ? 1 : 0
    ].join(":")).join("|")}`;
  }

  function renderPullCard(ctx, pull, index) {
    const monster = ctx.MONSTER_BY_ID[pull.monsterId];
    if (!monster) return "";
    if (!pull.revealed) {
      const auraClass = rarityAuraClass(monster.rarity);
      const flippingClass = pull.flipping ? " is-flipping" : "";
      return `
        <button class="pull-card is-hidden ${auraClass}${flippingClass}" type="button" data-reveal="${index}" data-pull-index="${index}">
          <span class="pull-art-frame">
            <img class="pull-back-image" src="${ctx.monsterBackImage(monster)}" alt="Verso do tazzo">
          </span>
          <span class="pull-hidden-spacer" aria-hidden="true">?</span>
        </button>
      `;
    }

    const rare = ["Raro", "Epico", "Lendario", "Mistico", "Mistico Secreto"].includes(monster.rarity) ? " is-rare" : "";
    const flippedIn = pull.justRevealed ? " is-flipped-in" : "";
    const premiumReveal = pull.justRevealed && ctx.isAtLeastRarity(monster.rarity, "Epico") ? ` is-premium-reveal ${rarityAuraClass(monster.rarity)}` : "";
    const revealBadge = premiumReveal ? `<span class="pull-reveal-badge">${ctx.premiumRevealLabel(monster.rarity)}</span>` : "";
    const label = pull.isNew ? "Novo" : `+${pull.fragments} frag`;
    const stats = ctx.monsterStats(monster);
    return `
      <button class="pull-card${rare}${flippedIn}${premiumReveal}" type="button" data-monster-view="${monster.id}" data-pull-index="${index}">
        ${revealBadge}
        <span class="pull-art-frame">
          ${ctx.renderMonsterArt(monster, "pull-front-image")}
        </span>
        <span class="pull-info">
          <h3>${monster.name}</h3>
          <span class="stat-line">
            ${ctx.typeChips(monster)}
            <span class="rarity-chip">${monster.rarity}</span>
            ${ctx.holographicChip(monster)}
          </span>
          <span class="stat-line">
            ${ctx.monsterStatsLine(monster, stats)}
          </span>
          <span class="chip">${label}</span>
        </span>
      </button>
    `;
  }

  function renderPackOpening(ctx) {
    const opening = ctx.state.packOpening;
    const pack = ctx.PACKS.find((item) => item.id === opening.packId);
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
            <p>${ctx.state.packReveal.length} disco(s) estao saindo da embalagem.</p>
            <div class="pack-opening-progress" aria-hidden="true"><span></span></div>
          </div>
        </div>
      </section>
    `;
  }

  window.TazzoMenuPacks = Object.freeze({
    renderPackPity,
    renderPacks,
    rarityAuraClass,
    packResultsRenderKey,
    renderPullCard,
    renderPackOpening
  });
})();
