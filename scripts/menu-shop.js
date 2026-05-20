(function () {
  "use strict";

  function renderShop(ctx) {
    document.getElementById("shop-message").textContent = ctx.state.shopMessage;
    document.getElementById("shop-grid").innerHTML = ctx.SHOP_ITEMS.map((item) => {
      const merreisPack = item.type === "merreis";
      const owned = !merreisPack && Boolean(ctx.state.save.cosmetics[item.id]);
      const active = !merreisPack && ctx.state.save.selectedCosmetic === item.id;
      const disabled = !merreisPack && !owned && ctx.state.save.merreis < item.cost;
      const label = merreisPack ? "Comprar Merreis" : active ? "Ativo" : owned ? "Ativar" : "Comprar";
      const price = merreisPack ? item.priceLabel : `${ctx.formatNumber(item.cost)} Merreis`;
      const tag = merreisPack ? `+${ctx.formatNumber(item.merreis)} Merreis` : owned ? "Obtido" : "Cosmetico";
      return `
        <article class="shop-card${owned ? " is-owned" : ""}${active ? " is-active" : ""}${merreisPack ? " is-merreis-pack" : ""}">
          <h2>${item.name}</h2>
          <p>${item.note}</p>
          <div class="pack-meta">
            <span class="chip">${price}</span>
            <span class="rarity-chip">${tag}</span>
          </div>
          <button type="button" data-shop="${item.id}" ${disabled || active ? "disabled" : ""}>${label}</button>
        </article>
      `;
    }).join("");
  }

  window.TazzoMenuShop = Object.freeze({
    renderShop
  });
})();
