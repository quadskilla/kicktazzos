// Battle rendering and combat UI helpers.

function renderBattle() {
  renderTeams();
  renderBattleSetup();
  renderBattleHome();
  renderBattleShell();
  if (!state.battle) {
    clearBattleScene();
    decorateImageButtons();
    return;
  }
  renderBattleSceneSummary();
  renderTurnOrder();
  renderArena();
  renderBattleScore();
  renderBattleResult();
  renderCommands();
  renderBattleLog();
  decorateImageButtons();
}

function renderBattleShell() {
  const home = document.getElementById("battle-home");
  const scene = document.getElementById("battle-scene");
  if (!home || !scene) return;
  if (!state.battle) state.battleSceneOpen = false;
  home.classList.toggle("is-active", !state.battleSceneOpen);
  scene.classList.toggle("is-active", state.battleSceneOpen);
}

function renderBattleHome() {
  const card = document.getElementById("battle-resume-card");
  if (!card) return;

  if (!state.battle) {
    const onlineResume = resumableOnlineMatch();
    if (onlineResume) {
      const { lobby, match } = onlineResume;
      const finished = Boolean(match.battleState?.over);
      const rematch = lobby.rematch || {};
      const title = finished ? "Resultado online disponivel" : "Partida online em andamento";
      const action = finished ? "Ver resultado" : match.isYourTurn ? "Continuar seu turno" : "Continuar assistindo";
      card.innerHTML = `
        <span class="eyebrow">Reconexao online</span>
        <h2>${title}</h2>
        <p>${match.message || `Sala ${lobby.id} sincronizada pelo servidor.`}</p>
        <div class="resume-meta">
          <span>Sala ${lobby.id}</span>
          <span>Rodada ${Math.max(1, Number(match.round) || 1)}</span>
          <span>${finished && rematch.requestedCount ? `Revanche ${rematch.requestedCount}/${rematch.requiredCount}` : match.isYourTurn ? "Seu turno" : `Turno de ${match.turnName}`}</span>
        </div>
        <button type="button" data-open-online-battle="true">${action}</button>
      `;
      return;
    }
    const locked = activeLockedBattle();
    card.innerHTML = `
      <span class="eyebrow">Cena de batalha</span>
      <h2>Nenhuma partida aberta</h2>
      <p>Escolha um modo, um adversario e uma formacao para entrar na arena.</p>
      <button type="button" data-start-battle="true" ${locked ? "disabled" : ""}>Abrir cena</button>
    `;
    return;
  }

  const result = state.battle.result;
  const modeName = state.battle.online ? "Online" : BATTLE_MODES[state.battle.mode]?.name || "Batalha";
  const active = activePiece();
  const status = state.battle.over ? (result?.title || state.battle.status) : state.battle.status;
  const turnText = active ? `${monsterOf(active).name} em turno` : "Partida encerrada";
  const actionLabel = state.battle.over ? "Ver resultado" : "Entrar na cena";
  card.innerHTML = `
    <span class="eyebrow">${state.battle.over ? "Ultimo resultado" : "Partida em andamento"}</span>
    <h2>${modeName} contra ${state.battle.enemyName}</h2>
    <p>${status}</p>
    <div class="resume-meta">
      <span>Tempo ${formatTime(state.battle.matchTime || 0)}</span>
      <span>Rodada ${Math.max(1, state.battle.round)}</span>
      <span>${turnText}</span>
    </div>
    <button type="button" data-open-battle-scene="true">${actionLabel}</button>
  `;
}

function renderBattleSceneSummary() {
  const summary = document.getElementById("scene-match-summary");
  if (!summary || !state.battle) return;
  const modeName = state.battle.online ? "Online" : BATTLE_MODES[state.battle.mode]?.name || "Batalha";
  const player = battleSideStats("player");
  const cpu = battleSideStats("cpu");
  const playerKeeper = MONSTER_BY_ID[battleGoalkeeper("player")?.monsterId];
  const cpuKeeper = MONSTER_BY_ID[battleGoalkeeper("cpu")?.monsterId];
  summary.innerHTML = `
    <div class="scene-summary-grid">
      <div>
        <span>Modo</span>
        <strong>${modeName}</strong>
      </div>
      <div>
        <span>Rival</span>
        <strong>${state.battle.enemyName}</strong>
      </div>
      <div>
        <span>Vivos</span>
        <strong>${player.alive} x ${cpu.alive}</strong>
      </div>
      <div>
        <span>Dano</span>
        <strong>${state.battle.damageByPlayer} x ${state.battle.damageByCpu}</strong>
      </div>
      <div>
        <span>Goleiros</span>
        <strong>${playerKeeper?.name || "-"} x ${cpuKeeper?.name || "-"}</strong>
      </div>
    </div>
  `;
}

function clearBattleScene() {
  const ids = ["turn-order", "arena", "arena-status", "battle-score", "battle-result", "active-card", "tactical-panel", "battle-log", "scene-match-summary"];
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.innerHTML = "";
  });
  const matchLabel = document.getElementById("match-label");
  const roundLabel = document.getElementById("round-label");
  const activeLabel = document.getElementById("active-label");
  if (matchLabel) matchLabel.textContent = "0:00";
  if (roundLabel) roundLabel.textContent = "Rodada -";
  if (activeLabel) activeLabel.textContent = "Sem batalha";
  renderTimer();
  document.querySelectorAll("#action-grid button").forEach((button) => {
    button.disabled = true;
    button.classList.remove("is-active");
  });
}

function renderTeams() {
  const team = document.getElementById("player-team");
  const goalkeeper = MONSTER_BY_ID[state.save.goalkeeper];
  team.innerHTML = `
    ${state.save.team.map((id) => teamRow(MONSTER_BY_ID[id])).join("")}
    ${goalkeeper ? `<span class="team-subheading">Goleiro</span>${teamRow(goalkeeper)}` : ""}
  `;
  const cost = teamCost();
  const costText = cost <= 10 ? "Time valido para custo competitivo" : "Acima do custo competitivo 10";
  document.getElementById("team-cost").textContent = `Custo ${cost}/10. ${costText}.`;
  const newBattleButton = document.getElementById("new-battle-button");
  const locked = activeLockedBattle();
  newBattleButton.disabled = locked;
  newBattleButton.textContent = activeTournamentBattle() ? "Torneio ativo" : activeRankedBattle() ? "Ranqueada ativa" : "Nova batalha";
  newBattleButton.title = locked ? "Finalize a batalha competitiva antes de iniciar outra." : "Iniciar batalha com as opcoes selecionadas.";
}

function renderBattleSetup() {
  const menu = document.getElementById("battle-setup-menu");
  if (!menu) return;
  normalizeBattleSetup();
  const mode = state.battleSetup.mode;
  const opponent = selectedBattleOpponent();
  const modeData = BATTLE_MODES[mode];
  const lockedBattle = activeLockedBattle();
  const positions = selectedFormationPositions();
  const placement = setupPlacementStatus();
  const startDisabled = lockedBattle || !placement.valid ? "disabled" : "";
  const startLabel = activeTournamentBattle() ? "Torneio em andamento" : activeRankedBattle() ? "Ranqueada em andamento" : placement.valid ? "Iniciar batalha" : "Posicione 3 tazzos";
  const formationLabel = setupFormationLabel(positions);

  menu.innerHTML = `
    <div class="setup-tabs">
      ${["casual", "training", "friend"].map((modeId) => `
        <button type="button" data-setup-mode="${modeId}" class="${mode === modeId ? "is-active" : ""}">
          <strong>${BATTLE_MODES[modeId].name}</strong>
          <span>${BATTLE_MODES[modeId].meta}</span>
        </button>
      `).join("")}
    </div>
    <div class="setup-opponents">
      ${battleOpponentOptions(mode).map((option) => `
        <button type="button" data-setup-opponent="${option.id}" class="${state.battleSetup.opponent === option.id ? "is-active" : ""}">
          <strong>${option.name}</strong>
          <span>${option.meta}</span>
        </button>
      `).join("")}
    </div>
    <div class="setup-formations" aria-label="Formacao inicial">
      ${Object.entries(BATTLE_FORMATIONS).map(([id, formation]) => `
        <button type="button" data-setup-formation="${id}" class="${matchingSetupFormation(positions) === id ? "is-active" : ""}">
          <strong>${formation.name}</strong>
          <span>${formation.meta}</span>
        </button>
      `).join("")}
    </div>
    ${setupPlacementBoard(positions, placement, lockedBattle)}
    <div class="setup-preview">
      <span class="eyebrow">${modeData.name}</span>
      <strong>${opponent.name}</strong>
      <span>${opponent.meta} | ${formationLabel}</span>
      <div class="setup-team-preview">
        ${opponent.team ? opponent.team.map((id) => setupPreviewToken(MONSTER_BY_ID[id])).join("") : `<span class="setup-random">?</span><span class="setup-random">?</span><span class="setup-random">?</span>`}
        ${opponent.goalkeeper ? setupPreviewToken(MONSTER_BY_ID[opponent.goalkeeper], "Goleiro") : `<span class="setup-random">G</span>`}
      </div>
      ${lockedBattle ? `<p class="setup-warning">Finalize a batalha competitiva atual para trocar de combate.</p>` : ""}
    </div>
    <button class="setup-start" type="button" data-start-battle="true" ${startDisabled}>${startLabel}</button>
  `;
  decorateImageButtons(menu);
}

function setupPlacementBoard(positions, placement, lockedBattle) {
  const selected = setupSlotIndex();
  const cells = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      cells.push(setupPlacementCell(positions, selected, x, y, lockedBattle));
    }
  }

  return `
    <div class="setup-placement">
      <div class="setup-placement-head">
        <strong>Posicionamento inicial</strong>
        <span>${placement.text}</span>
      </div>
      <div class="setup-placement-roster">
        ${state.save.team.map((id, index) => {
          const monster = MONSTER_BY_ID[id];
          const pos = positions[index];
          return `
            <button type="button" data-setup-slot="${index}" class="${selected === index ? "is-active" : ""}">
              <img src="${monster.image}" alt="${monster.name}">
              <span>
                <strong>${monster.name}</strong>
                <small>Casa ${pos.x + 1}, ${pos.y + 1}</small>
              </span>
            </button>
          `;
        }).join("")}
      </div>
      <div class="setup-board" role="grid" aria-label="Posicionamento inicial">
        ${cells.join("")}
      </div>
    </div>
  `;
}

function setupPlacementCell(positions, selected, x, y, lockedBattle) {
  const slot = setupCellOccupantSlot(positions, x, y);
  const monster = slot >= 0 ? MONSTER_BY_ID[state.save.team[slot]] : null;
  const isPlayerZone = x <= 1;
  const isEnemyZone = x >= 5;
  const classes = ["setup-cell"];
  if (isPlayerZone) classes.push("is-player-zone");
  if (isEnemyZone) classes.push("is-enemy-zone");
  if (!isPlayerZone && !isEnemyZone) classes.push("is-mid-zone");
  if (slot >= 0) classes.push("has-token");
  if (slot === selected) classes.push("is-selected-token");
  const disabled = lockedBattle || !isPlayerZone ? "disabled" : "";
  const label = monster ? `Casa ${x + 1}, ${y + 1}: ${monster.name}` : isPlayerZone ? `Casa ${x + 1}, ${y + 1}: zona inicial` : `Casa ${x + 1}, ${y + 1}`;

  return `
    <button type="button" class="${classes.join(" ")}" data-setup-cell="true" data-x="${x}" data-y="${y}" aria-label="${label}" ${disabled}>
      ${monster ? `<img src="${monster.image}" alt="${monster.name}"><span>${slot + 1}</span>` : isEnemyZone ? `<span>?</span>` : ""}
    </button>
  `;
}

function setupPreviewToken(monster, label = "") {
  if (!monster) return `<span class="setup-random">?</span>`;
  return `
    <button class="setup-token" type="button" title="${label ? `${label}: ` : ""}${monster.name}" data-monster-view="${monster.id}">
      <img src="${monster.image}" alt="${monster.name}">
    </button>
  `;
}

function teamRow(monster) {
  const meta = isGoalkeeper(monster)
    ? keeperAbilityText(monster).replace("Habilidade: ", "")
    : `${monster.types.join("/")} - ${monster.rarity}`;
  return `
    <button class="team-item" type="button" data-monster-view="${monster.id}">
      <img src="${monster.image}" alt="${monster.name}">
      <div>
        <strong>${monster.name}</strong>
        <span>${meta}</span>
      </div>
      <span class="chip">${monster.cost}</span>
    </button>
  `;
}

function renderTurnOrder() {
  const alive = alivePieces().sort(turnSort);
  document.getElementById("turn-order").innerHTML = alive.map((piece) => {
    const monster = monsterOf(piece);
    const current = piece.id === state.battle.activeId ? " is-current" : "";
    const viewerAttr = canOpenTazzoViewer() ? ` data-monster-view="${monster.id}"` : "";
    return `
      <button class="turn-item${current}" type="button"${viewerAttr}>
        <img src="${monster.image}" alt="${monster.name}">
        <div>
          <strong>${monster.name}</strong>
          <span>${piece.side === "player" ? "Voce" : state.battle.enemyName} - Vel ${piece.speed}</span>
        </div>
        <span class="chip">${piece.hp}</span>
      </button>
    `;
  }).join("");
}

function renderArena() {
  const arena = document.getElementById("arena");
  arena.innerHTML = "";
  const active = activePiece();
  const animation = state.battle.animation;
  const keeperCell = keeperAbilityCell(animation);

  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.tabIndex = 0;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Casa ${x + 1}, ${y + 1}`);
      if (x <= 1) cell.classList.add("player-zone");
      if (x >= 5) cell.classList.add("cpu-zone");

      const piece = pieceAt(x, y);
      const target = state.battle.validTargets.find((item) => item.x === x && item.y === y);
      if (target) {
        const summary = targetTitle(active, target);
        cell.classList.add(`is-${target.action}`, "is-targeting", "can-click");
        cell.title = summary;
        cell.setAttribute("aria-label", `Casa ${x + 1}, ${y + 1}: ${summary}`);
      }
      if (active && active.x === x && active.y === y) {
        cell.classList.add("is-active", `is-active-${active.side}`);
      }
      if (animation) {
        if (animation.from?.x === x && animation.from?.y === y) cell.classList.add("is-ai-from");
        if (animation.to?.x === x && animation.to?.y === y) cell.classList.add("is-ai-to", `is-ai-${animation.action}`);
      }

      if (piece) {
        cell.append(renderPieceToken(piece));
      }
      if (keeperCell && keeperCell.x === x && keeperCell.y === y) {
        cell.append(renderKeeperAbilityToken(animation));
      }
      if (target) {
        const hint = targetHint(active, target);
        if (hint) {
          const hintNode = document.createElement("span");
          hintNode.className = "target-hint";
          hintNode.textContent = hint;
          cell.append(hintNode);
        }
      }

      cell.addEventListener("click", (event) => {
        if (canOpenTazzoViewer() && event.target.closest("[data-monster-view]")) return;
        handleArenaClick(x, y);
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        handleArenaClick(x, y);
      });
      arena.append(cell);
    }
  }
  if (animation?.text) {
    const banner = document.createElement("div");
    banner.className = `battle-action-banner is-${animation.stage || "windup"}`;
    banner.textContent = animation.text;
    arena.append(banner);
  }

  const status = document.getElementById("arena-status");
  status.textContent = state.battle.over ? state.battle.status : actionStatusText();
  document.getElementById("round-label").textContent = `Rodada ${Math.max(1, state.battle.round)}`;
  document.getElementById("match-label").textContent = formatTime(state.battle.matchTime || 0);
  document.getElementById("active-label").textContent = active ? `${monsterOf(active).name} (${active.side === "player" ? "voce" : state.battle.enemyName})` : state.battle.status;
}

function keeperAbilityCell(animation) {
  if (!animation || animation.action !== "keeper" || !animation.keeperMonsterId) return null;
  const side = animation.side === "cpu" ? "cpu" : "player";
  const x = side === "cpu" ? 6 : 0;
  const rawY = Number(animation.to?.y ?? animation.from?.y ?? 2);
  const baseY = Math.max(0, Math.min(4, Number.isFinite(rawY) ? rawY : 2));
  const candidates = [baseY, 2, 1, 3, 0, 4].filter((value, index, list) => list.indexOf(value) === index);
  const emptyY = candidates.find((y) => !pieceAt(x, y));
  return { x, y: Number.isFinite(emptyY) ? emptyY : baseY };
}

function renderKeeperAbilityToken(animation) {
  const monster = MONSTER_BY_ID[animation.keeperMonsterId];
  const token = document.createElement("div");
  token.className = `keeper-ability-token ${animation.side === "cpu" ? "cpu" : "player"} is-${animation.stage || "windup"}`;
  token.setAttribute("aria-label", monster ? `${monster.name} ativou a habilidade de goleiro` : "Habilidade de goleiro ativada");
  token.innerHTML = `
    ${monster ? `<img src="${monster.image}" alt="${monster.name}">` : ""}
    <span>Goleiro</span>
  `;
  return token;
}

function renderBattleScore() {
  const score = document.getElementById("battle-score");
  if (!score || !state.battle) return;
  const player = battleSideStats("player");
  const cpu = battleSideStats("cpu");
  score.innerHTML = `
    <div class="score-row">
      <strong>Voce</strong>
      <span>${player.alive} vivos</span>
      <span>${player.hp} vital</span>
      <span>${state.battle.damageByPlayer} dano</span>
    </div>
    <div class="score-row">
      <strong>${state.battle.enemyName}</strong>
      <span>${cpu.alive} vivos</span>
      <span>${cpu.hp} vital</span>
      <span>${state.battle.damageByCpu} dano</span>
    </div>
  `;
}

function renderBattleResult() {
  const panel = document.getElementById("battle-result");
  if (!panel || !state.battle) return;
  if (!state.battle.over || !state.battle.result) {
    panel.innerHTML = "";
    return;
  }

  const result = state.battle.result;
  const player = battleSideStats("player");
  const cpu = battleSideStats("cpu");
  const playerKOs = state.battle.pieces.filter((piece) => piece.side === "cpu" && piece.hp <= 0).length;
  const cpuKOs = state.battle.pieces.filter((piece) => piece.side === "player" && piece.hp <= 0).length;
  const elapsed = Math.max(0, (state.battle.matchDuration || 0) - (state.battle.matchTime || 0));
  const winnerName = result.winner === "player" ? "Voce" : result.winner === "draw" ? "Empate" : state.battle.enemyName;
  const rewardLine = result.rewards.length ? result.rewards.join(" | ") : "Sem recompensa extra.";
  const onlineRematch = result.online && typeof currentOnlineRematchStatus === "function" ? currentOnlineRematchStatus() : null;
  const onlineRematchText = onlineRematch?.requestedCount
    ? onlineRematch.requestedByYou
      ? `Revanche pedida (${onlineRematch.requestedCount}/${onlineRematch.requiredCount}). Aguardando ${onlineRematch.waitingFor.join(", ") || "rival"}.`
      : `O rival pediu revanche (${onlineRematch.requestedCount}/${onlineRematch.requiredCount}).`
    : "";
  const packAction = result.packReward ? `<button type="button" data-result-action="packs">Abrir premio</button>` : "";
  const leagueAction = result.online ? "" : result.tournamentId ? `<button type="button" data-result-action="tournaments">Ver torneios</button>` : result.ranked ? `<button type="button" data-result-action="tournaments">Ver liga</button>` : "";
  const rematchAction = result.online
    ? `<button type="button" data-result-action="online-rematch" ${onlineRematch?.requestedByYou ? "disabled" : ""}>${onlineRematch?.requestedByYou ? "Revanche pedida" : "Revanche"}</button>`
    : `<button type="button" data-result-action="rematch">Revanche</button>`;
  const resultActions = result.online
    ? `
        <button type="button" data-result-action="online">Voltar para sala</button>
        ${rematchAction}
        <button type="button" data-result-action="online-leave">Sair da sala</button>
      `
    : `
        <button type="button" data-result-action="battle-menu">Menu de batalha</button>
        ${rematchAction}
        ${leagueAction}
        ${packAction}
        <button type="button" data-result-action="collection">Trocar time</button>
      `;
  panel.innerHTML = `
    <section class="result-card ${result.winner === "player" ? "is-win" : result.winner === "draw" ? "is-draw" : "is-loss"}">
      <div class="result-hero">
        <div>
          <span class="eyebrow">Resultado</span>
          <h2>${result.title}</h2>
          <p>${result.reason}</p>
        </div>
        <div class="result-badge">
          <span>${result.winner === "draw" ? "Placar" : "Vencedor"}</span>
          <strong>${winnerName}</strong>
        </div>
      </div>
      <div class="result-metrics">
        ${smallResultMetric("Tempo usado", formatTime(elapsed))}
        ${smallResultMetric("Rodadas", Math.max(1, state.battle.round))}
        ${smallResultMetric("Dano total", `${state.battle.damageByPlayer} x ${state.battle.damageByCpu}`)}
        ${smallResultMetric("Tazzos derrubados", `${playerKOs} x ${cpuKOs}`)}
      </div>
      <div class="result-team-grid">
        ${resultTeamPanel("Voce", player, state.battle.damageByPlayer, playerKOs, result.winner === "player")}
        ${resultTeamPanel(state.battle.enemyName, cpu, state.battle.damageByCpu, cpuKOs, result.winner === "cpu")}
      </div>
      <div class="result-rewards">
        <strong>Recompensas</strong>
        <span>${rewardLine}</span>
      </div>
      ${onlineRematchText ? `<div class="result-rematch-status">${onlineRematchText}</div>` : ""}
      <div class="result-actions">
        ${resultActions}
      </div>
    </section>
  `;
}

function resultTeamPanel(name, stats, damage, knockouts, winner) {
  return `
    <div class="result-team ${winner ? "is-winner" : ""}">
      <div>
        <span>${winner ? "Vencedor" : "Equipe"}</span>
        <strong>${name}</strong>
      </div>
      <dl>
        <div>
          <dt>Em pe</dt>
          <dd>${stats.alive}/3</dd>
        </div>
        <div>
          <dt>Vital</dt>
          <dd>${stats.hp}</dd>
        </div>
        <div>
          <dt>Dano</dt>
          <dd>${damage}</dd>
        </div>
        <div>
          <dt>Derrubou</dt>
          <dd>${knockouts}</dd>
        </div>
      </dl>
    </div>
  `;
}

function smallResultMetric(label, value) {
  return `
    <div>
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `;
}

function renderPieceToken(piece) {
  const monster = monsterOf(piece);
  const cosmetics = typeof fieldCosmeticsForPiece === "function" ? fieldCosmeticsForPiece(piece) : {};
  const cosmeticClasses = typeof fieldCosmeticClasses === "function" ? fieldCosmeticClasses(cosmetics) : "";
  const token = document.createElement("button");
  token.type = "button";
  token.className = `tazzo-token ${piece.side}${cosmeticClasses ? ` ${cosmeticClasses}` : ""}`;
  if (state.battle.activeId === piece.id) token.classList.add("is-acting");
  if (state.battle.animation?.actorId === piece.id) token.classList.add("is-ai-actor", `is-ai-${state.battle.animation.stage || "windup"}`);
  if (state.battle.animation?.targetId === piece.id) token.classList.add("is-ai-target");
  if (canOpenTazzoViewer()) {
    token.dataset.monsterView = piece.monsterId;
    token.title = `Ver ${monster.name}`;
  } else {
    token.title = `${monster.name}`;
  }
  token.addEventListener("click", (event) => {
    if (!canOpenTazzoViewer()) return;
    event.stopPropagation();
    openTazzoViewer(piece.monsterId);
  });
  if (piece.hp <= 0) token.classList.add("ko");
  token.innerHTML = `
    <span class="field-cosmetic-layer field-cosmetic-base" aria-hidden="true"></span>
    <span class="field-cosmetic-layer field-cosmetic-ring" aria-hidden="true"></span>
    <img src="${monster.image}" alt="${monster.name}">
    <span class="field-cosmetic-layer field-cosmetic-slash" aria-hidden="true"></span>
    <span class="field-cosmetic-layer field-cosmetic-badge" aria-hidden="true"></span>
    <div class="hpbar"><span style="width:${Math.max(0, Math.round((piece.hp / piece.maxHp) * 100))}%"></span></div>
  `;
  return token;
}

function renderCommands() {
  const active = activePiece();
  const isPlayerTurn = active && active.side === "player" && !state.battle.over;
  const card = document.getElementById("active-card");
  renderTimer();

  if (!active) {
    card.innerHTML = "<div><strong>Batalha encerrada</strong></div>";
  } else {
    const monster = monsterOf(active);
    const viewerAttr = canOpenTazzoViewer() ? ` data-monster-view="${monster.id}"` : "";
    const keeper = battleGoalkeeper("player");
    const keeperMonster = MONSTER_BY_ID[keeper?.monsterId];
    const extraTurnReady = state.battle.effects[active.side]?.extraTurnId === active.id;
    const fullShotReady = fullShotCharges(active.side);
    const substitutionReady = state.battle.effects[active.side]?.substitution;
    card.innerHTML = `
      <img src="${monster.image}" alt="${monster.name}"${viewerAttr}>
      <div>
        <h3>${monster.name}</h3>
        <div class="stat-line">
          ${typeChips(monster)}
          <span class="rarity-chip">${monster.rarity}</span>
          ${keeperMonster && active.side === "player" && !keeper.used ? `<span class="rarity-chip">Goleiro pronto</span>` : ""}
          ${extraTurnReady ? `<span class="rarity-chip">Turno extra</span>` : ""}
          ${fullShotReady ? `<span class="rarity-chip">Chute cheio x${fullShotReady}</span>` : ""}
          ${substitutionReady ? `<span class="rarity-chip">Substituicao livre</span>` : ""}
        </div>
        <div class="stat-line">
          <span>Vital ${active.hp}/${active.maxHp}</span>
          <span>Chute ${active.shot}</span>
          <span>Drible ${active.dribble}</span>
          <span>Vel ${active.speed}</span>
        </div>
      </div>
    `;
  }

  renderTacticalPanel(active, isPlayerTurn);

  const tutorialAction = currentTutorialAllowedAction();
  document.querySelectorAll("#action-grid button").forEach((button) => {
    const action = button.dataset.action;
    const lockedByTutorial = Boolean(tutorialAction && action !== tutorialAction);
    const online = state.battle.online;
    const onlineAllowed = ONLINE_INSTANT_ACTIONS.includes(action) || isOnlineTargetAction(action);
    const onlineActionReady = Boolean(online && onlineAllowed && online.isYourTurn && isPlayerTurn && !online.pendingAction && (action !== "keeper" || canUseKeeperAbility("player")));
    button.disabled = online
      ? !onlineActionReady
      : !isPlayerTurn || lockedByTutorial || (action === "keeper" && !canUseKeeperAbility("player"));
    button.classList.toggle("is-active", state.battle.pendingAction === action);
    button.classList.toggle("is-tutorial-locked", lockedByTutorial);
    button.title = online
      ? action === "pass"
        ? online.pendingAction ? "Enviando jogada online." : online.isYourTurn ? "Passar o turno online." : "Aguardando o turno online chegar."
        : action === "keeper"
        ? online.pendingAction ? "Enviando goleiro online." : canUseKeeperAbility("player") ? "Usar a habilidade do goleiro online." : "Goleiro indisponivel agora."
        : onlineAllowed ? "Escolha a acao e depois clique em um alvo no campo." : "Esta acao online entra no proximo passo."
      : lockedByTutorial ? `Tutorial: selecione ${actionName(tutorialAction)} agora.` : "";
  });
}

function renderTacticalPanel(active, isPlayerActive) {
  const panel = document.getElementById("tactical-panel");
  if (!panel) return;

  if (!active) {
    panel.innerHTML = `
      <div class="tactical-empty">
        <strong>Fim da batalha</strong>
        <span>${state.battle.status}</span>
      </div>
    `;
    return;
  }

  if (!isPlayerActive) {
    const animationText = state.battle.animation?.text;
    panel.innerHTML = `
      <div class="tactical-empty">
        <strong>${state.battle.online ? "Turno online" : "Turno adversario"}</strong>
        <span>${animationText || (state.battle.online ? state.battle.online.message || "Aguardando a jogada sincronizada do rival." : `${state.battle.enemyName} esta calculando a jogada.`)}</span>
      </div>
    `;
    return;
  }

  if (state.battle.online) {
    panel.innerHTML = `
      <div class="tactical-empty">
        <strong>Arena online</strong>
        <span>${state.battle.online.pendingAction ? "Enviando jogada para o servidor." : state.battle.online.message || "Seu turno sincronizado: escolha uma acao e clique no alvo."}</span>
      </div>
    `;
    return;
  }

  if (!state.battle.pendingAction) {
    if (state.battle.tutorial?.allowedAction) {
      panel.innerHTML = `
        <div class="tactical-empty">
          <strong>${state.battle.tutorial.title || "Treino do tutorial"}</strong>
          <span>Selecione ${actionName(state.battle.tutorial.allowedAction)}; as outras funcoes ficam bloqueadas nesta etapa.</span>
        </div>
      `;
      return;
    }

    const adjacentCount = adjacentEnemies(active).length;
    const danger = isSurrounded(active)
      ? "Cercado: dano recebido +25%. Use Recuar para sair da marcacao."
      : adjacentCount
        ? `Marcado por ${adjacentCount} inimigo(s): Mover mantem contato; Recuar escapa.`
        : "Sem contato direto.";
    panel.innerHTML = `
      <div class="tactical-empty">
        <strong>Leitura do turno</strong>
        <span>${danger}</span>
      </div>
    `;
    return;
  }

  const previews = state.battle.validTargets.map((target) => targetPreview(active, target));
  const visible = previews.slice(0, 6);
  const extra = previews.length - visible.length;
  panel.innerHTML = `
    <div class="tactical-heading">
      <strong>${actionName(state.battle.pendingAction)}</strong>
      <span>${previews.length} opcao(s)</span>
    </div>
    <div class="preview-list">
      ${visible.map((preview) => `
        <div class="preview-row ${preview.tone}">
          <span class="preview-tag">${preview.tag}</span>
          <div>
            <strong>${preview.title}</strong>
            <span>${preview.meta}</span>
          </div>
        </div>
      `).join("")}
      ${extra > 0 ? `<div class="preview-more">+${extra} outra(s) casa(s)</div>` : ""}
    </div>
  `;
}

function targetTitle(piece, target) {
  return targetPreview(piece, target).plain;
}

function targetHint(piece, target) {
  return targetPreview(piece, target).hint;
}

function targetPreview(piece, target) {
  if (!piece) {
    return { title: "Casa", meta: "", tag: "", hint: "", tone: "", plain: "Casa" };
  }

  if (target.action === "dribble" || target.action === "shot") {
    return previewDamageAction(piece, target, target.action === "shot");
  }

  if (target.action === "pressure") {
    return previewPressureAction(piece, target);
  }

  if (target.action === "move" || target.action === "retreat") {
    return previewMoveAction(piece, target);
  }

  if (target.action === "swap") {
    const ally = pieceAt(target.x, target.y);
    const name = ally ? monsterOf(ally).name : "aliado";
    return {
      title: `Trocar com ${name}`,
      meta: `Casa ${target.x + 1}, ${target.y + 1}`,
      tag: "Posicao",
      hint: "troca",
      tone: "is-neutral",
      plain: `Trocar posicao com ${name}`
    };
  }

  return {
    title: actionName(target.action),
    meta: `Casa ${target.x + 1}, ${target.y + 1}`,
    tag: "Acao",
    hint: "",
    tone: "is-neutral",
    plain: actionName(target.action)
  };
}

function previewDamageAction(attacker, target, isDash) {
  const defender = pieceAt(target.x, target.y);
  if (!defender) {
    return {
      title: actionName(target.action),
      meta: `Casa ${target.x + 1}, ${target.y + 1}`,
      tag: "Alvo",
      hint: "",
      tone: "is-neutral",
      plain: "Alvo vazio"
    };
  }

  const damage = calculateDamage(attacker, defender, isDash);
  const ko = damage >= defender.hp;
  const origin = isDash ? dashImpactOrigin(attacker, defender) : attacker;
  const force = isDash ? attacker.shot : attacker.dribble;
  const steps = ko ? 0 : isDash ? (force > defender.speed ? 2 : 1) : (force > defender.speed ? 1 : 0);
  const push = steps > 0 ? previewPush(defender, origin, steps, force) : null;
  const fullShot = isDash && fullShotCharges(attacker.side) > 0;
  const matchup = typeMultiplier(monsterOf(attacker).types, monsterOf(defender).types);
  const positionalAttack = positionalAttackMultiplier(attacker);
  const positionalDefense = positionalDefenseMultiplier(defender);
  const tone = ko ? "is-good" : "is-neutral";
  const notes = [`${damage} dano`];
  if (isDash) notes.push(fullShot ? "chute cheio" : "50% do chute");
  if (matchup > 1) notes.push("vantagem +25%");
  if (positionalAttack > 1) notes.push("zona +10% ataque");
  if (positionalDefense < 1) notes.push("zona -10% dano");
  if (isSurrounded(defender)) notes.push("alvo cercado");
  if (ko) notes.push("derruba");
  if (push) notes.push(push.text);
  const defenderName = monsterOf(defender).name;

  return {
    title: `${actionName(target.action)} ${defenderName}`,
    meta: notes.join(" | "),
    tag: ko ? "KO" : isDash ? "Chute" : "Drible",
    hint: `-${damage}`,
    tone,
    plain: `${damage} dano em ${defenderName}; ${notes.slice(1).join("; ")}`
  };
}

function previewPressureAction(attacker, target) {
  const defender = pieceAt(target.x, target.y);
  if (!defender) {
    return {
      title: "Pressionar",
      meta: `Casa ${target.x + 1}, ${target.y + 1}`,
      tag: "Alvo",
      hint: "",
      tone: "is-neutral",
      plain: "Alvo vazio"
    };
  }

  const push = previewPush(defender, attacker, 1, attacker.dribble);
  const defenderName = monsterOf(defender).name;
  return {
    title: `Pressionar ${defenderName}`,
    meta: push ? push.text : "Empurrao sem deslocamento",
    tag: push && push.risk ? "Risco" : "Empurra",
    hint: "push",
    tone: push && push.risk ? "is-good" : "is-neutral",
    plain: `Empurra ${defenderName}. ${push ? push.text : ""}`
  };
}

function previewMoveAction(piece, target) {
  const adjacentCount = projectedAdjacentEnemies(piece, target.x, target.y);
  const title = target.action === "retreat" ? "Recuar" : "Mover";
  const marked = adjacentEnemies(piece).length > 0;
  const contact = adjacentCount >= 2
    ? "fica cercado"
    : adjacentCount === 1
      ? target.action === "move" && marked ? "reposiciona marcado" : "adjacente a inimigo"
      : target.action === "retreat" && marked ? "escapa da marcacao" : "fora de contato";
  const tone = adjacentCount >= 2 ? "is-warning" : adjacentCount === 1 ? "is-neutral" : "is-good";

  return {
    title: `${title} para casa ${target.x + 1}, ${target.y + 1}`,
    meta: contact,
    tag: adjacentCount >= 2 ? "Cuidado" : "Espaco",
    hint: target.action === "retreat" ? "recuo" : "mover",
    tone,
    plain: `${title} para casa ${target.x + 1}, ${target.y + 1}; ${contact}`
  };
}

function dashImpactOrigin(attacker, defender) {
  const dx = Math.sign(defender.x - attacker.x);
  const dy = Math.sign(defender.y - attacker.y);
  const beforeTarget = { x: defender.x - dx, y: defender.y - dy };
  if (insideArena(beforeTarget.x, beforeTarget.y) && !pieceAt(beforeTarget.x, beforeTarget.y)) {
    return beforeTarget;
  }
  return attacker;
}

function previewPush(target, origin, steps, force) {
  const dx = Math.sign(target.x - origin.x);
  const dy = Math.sign(target.y - origin.y);
  if (dx === 0 && dy === 0) return null;

  let x = target.x;
  let y = target.y;
  for (let index = 0; index < steps; index += 1) {
    const next = { x: x + dx, y: y + dy };
    if (!insideArena(next.x, next.y)) {
      return {
        text: `borda +${incomingDamageAfterPosition(target, Math.round(force * 0.5))} dano`,
        risk: "edge"
      };
    }

    const blocker = pieceAt(next.x, next.y);
    if (blocker && blocker.id !== target.id) {
      const targetDamage = incomingDamageAfterPosition(target, Math.round(force * 0.25));
      const blockerDamage = incomingDamageAfterPosition(blocker, Math.round(force * 0.25));
      return {
        text: `colisao com ${monsterOf(blocker).name} +${targetDamage}/${blockerDamage} dano`,
        risk: "collision"
      };
    }

    x = next.x;
    y = next.y;
  }

  return {
    text: `empurra ${steps} ${steps === 1 ? "casa" : "casas"} para ${pushDirectionName(dx, dy)}`,
    risk: ""
  };
}

function pushDirectionName(dx, dy) {
  if (dx > 0 && dy > 0) return "baixo/direita";
  if (dx > 0 && dy < 0) return "cima/direita";
  if (dx < 0 && dy > 0) return "baixo/esquerda";
  if (dx < 0 && dy < 0) return "cima/esquerda";
  if (dx > 0) return "direita";
  if (dx < 0) return "esquerda";
  if (dy > 0) return "baixo";
  if (dy < 0) return "cima";
  return "mesma casa";
}

function projectedAdjacentEnemies(piece, x, y) {
  return alivePieces().filter((other) => {
    if (other.side === piece.side) return false;
    return Math.max(Math.abs(x - other.x), Math.abs(y - other.y)) === 1;
  }).length;
}

function actionName(action) {
  const names = {
    move: "Mover",
    dribble: "Driblar",
    shot: "Chutar",
    keeper: "Goleiro",
    pressure: "Pressionar",
    retreat: "Recuar",
    swap: "Trocar",
    pass: "Passar"
  };
  return names[action] || "Acao";
}

function renderTimer() {
  const timer = document.getElementById("timer-chip");
  if (!timer) return;
  const value = state.battle && state.battle.turnTime > 0 ? `${state.battle.turnTime}s` : "--";
  timer.textContent = value;
}

function renderMatchTimer() {
  const label = document.getElementById("match-label");
  if (!label || !state.battle) return;
  label.textContent = formatTime(state.battle.matchTime || 0);
  label.classList.toggle("is-low-time", (state.battle.matchTime || 0) <= 30 && !state.battle.over);
}

function renderBattleLog() {
  document.getElementById("battle-log").innerHTML = state.battle.log.slice(-16).map((line) => `<p>${line}</p>`).join("");
}
