(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function renderShop(ctx) {
    const payments = ctx.state.shopPayments || {};
    const paymentNotice = payments.checked && !payments.configured ? payments.message : "";
    document.getElementById("shop-message").textContent = paymentNotice || ctx.state.shopMessage;
    document.getElementById("shop-grid").innerHTML = ctx.SHOP_ITEMS.map((item) => {
      const merreisPack = item.type === "merreis";
      const cosmeticSlot = item.cosmeticSlot || "profile";
      const owned = !merreisPack && Boolean(ctx.state.save.cosmetics[item.id]);
      const active = !merreisPack && ctx.isCosmeticEquipped(item.id);
      const paymentDisabled = merreisPack && (!payments.checked || !payments.configured || payments.checkoutPending);
      const disabled = paymentDisabled || (!merreisPack && !owned && ctx.state.save.merreis < item.cost);
      const label = merreisPack
        ? payments.checkoutPending
          ? "Abrindo..."
          : !payments.checked
          ? "Checando..."
          : payments.configured
          ? "Comprar Merreis"
          : "Indisponivel"
        : active
        ? "Equipado"
        : owned
        ? "Equipar"
        : "Comprar";
      const price = merreisPack ? item.priceLabel : `${ctx.formatNumber(item.cost)} Merreis`;
      const tag = merreisPack ? `+${ctx.formatNumber(item.merreis)} Merreis` : `${ctx.cosmeticSlotLabel(item)}${owned ? " obtido" : ""}`;
      const artwork = merreisPack && item.image
        ? `<figure class="shop-merreis-art"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></figure>`
        : !merreisPack
        ? `<figure class="shop-cosmetic-preview is-${escapeHtml(cosmeticSlot)}" aria-hidden="true"><span></span></figure>`
        : "";
      return `
        <article class="shop-card${owned ? " is-owned" : ""}${active ? " is-active" : ""}${merreisPack ? " is-merreis-pack" : " is-cosmetic-pack"} is-slot-${escapeHtml(cosmeticSlot)}">
          ${artwork}
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
