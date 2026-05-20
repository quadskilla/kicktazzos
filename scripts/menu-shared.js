(function () {
  "use strict";

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

  function smallRow(ctx, monster, meta) {
    return `
      <button class="small-row" type="button" data-monster-view="${monster.id}">
        ${ctx.renderMonsterArt(monster, "small-row-art")}
        <div>
          <strong>${monster.name}</strong>
          <span>${monster.types.join("/")} - ${monster.rarity}${ctx.hasHolographicArt(monster) ? " - Holografico" : ""}</span>
        </div>
        <span class="chip">${meta}</span>
      </button>
    `;
  }

  window.TazzoMenuShared = Object.freeze({
    smallSummary,
    smallRow
  });
})();
