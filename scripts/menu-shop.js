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

  function cssImageUrl(value) {
    const url = String(value || "")
      .replace(/\\/g, "/")
      .replace(/\s/g, "%20")
      .replace(/"/g, "%22")
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    return `url("${url}")`;
  }

  function renderGlossBadge(item) {
    if (!item.badgeImage) return "";
    return `
      <span class="shop-sale-badge-wrap rarity-gloss-art" style="--tazzo-gloss-mask: ${escapeHtml(cssImageUrl(item.badgeImage))};">
        <img class="shop-sale-badge rarity-gloss-image" src="${escapeHtml(item.badgeImage)}" alt="${escapeHtml(item.badgeAlt || "")}">
        <span class="rarity-gloss-sweep" aria-hidden="true"></span>
      </span>
    `;
  }

  function renderCryptoPanel(ctx) {
    const crypto = ctx.state.crypto || {};
    const token = crypto.token || {};
    const network = crypto.network || {};
    const address = token.contractAddress || "";
    const explorerBase = network.explorerUrl ? String(network.explorerUrl).replace(/\/+$/, "") : "";
    const explorerLink = crypto.enabled && explorerBase && address
      ? `${explorerBase}/address/${address}`
      : "";
    const status = !crypto.checked
      ? "Checando..."
      : crypto.enabled
      ? "Sandbox ativo"
      : "Sandbox desligado";
    const addressText = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Sem contrato";
    return `
      <article class="shop-card crypto-testnet-card${crypto.enabled ? " is-active" : ""}">
        <span class="eyebrow">MerreisCoin</span>
        <h2>MER testnet</h2>
        <p>${escapeHtml(crypto.message || "Moeda crypto experimental dos Merreis, ainda sem valor real.")}</p>
        <div class="pack-meta">
          <span class="chip">${escapeHtml(status)}</span>
          <span class="rarity-chip">${escapeHtml(network.name || "testnet")} ${network.chainId ? `#${escapeHtml(network.chainId)}` : ""}</span>
        </div>
        <div class="crypto-contract-line">
          <span>Contrato</span>
          <strong>${escapeHtml(addressText)}</strong>
        </div>
        ${explorerLink ? `<a class="crypto-link-button" href="${escapeHtml(explorerLink)}" target="_blank" rel="noreferrer">Ver no explorer</a>` : `<button type="button" disabled>Contrato pendente</button>`}
      </article>
    `;
  }

  function renderShop(ctx) {
    const payments = ctx.state.shopPayments || {};
    const paymentNotice = payments.checked && !payments.configured ? payments.message : "";
    document.getElementById("shop-message").textContent = paymentNotice || ctx.state.shopMessage;
    const promoSlot = document.getElementById("shop-promo");
    if (promoSlot) {
      const promoItem = ctx.shopPromoItem?.();
      const promoHtml = promoItem && ctx.shopPromoAvailable?.(promoItem) && ctx.shopPromoBanner
        ? ctx.shopPromoBanner(promoItem, "shop")
        : "";
      promoSlot.innerHTML = promoHtml;
      promoSlot.hidden = !promoHtml;
    }
    const cryptoPanel = renderCryptoPanel(ctx);
    const gridItems = ctx.SHOP_ITEMS.filter((item) => !item.featured);
    document.getElementById("shop-grid").innerHTML = cryptoPanel + gridItems.map((item) => {
      const merreisPack = item.type === "merreis";
      const cosmeticSlot = item.cosmeticSlot || "profile";
      const oneTimePurchased = merreisPack && item.oneTime && Boolean(ctx.state.save.oneTimePurchases?.[item.id]);
      const owned = oneTimePurchased || (!merreisPack && Boolean(ctx.state.save.cosmetics[item.id]));
      const active = !merreisPack && ctx.isCosmeticEquipped(item.id);
      const paymentDisabled = merreisPack && (payments.checkoutPending || oneTimePurchased);
      const disabled = paymentDisabled || (!merreisPack && !owned && ctx.state.save.merreis < item.cost);
      const label = merreisPack
        ? oneTimePurchased
          ? "Comprado"
          : payments.checkoutPending
          ? "Abrindo..."
          : !payments.checked
          ? "Checando..."
          : payments.configured
          ? item.oneTime
            ? "Comprar pacote"
            : "Comprar Merreis"
          : "Indisponivel"
        : active
        ? "Equipado"
        : owned
        ? "Equipar"
        : "Comprar";
      const price = merreisPack ? item.priceLabel : `${ctx.formatNumber(item.cost)} Merreis`;
      const rewardTags = [
        item.merreis ? `+${ctx.formatNumber(item.merreis)} Merreis` : "",
        item.fragments ? `+${ctx.formatNumber(item.fragments)} frag` : "",
        item.legendaryCards ? `${ctx.formatNumber(item.legendaryCards)} Lendario(s)` : ""
      ].filter(Boolean);
      const tag = merreisPack ? rewardTags.join(" + ") : `${ctx.cosmeticSlotLabel(item)}${owned ? " obtido" : ""}`;
      const artwork = merreisPack && item.image
        ? `
          <figure
            class="shop-merreis-art${disabled ? " is-disabled" : ""}"
            aria-hidden="true"
          >
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            ${renderGlossBadge(item)}
          </figure>`
        : !merreisPack
        ? `<figure class="shop-cosmetic-preview is-${escapeHtml(cosmeticSlot)}" aria-hidden="true"><span></span></figure>`
        : "";
      const cardClass = `shop-card${owned ? " is-owned" : ""}${active ? " is-active" : ""}${merreisPack ? " is-merreis-pack" : " is-cosmetic-pack"}${item.oneTime ? " is-starter-bundle" : ""} is-shop-${escapeHtml(item.id)} is-slot-${escapeHtml(cosmeticSlot)}`;
      if (merreisPack) {
        return `
          <article
            class="${cardClass}"
            data-shop="${escapeHtml(item.id)}"
            data-disabled="${disabled ? "true" : "false"}"
            role="button"
            tabindex="${disabled ? "-1" : "0"}"
            aria-disabled="${disabled ? "true" : "false"}"
            aria-label="${escapeHtml(`${label} ${item.name} por ${item.priceLabel}`)}"
          >
            ${artwork}
          </article>
        `;
      }
      const action = merreisPack
        ? ""
        : `<button type="button" data-shop="${item.id}" ${disabled || active ? "disabled" : ""}>${label}</button>`;
      return `
        <article class="${cardClass}">
          ${artwork}
          <h2>${item.name}</h2>
          <p>${item.note}</p>
          <div class="pack-meta">
            <span class="chip">${price}</span>
            <span class="rarity-chip">${tag}</span>
          </div>
          ${action}
        </article>
      `;
    }).join("");
  }

  window.TazzoMenuShop = Object.freeze({
    renderShop
  });
})();
