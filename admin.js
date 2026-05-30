(function () {
  "use strict";

  const state = {
    session: null,
    summary: null,
    days: 7
  };

  const accessCard = document.getElementById("access-card");
  const dashboard = document.getElementById("dashboard");
  const tokenForm = document.getElementById("token-form");
  const tokenInput = document.getElementById("token-input");
  const accessMessage = document.getElementById("access-message");
  const logoutButton = document.getElementById("admin-logout");
  const refreshButton = document.getElementById("refresh-button");
  const rangeSelect = document.getElementById("range-select");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR").format(Math.max(0, Math.floor(Number(value)) || 0));
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Falha ao carregar.");
    return payload;
  }

  function showAccess(message = "") {
    accessCard.hidden = false;
    dashboard.hidden = true;
    logoutButton.hidden = true;
    tokenForm.hidden = !state.session?.tokenEnabled;
    accessMessage.textContent = message || (state.session?.tokenEnabled
      ? "Voce tambem pode entrar com o ADMIN_TOKEN configurado no servidor."
      : "Sem token configurado. Use a conta Google admin no jogo.");
  }

  function showDashboard() {
    accessCard.hidden = true;
    dashboard.hidden = false;
    logoutButton.hidden = false;
    const profile = state.session?.profile;
    document.getElementById("admin-profile").textContent = profile?.name
      ? `${profile.name} (${state.session.method || "admin"})`
      : `Admin via ${state.session?.method || "token"}`;
  }

  function renderMetricGrid(summary) {
    const overview = summary.overview || {};
    const metrics = [
      ["Eventos", overview.events, `${summary.window?.days || state.days} dias analisados`],
      ["Jogadores ativos", overview.uniquePlayers, `${overview.profilePlayers || 0} com conta, ${overview.guestPlayers || 0} visitantes`],
      ["Perfis totais", overview.totalProfiles, `${overview.totalSaves || 0} saves no servidor`],
      ["Tutorial", `${overview.tutorialCompletionRate || 0}%`, "Conclusao estimada da janela"]
    ];
    document.getElementById("metric-grid").innerHTML = metrics.map(([label, value, meta]) => `
      <article class="metric">
        <span>${escapeHtml(label)}</span>
        <strong>${typeof value === "number" ? formatNumber(value) : escapeHtml(value)}</strong>
        <small>${escapeHtml(meta)}</small>
      </article>
    `).join("");
  }

  function renderBars(elementId, rows, labelKey, emptyText) {
    const element = document.getElementById(elementId);
    const max = Math.max(1, ...rows.map((row) => Number(row.count) || 0));
    element.innerHTML = rows.length ? rows.map((row) => {
      const label = row[labelKey] || row.key || "desconhecido";
      const width = Math.round(((Number(row.count) || 0) / max) * 100);
      const extra = row.uniquePlayers !== undefined ? `, ${formatNumber(row.uniquePlayers)} jogadores` : "";
      return `
        <div class="bar-row">
          <div class="bar-row-header">
            <strong>${escapeHtml(label)}</strong>
            <small>${formatNumber(row.count)}${escapeHtml(extra)}</small>
          </div>
          <div class="bar-track"><span class="bar-fill" style="--bar-width:${width}%"></span></div>
        </div>
      `;
    }).join("") : `<div class="empty">${escapeHtml(emptyText)}</div>`;
  }

  function renderTutorial(summary) {
    const steps = summary.tutorial?.steps || [];
    const max = Math.max(1, ...steps.map((step) => Number(step.complete) || 0));
    document.getElementById("tutorial-rate").textContent = `${summary.overview?.tutorialCompletionRate || 0}%`;
    document.getElementById("tutorial-funnel").innerHTML = steps.length ? steps.map((step, index) => {
      const width = Math.round(((Number(step.complete) || 0) / max) * 100);
      return `
        <div class="funnel-row">
          <div class="funnel-row-header">
            <strong>${index + 1}. ${escapeHtml(step.title)}</strong>
            <small>${formatNumber(step.uniquePlayers)} jogadores</small>
          </div>
          <div class="bar-track"><span class="bar-fill" style="--bar-width:${width}%"></span></div>
          <div class="funnel-stats">
            <span class="chip">acao ${formatNumber(step.action)}</span>
            <span class="chip">popup ${formatNumber(step.ready)}</span>
            <span class="chip">concluiu ${formatNumber(step.complete)}</span>
          </div>
        </div>
      `;
    }).join("") : `<div class="empty">Sem eventos de tutorial ainda.</div>`;
  }

  function renderRecentEvents(summary) {
    const rows = summary.recentEvents || [];
    document.getElementById("recent-events").innerHTML = rows.length ? rows.map((event) => `
      <div class="event-row">
        <span>${escapeHtml(formatTime(event.createdAt))}</span>
        <strong>${escapeHtml(event.type)}</strong>
        <span>${escapeHtml(event.playerName || "Visitante")}</span>
        <code>${escapeHtml(JSON.stringify(event.data || {}))}</code>
      </div>
    `).join("") : `<div class="empty">Nenhum evento recente.</div>`;
  }

  function renderSummary() {
    const summary = state.summary;
    if (!summary) return;
    renderMetricGrid(summary);
    renderTutorial(summary);
    renderBars("tab-list", summary.tabs || [], "tab", "Sem navegacao registrada.");
    renderBars("pack-list", summary.packs || [], "packId", "Sem pacotinhos registrados.");
    renderBars("battle-list", summary.battles || [], "key", "Sem batalhas registradas.");
    renderBars("event-type-list", summary.eventTypes || [], "key", "Sem eventos registrados.");
    renderRecentEvents(summary);
  }

  async function loadSession() {
    state.session = await fetchJson("/api/admin/session");
    if (state.session.admin) showDashboard();
    else showAccess();
  }

  async function loadSummary() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Atualizando...";
    try {
      const payload = await fetchJson(`/api/admin/telemetry/summary?days=${encodeURIComponent(state.days)}`);
      state.summary = payload.summary;
      state.session = {
        ...(state.session || {}),
        admin: true,
        method: payload.admin?.method || state.session?.method,
        profile: payload.admin?.profile || state.session?.profile
      };
      showDashboard();
      renderSummary();
    } catch (error) {
      showAccess(error.message);
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "Atualizar";
    }
  }

  tokenForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    accessMessage.textContent = "Entrando...";
    try {
      await fetchJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ token: tokenInput.value })
      });
      tokenInput.value = "";
      await loadSession();
      await loadSummary();
    } catch (error) {
      accessMessage.textContent = error.message;
    }
  });

  logoutButton.addEventListener("click", async () => {
    await fetchJson("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => {});
    state.session = null;
    state.summary = null;
    await loadSession();
  });

  refreshButton.addEventListener("click", loadSummary);
  rangeSelect.addEventListener("change", () => {
    state.days = Number(rangeSelect.value) || 7;
    loadSummary();
  });

  (async function init() {
    try {
      await loadSession();
      if (state.session.admin) await loadSummary();
    } catch (error) {
      showAccess(error.message);
    }
  })();
})();
