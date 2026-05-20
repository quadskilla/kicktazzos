(function () {
  "use strict";

  function renderTrade(ctx) {
    const duplicates = ctx.MONSTERS.filter((monster) => (ctx.state.save.collection[monster.id] || 0) > 1);
    const missing = ctx.visibleCollectionMonsters().filter((monster) => !ctx.state.save.collection[monster.id]);
    const offerSelect = document.getElementById("trade-offer");
    const wishSelect = document.getElementById("trade-wish");
    if (!offerSelect || !wishSelect) return;

    if (!duplicates.some((monster) => monster.id === ctx.state.selectedTrade.offer)) {
      ctx.state.selectedTrade.offer = duplicates[0]?.id || "";
    }
    if (!missing.some((monster) => monster.id === ctx.state.selectedTrade.wish)) {
      ctx.state.selectedTrade.wish = missing[0]?.id || "";
    }

    offerSelect.innerHTML = duplicates.length
      ? duplicates.map((monster) => `<option value="${monster.id}" ${monster.id === ctx.state.selectedTrade.offer ? "selected" : ""}>${monster.name} x${ctx.state.save.collection[monster.id]}</option>`).join("")
      : `<option value="">Sem repetidos</option>`;

    wishSelect.innerHTML = missing.length
      ? missing.map((monster) => `<option value="${monster.id}" ${monster.id === ctx.state.selectedTrade.wish ? "selected" : ""}>${monster.name} - ${monster.rarity}</option>`).join("")
      : `<option value="">Album completo</option>`;

    document.getElementById("duplicate-list").innerHTML = duplicates.length
      ? duplicates.map((monster) => window.TazzoMenuShared.smallRow(ctx, monster, `x${ctx.state.save.collection[monster.id]}`)).join("")
      : `<p>Nenhum repetido agora.</p>`;

    document.getElementById("wish-list").innerHTML = missing.length
      ? missing.slice(0, 8).map((monster) => window.TazzoMenuShared.smallRow(ctx, monster, monster.rarity)).join("")
      : `<p>Album completo.</p>`;

    document.getElementById("trade-log").innerHTML = ctx.state.tradeLog.length
      ? ctx.state.tradeLog.map((line) => `<p>${line}</p>`).join("")
      : `<p>Sem trocas nesta sessao.</p>`;

    document.getElementById("trade-message").textContent = duplicates.length && missing.length
      ? "Taxa de 60 Merreis por troca."
      : "Abra pacotinhos para criar repetidos e desejos.";

    document.getElementById("trade-button").disabled = !duplicates.length || !missing.length || ctx.state.save.merreis < 60;
  }

  window.TazzoMenuTrades = Object.freeze({
    renderTrade
  });
})();
