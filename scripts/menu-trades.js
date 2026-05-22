(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderTrade(ctx) {
    const friendSelect = document.getElementById("trade-friend");
    const offerSelect = document.getElementById("trade-offer");
    const wishSelect = document.getElementById("trade-wish");
    const button = document.getElementById("trade-button");
    if (!offerSelect || !wishSelect || !button) return;

    const social = ctx.state.social;
    const friend = social.friends.find((item) => item.playerId === social.tradeFriendId) || social.friends[0] || null;
    if (friend && social.tradeFriendId !== friend.playerId) social.tradeFriendId = friend.playerId;

    if (friendSelect) {
      friendSelect.innerHTML = social.friends.length
        ? social.friends.map((item) => `<option value="${escapeHtml(item.playerId)}" ${item.playerId === social.tradeFriendId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")
        : `<option value="">Sem amigos</option>`;
    }

    offerSelect.multiple = true;
    wishSelect.multiple = true;
    offerSelect.size = 7;
    wishSelect.size = 7;

    const owned = ctx.visibleCollectionMonsters().filter((monster) => (ctx.state.save.collection[monster.id] || 0) > 0);
    const wantedIds = Object.entries(ctx.state.save.wishlist || {}).filter(([, wanted]) => wanted).map(([id]) => id);
    const requestPool = wantedIds.map((id) => ctx.MONSTER_BY_ID[id]).filter(Boolean);
    social.tradeDraft.offerIds = social.tradeDraft.offerIds.filter((id) => owned.some((monster) => monster.id === id)).slice(0, 3);
    social.tradeDraft.requestIds = social.tradeDraft.requestIds.filter((id) => requestPool.some((monster) => monster.id === id)).slice(0, 3);

    offerSelect.innerHTML = owned.length
      ? owned.map((monster) => optionTemplate(ctx, monster, social.tradeDraft.offerIds.includes(monster.id), `x${ctx.state.save.collection[monster.id]}`)).join("")
      : `<option value="">Nenhum tazzo disponivel</option>`;

    wishSelect.innerHTML = requestPool.length
      ? requestPool.map((monster) => optionTemplate(ctx, monster, social.tradeDraft.requestIds.includes(monster.id), "desejo")).join("")
      : `<option value="">Marque desejos no album</option>`;

    const offerValue = selectedValue(ctx, social.tradeDraft.offerIds);
    const requestValue = selectedValue(ctx, social.tradeDraft.requestIds);
    const canSend = Boolean(friend && social.tradeDraft.offerIds.length && social.tradeDraft.requestIds.length && offerValue === requestValue);
    button.textContent = "Enviar proposta";
    button.disabled = !canSend;

    const duplicateList = document.getElementById("duplicate-list");
    if (duplicateList) {
      duplicateList.innerHTML = social.tradeDraft.offerIds.length
        ? social.tradeDraft.offerIds.map((id) => selectedRow(ctx, id, "oferta")).join("")
        : `<p>Selecione ate 3 tazzos para oferecer.</p>`;
    }

    const wishList = document.getElementById("wish-list");
    if (wishList) {
      wishList.innerHTML = social.tradeDraft.requestIds.length
        ? social.tradeDraft.requestIds.map((id) => selectedRow(ctx, id, "pedido")).join("")
        : `<p>Use o coracao no album para montar sua lista de desejos.</p>`;
    }

    const message = document.getElementById("trade-message");
    if (message) {
      message.textContent = friend
        ? `Oferta ${offerValue} x Pedido ${requestValue}. Valores precisam ser iguais.`
        : "Adicione um amigo antes de propor trocas.";
    }

    const log = document.getElementById("trade-log");
    if (log) {
      log.innerHTML = renderTradeLog(ctx);
    }

    ctx.decorateImageButtons(document.getElementById("view-trade"));
  }

  function optionTemplate(ctx, monster, selected, meta) {
    return `<option value="${escapeHtml(monster.id)}" ${selected ? "selected" : ""}>${escapeHtml(monster.name)} - ${escapeHtml(monster.rarity)} (${ctx.tradeValue(monster.id)}) ${escapeHtml(meta)}</option>`;
  }

  function selectedValue(ctx, ids) {
    return ids.reduce((sum, id) => sum + ctx.tradeValue(id), 0);
  }

  function selectedRow(ctx, id, label) {
    const monster = ctx.MONSTER_BY_ID[id];
    if (!monster) return "";
    return window.TazzoMenuShared.smallRow(ctx, monster, `${label} ${ctx.tradeValue(id)}`);
  }

  function renderTradeLog(ctx) {
    const social = ctx.state.social;
    const trades = social.trades || [];
    if (!trades.length) return `<p>Sem propostas ainda.</p>`;
    return trades.map((trade) => renderTradeOffer(ctx, trade)).join("");
  }

  function renderTradeOffer(ctx, trade) {
    const fromYou = trade.fromPlayerId === ctx.state.server.playerId;
    const incoming = trade.toPlayerId === ctx.state.server.playerId && trade.status === "pending";
    const friendName = fromYou ? trade.to?.name : trade.from?.name;
    const offerValue = selectedValue(ctx, trade.offeredIds || []);
    const requestValue = selectedValue(ctx, trade.requestedIds || []);
    const balanced = offerValue === requestValue;
    const receiveIds = incoming ? trade.offeredIds : trade.requestedIds;
    const giveIds = incoming ? trade.requestedIds : trade.offeredIds;
    const receiveValue = selectedValue(ctx, receiveIds || []);
    const giveValue = selectedValue(ctx, giveIds || []);
    const receiveTitle = incoming ? "Voce recebe" : fromYou ? "Voce pediu" : "Oferta";
    const giveTitle = incoming ? "Voce entrega" : fromYou ? "Voce oferece" : "Pedido";
    const title = incoming
      ? `${friendName || "Amigo"} quer trocar com voce`
      : fromYou
      ? `Sua proposta para ${friendName || "amigo"}`
      : `${friendName || "Amigo"} fez uma proposta`;
    return `
      <article class="trade-offer-row trade-offer-card ${incoming ? "is-incoming" : fromYou ? "is-outgoing" : ""} is-${escapeHtml(trade.status)}">
        <div class="trade-offer-header">
          <div>
            <span class="eyebrow">${incoming ? "Nova proposta" : "Proposta"}</span>
            <strong>${escapeHtml(title)}</strong>
          </div>
          <span class="chip">${escapeHtml(statusLabel(trade.status))}</span>
        </div>
        <div class="trade-offer-visual">
          ${tradeSideTemplate(ctx, receiveTitle, receiveIds, receiveValue, incoming ? "receive" : "neutral")}
          <div class="trade-swap-mark" aria-hidden="true">
            <img src="assets/generated-ui/icon-trade.png" alt="">
          </div>
          ${tradeSideTemplate(ctx, giveTitle, giveIds, giveValue, incoming ? "give" : "neutral")}
        </div>
        <div class="trade-offer-summary">
          <span class="trade-balance ${balanced ? "is-balanced" : "is-warning"}">
            ${balanced ? "Valores iguais" : "Valores diferentes"}: ${offerValue} x ${requestValue}
          </span>
          <span>${incoming ? "Confira os tazzos antes de aceitar." : tradeStatusDetail(trade.status)}</span>
        </div>
        ${incoming ? `
          <div class="trade-offer-actions">
            <button type="button" data-trade-accept="${escapeHtml(trade.id)}">Aceitar troca</button>
            <button type="button" data-trade-decline="${escapeHtml(trade.id)}">Recusar</button>
          </div>
        ` : ""}
      </article>
    `;
  }

  function tradeSideTemplate(ctx, title, ids = [], value = 0, tone = "neutral") {
    return `
      <section class="trade-side-card is-${escapeHtml(tone)}">
        <div class="trade-side-heading">
          <span>${escapeHtml(title)}</span>
          <strong>${value} pts</strong>
        </div>
        <div class="trade-tazzo-stack">
          ${ids.length ? ids.map((id) => tradeTazzoTile(ctx, id)).join("") : `<p>Nenhum tazzo.</p>`}
        </div>
      </section>
    `;
  }

  function tradeTazzoTile(ctx, id) {
    const monster = ctx.MONSTER_BY_ID[id];
    if (!monster) return `<div class="trade-tazzo-tile"><span>${escapeHtml(id)}</span></div>`;
    return `
      <button class="trade-tazzo-tile" type="button" data-monster-view="${escapeHtml(monster.id)}">
        ${ctx.renderMonsterArt(monster, "trade-tazzo-art")}
        <span>
          <strong>${escapeHtml(monster.name)}</strong>
          <small>${escapeHtml(monster.rarity)} - ${ctx.tradeValue(monster.id)} pts</small>
        </span>
      </button>
    `;
  }

  function monsterName(ctx, id) {
    return ctx.MONSTER_BY_ID[id]?.name || id;
  }

  function tradeStatusDetail(status) {
    return {
      pending: "Aguardando resposta.",
      accepted: "Troca concluida e colecoes atualizadas.",
      declined: "Proposta recusada.",
      cancelled: "Proposta cancelada."
    }[status] || "Historico da proposta.";
  }

  function statusLabel(status) {
    return {
      pending: "Pendente",
      accepted: "Aceita",
      declined: "Recusada",
      cancelled: "Cancelada"
    }[status] || "Historico";
  }

  window.TazzoMenuTrades = Object.freeze({
    renderTrade
  });
})();
