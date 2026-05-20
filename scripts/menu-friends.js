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

  function renderFriends(ctx) {
    const grid = document.getElementById("friends-grid");
    const message = document.getElementById("friend-message");
    if (!grid) return;
    const social = ctx.state.social;
    if (message) {
      message.textContent = ctx.hasOnlineProfile()
        ? social.loading ? "Atualizando amigos" : `${social.friends.length} amigo(s)`
        : "Entre em uma conta para adicionar amigos";
    }

    grid.innerHTML = `
      <article class="friend-card social-add-card">
        <div class="panel-heading">
          <span class="eyebrow">Adicionar</span>
          <span class="chip">${ctx.state.server.profile?.name ? escapeHtml(ctx.state.server.profile.name) : "Offline"}</span>
        </div>
        <h2>Enviar convite</h2>
        <form class="friend-add-form" id="friend-add-form">
          <input id="friend-name-input" type="text" value="${escapeHtml(social.inviteName)}" placeholder="Nome do jogador" autocomplete="off">
          <button type="submit">Adicionar amigo</button>
        </form>
        <p class="evolution-note ${social.error ? "is-error" : ""}">${escapeHtml(social.error || social.message || "Use o nome do perfil online do outro jogador.")}</p>
      </article>
      <article class="friend-card">
        <div class="panel-heading">
          <span class="eyebrow">Convites</span>
          <span class="chip">${social.incomingInvites.length}</span>
        </div>
        <div class="small-list">
          ${renderIncomingInvites(social)}
          ${renderOutgoingInvites(social)}
        </div>
      </article>
      <article class="friend-card friend-list-card">
        <div class="panel-heading">
          <span class="eyebrow">Amigos</span>
          <span class="chip">${social.friends.length}</span>
        </div>
        <div class="small-list">
          ${social.friends.length ? social.friends.map((friend) => renderFriendRow(ctx, friend)).join("") : `<p>Nenhum amigo ainda.</p>`}
        </div>
      </article>
      <article class="friend-card friend-chat-card">
        ${renderChat(ctx)}
      </article>
    `;

    ctx.decorateImageButtons(grid);
  }

  function renderIncomingInvites(social) {
    if (!social.incomingInvites.length) return `<p>Sem convites recebidos.</p>`;
    return social.incomingInvites.map((invite) => `
      <div class="small-row">
        <span class="chip">Novo</span>
        <div>
          <strong>${escapeHtml(invite.from?.name || "Jogador")}</strong>
          <span>quer ser seu amigo</span>
        </div>
        <span class="friend-inline-actions">
          <button type="button" data-friend-accept="${escapeHtml(invite.id)}">Aceitar</button>
          <button type="button" data-friend-decline="${escapeHtml(invite.id)}">Recusar</button>
        </span>
      </div>
    `).join("");
  }

  function renderOutgoingInvites(social) {
    if (!social.outgoingInvites.length) return "";
    return social.outgoingInvites.map((invite) => `
      <div class="small-row">
        <span class="chip">Enviado</span>
        <div>
          <strong>${escapeHtml(invite.to?.name || "Jogador")}</strong>
          <span>aguardando resposta</span>
        </div>
        <span></span>
      </div>
    `).join("");
  }

  function renderFriendRow(ctx, friend) {
    const selected = ctx.state.social.selectedFriendId === friend.playerId;
    const pendingTrades = ctx.state.social.trades.filter((trade) => trade.status === "pending" && (trade.fromPlayerId === friend.playerId || trade.toPlayerId === friend.playerId)).length;
    return `
      <button class="small-row ${selected ? "is-active" : ""}" type="button" data-friend-select="${escapeHtml(friend.playerId)}">
        <span class="profile-avatar-mini">${escapeHtml((friend.name || "?").slice(0, 1).toUpperCase())}</span>
        <div>
          <strong>${escapeHtml(friend.name)}</strong>
          <span>${pendingTrades ? `${pendingTrades} proposta(s) pendente(s)` : "Abrir conversa"}</span>
        </div>
        <span class="chip">${escapeHtml(friend.key || "amigo")}</span>
      </button>
    `;
  }

  function renderChat(ctx) {
    const social = ctx.state.social;
    const friend = social.friends.find((item) => item.playerId === social.selectedFriendId) || social.friends[0];
    if (!friend) {
      return `
        <div class="panel-heading">
          <span class="eyebrow">Conversa</span>
          <span class="chip">0</span>
        </div>
        <h2>Escolha um amigo</h2>
        <p class="evolution-note">Convites aceitos liberam chat e propostas de troca.</p>
      `;
    }
    const messages = social.messages.filter((item) => item.friendPlayerId === friend.playerId).slice(-30);
    return `
      <div class="panel-heading">
        <span class="eyebrow">Conversa</span>
        <span class="chip">${escapeHtml(friend.name)}</span>
      </div>
      <div class="friend-chat-log">
        ${messages.length ? messages.map(renderMessage).join("") : `<p>Nenhuma mensagem ainda.</p>`}
      </div>
      <form class="friend-chat-form" id="friend-chat-form">
        <input id="friend-chat-input" type="text" value="${escapeHtml(social.draftMessage)}" placeholder="Mensagem" autocomplete="off">
        <button type="submit" data-friend-message="${escapeHtml(friend.playerId)}">Enviar</button>
      </form>
    `;
  }

  function renderMessage(message) {
    return `
      <div class="chat-bubble ${message.fromYou ? "is-you" : ""}">
        <span>${message.fromYou ? "Voce" : "Amigo"}</span>
        <p>${escapeHtml(message.message)}</p>
      </div>
    `;
  }

  window.TazzoMenuFriends = Object.freeze({
    renderFriends
  });
})();
