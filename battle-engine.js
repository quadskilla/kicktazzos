// Battle rules, turn flow, targeting, timers, and AI.

function newBattle(config = null, legacyEnemyName = "IA") {
  const options = normalizeBattleConfig(config, legacyEnemyName);
  clearTurnTimer();
  clearMatchTimer();
  const playerPositions = options.playerPositions || BATTLE_FORMATIONS.center.positions;
  const tutorial = options.tutorial || null;
  const playerTeam = normalizeBattleFieldTeam(options.playerTeam || state.save.team, ["andreas-pereira-tazzo", "alex-sandro-tazzo", "wendell-tazzo"]);
  const playerGoalkeeper = normalizeGoalkeeper(options.playerGoalkeeper || state.save.goalkeeper);
  if (!tutorial && !options.preservePlayerLoadout) {
    state.save.team = playerTeam;
    state.save.goalkeeper = playerGoalkeeper;
  }
  const playerPieces = playerTeam.map((id, index) => createPiece(id, "player", playerPositions[index] || BATTLE_FORMATIONS.center.positions[index]));

  const fallbackEnemyTeam = chooseEnemyTeam();
  const enemyTeam = normalizeBattleFieldTeam(options.enemyTeam || fallbackEnemyTeam, fallbackEnemyTeam);
  const enemyPositions = options.enemyPositions || defaultEnemyPositions(options.mode);
  const cpuPieces = enemyTeam.map((id, index) => createPiece(id, "cpu", enemyPositions[index] || mirrorFormationPositions(BATTLE_FORMATIONS.center.positions)[index]));

  state.battle = {
    round: 0,
    pieces: [...playerPieces, ...cpuPieces],
    activeId: null,
    turnQueue: [],
    pendingAction: null,
    validTargets: [],
    animation: null,
    log: ["A batalha comecou."],
    status: "Em combate",
    over: false,
    damageByPlayer: 0,
    damageByCpu: 0,
    turnTime: 0,
    matchTime: options.matchTime,
    matchDuration: options.matchTime,
    actionTime: options.actionTime,
    mode: options.mode,
    tournamentId: options.tournamentId,
    competitiveMatchId: options.competitiveMatchId || null,
    trainingAi: options.trainingAi || null,
    ranked: options.ranked,
    online: options.online || null,
    effects: {
      player: { fullShot: 0, freeSwap: false, substitution: false, extraTurnId: null, attackerFieldBonus: false },
      cpu: { fullShot: 0, freeSwap: false, substitution: false, extraTurnId: null, attackerFieldBonus: false }
    },
    goalkeepers: {
      player: createGoalkeeperState(playerGoalkeeper, "player"),
      cpu: createGoalkeeperState(options.enemyGoalkeeper || chooseEnemyGoalkeeper(), "cpu")
    },
    enemyName: options.enemyName,
    result: null,
    tutorial,
    tutorialCompetitiveStep: options.tutorialCompetitiveStep || null
  };

  if (options.tournamentId) {
    state.pendingTournament = { id: options.tournamentId };
  }
  if (options.ranked) {
    state.pendingRanked = options.ranked;
  }

  if (options.logIntro) {
    state.battle.log = [options.logIntro];
  }

  state.battleSceneOpen = true;
  if (typeof trackTelemetry === "function") {
    trackTelemetry("battle:start", {
      mode: state.battle.mode,
      ranked: Boolean(state.battle.ranked),
      tournamentId: state.battle.tournamentId || "",
      online: Boolean(state.battle.online),
      tutorial: tutorial?.stepId || ""
    }, { dedupeKey: `battle:start:${Date.now()}`, cooldown: 0 });
  }
  playSfx("battle-start", { cooldown: 500 });
  advanceTurn();
  startMatchTimer();
  renderAll();
}

function normalizeBattleConfig(config, legacyEnemyName) {
  if (Array.isArray(config)) {
    const goalkeeper = config.find((id) => isGoalkeeper(id));
    return {
      enemyTeam: config.filter((id) => !isGoalkeeper(id)),
      enemyGoalkeeper: goalkeeper || null,
      enemyName: legacyEnemyName,
      mode: "friend",
      matchTime: BATTLE_MODES.friend.matchTime,
      actionTime: BATTLE_MODES.friend.actionTime,
      playerPositions: selectedFormationPositions(),
      enemyPositions: null,
      tournamentId: null,
      logIntro: `Desafio contra ${legacyEnemyName} comecou.`,
      tutorial: null
    };
  }

  const mode = config?.mode || "casual";
  const modeData = BATTLE_MODES[mode] || BATTLE_MODES.casual;
  return {
    enemyTeam: config?.enemyTeam || null,
    enemyGoalkeeper: config?.enemyGoalkeeper || null,
    playerGoalkeeper: config?.playerGoalkeeper || null,
    playerTeam: config?.playerTeam || null,
    enemyName: config?.enemyName || "IA",
    mode,
    matchTime: config?.matchTime || modeData.matchTime,
    actionTime: config?.actionTime || modeData.actionTime,
    playerPositions: config?.playerPositions || null,
    enemyPositions: config?.enemyPositions || null,
    tournamentId: config?.tournamentId || null,
    competitiveMatchId: config?.competitiveMatchId || null,
    trainingAi: config?.trainingAi || null,
    ranked: config?.ranked || null,
    online: config?.online || null,
    preservePlayerLoadout: Boolean(config?.preservePlayerLoadout),
    logIntro: config?.logIntro || null,
    tutorial: config?.tutorial || null
  };
}

function defaultEnemyPositions(mode) {
  const competitive = mode === "ranked" || mode === "tournament";
  if (competitive) return randomMirroredFormationPositions();
  return mirrorFormationPositions(BATTLE_FORMATIONS.center.positions);
}

function randomMirroredFormationPositions() {
  const formations = Object.values(BATTLE_FORMATIONS);
  const formation = formations[Math.floor(Math.random() * formations.length)] || BATTLE_FORMATIONS.center;
  return mirrorFormationPositions(formation.positions);
}

function mirrorFormationPositions(positions) {
  return positions.map((pos) => ({ x: 6 - pos.x, y: pos.y }));
}

function createPiece(monsterId, side, pos) {
  const monster = MONSTER_BY_ID[monsterId];
  const stats = monsterStats(monster, side);
  return {
    id: `${side}-${monsterId}-${Math.random().toString(16).slice(2)}`,
    monsterId,
    side,
    x: pos.x,
    y: pos.y,
    startingX: pos.x,
    startingY: pos.y,
    hp: stats.vitality,
    maxHp: stats.vitality,
    shot: stats.shot,
    dribble: stats.dribble,
    speed: stats.speed,
    acted: false
  };
}

function createGoalkeeperState(monsterId, side) {
  const id = monsterId && MONSTER_BY_ID[monsterId] && isGoalkeeper(monsterId)
    ? monsterId
    : side === "player"
      ? normalizeGoalkeeper(monsterId)
      : chooseEnemyGoalkeeper();
  return id ? { monsterId: id, side, used: false } : null;
}

function normalizeBattleFieldTeam(team, fallback = []) {
  const ids = Array.isArray(team) ? team : [];
  return [...ids, ...fallback]
    .filter((id) => MONSTER_BY_ID[id] && !isGoalkeeper(id))
    .filter(unique)
    .slice(0, 3);
}

function chooseEnemyTeam() {
  const byRole = [
    ["richarlison-tazzo", "joao-gomes-tazzo", "danilo-tazzo"],
    ["rodrygo-tazzo", "casemiro-tazzo", "bremer-tazzo"],
    ["vinicius-jr-tazzo", "raphinha-tazzo", "gabriel-magalhaes-tazzo"],
    ["julian-alvarez-tazzo", "enzo-fernandez-tazzo", "cristian-romero-tazzo"],
    ["lautaro-martinez-tazzo", "alexis-mac-allister-tazzo", "lisandro-martinez-tazzo"],
    ["artilheiro-brasil", "lucas-paqueta-tazzo", "marquinhos-tazzo"],
    ["angel-di-maria-tazzo", "rodrigo-de-paul-tazzo", "nahuel-molina-tazzo"]
  ];
  return byRole[Math.floor(Math.random() * byRole.length)];
}

function chooseEnemyGoalkeeper() {
  const options = goalkeeperMonsters();
  return options[Math.floor(Math.random() * options.length)]?.id || "";
}

function clearTurnTimer() {
  if (state.timerInterval) {
    window.clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function clearMatchTimer() {
  if (state.matchTimerInterval) {
    window.clearInterval(state.matchTimerInterval);
    state.matchTimerInterval = null;
  }
}

function startTurnTimer(seconds) {
  clearTurnTimer();
  if (!state.battle) return;
  state.battle.turnTime = seconds;
  renderTimer();

  if (seconds <= 0) return;
  const activeId = state.battle.activeId;
  state.timerInterval = window.setInterval(() => {
    if (!state.battle || state.battle.over || state.battle.activeId !== activeId) {
      clearTurnTimer();
      return;
    }

    state.battle.turnTime -= 1;
    renderTimer();
    if (state.battle.turnTime > 0 && state.battle.turnTime <= 5 && isPlayerTurn()) {
      playSfx("timer-warning");
    }

    if (state.battle.turnTime <= 0) {
      clearTurnTimer();
      if (isPlayerTurn()) {
        const active = activePiece();
        if (state.battle.online && state.battle.online.isYourTurn && !state.battle.online.pendingAction) {
          state.battle.status = `${monsterOf(active).name} perdeu o tempo e passou.`;
          sendOnlineBattleAction("pass");
          return;
        }
        logBattle(`${monsterOf(active).name} perdeu o tempo e passou.`);
        finishTurn({ ignoreExtraTurn: true });
      }
    }
  }, 1000);
}

function startMatchTimer() {
  clearMatchTimer();
  if (!state.battle || state.battle.over) return;
  state.matchTimerInterval = window.setInterval(() => {
    if (!state.battle || state.battle.over) {
      clearMatchTimer();
      return;
    }

    state.battle.matchTime = Math.max(0, state.battle.matchTime - 1);
    renderMatchTimer();

    if (state.battle.matchTime <= 0) {
      resolveTimeoutBattle();
    }
  }, 1000);
}

function chooseAction(action) {
  if (state.battle?.online) {
    handleOnlineBattleAction(action);
    return;
  }
  if (!isPlayerTurn()) return;
  closeTazzoViewer();
  const allowedAction = tutorialAllowedAction();
  if (allowedAction && action !== allowedAction) {
    state.battle.status = `Tutorial: selecione ${actionName(allowedAction)}.`;
    playSfx("ui-error");
    renderBattle();
    return;
  }
  if (action === "keeper") {
    queuePlayerKeeperAbility();
    return;
  }
  if (action === "pass") {
    logBattle(`${monsterOf(activePiece()).name} passou.`);
    playBattleActionSfx("pass");
    if (activePiece()?.side === "player") progressTutorial("pass");
    if (completeTutorialActionScenario("pass")) return;
    finishTurn({ ignoreExtraTurn: true });
    return;
  }
  state.battle.pendingAction = state.battle.pendingAction === action ? null : action;
  state.battle.validTargets = state.battle.pendingAction ? validTargetsFor(activePiece(), state.battle.pendingAction) : [];
  playSfx(state.battle.pendingAction ? "action-select" : "ui-back");
  renderBattle();
}

function handleArenaClick(x, y) {
  if (state.battle?.online) {
    handleOnlineBattleTarget(x, y);
    return;
  }
  if (!isPlayerTurn() || !state.battle.pendingAction) return;
  const target = state.battle.validTargets.find((item) => item.x === x && item.y === y);
  if (!target) return;
  playSfx("target-select");
  executeAction(activePiece(), target);
}

function executeAction(piece, target, options = {}) {
  const action = target.action;
  playBattleActionSfx(action, { cooldown: 120 });
  if (action === "move" || action === "retreat") {
    piece.x = target.x;
    piece.y = target.y;
    logBattle(`${monsterOf(piece).name} moveu.`);
    if (piece.side === "player" && action === "move") progressTutorial("move");
    if (piece.side === "player" && action === "retreat") progressTutorial("retreat");
  }

  if (action === "swap") {
    const ally = pieceAt(target.x, target.y);
    const old = { x: piece.x, y: piece.y };
    piece.x = ally.x;
    piece.y = ally.y;
    ally.x = old.x;
    ally.y = old.y;
    if (state.battle.effects[piece.side]?.freeSwap && !state.battle.effects[piece.side]?.substitution) {
      state.battle.effects[piece.side].freeSwap = false;
    }
    logBattle(`${monsterOf(piece).name} trocou posicao com ${monsterOf(ally).name}.`);
    if (piece.side === "player") progressTutorial("swap");
  }

  if (action === "dribble") {
    const defender = pieceAt(target.x, target.y);
    basicAttack(piece, defender, false);
    if (piece.side === "player") progressTutorial("dribble");
  }

  if (action === "shot") {
    const defender = pieceAt(target.x, target.y);
    moveDashAttacker(piece, defender);
    basicAttack(piece, defender, true);
    if (piece.side === "player") progressTutorial("shot");
  }

  if (action === "pressure") {
    const defender = pieceAt(target.x, target.y);
    const pushed = pushPiece(defender, piece, 1);
    if (pushed.out && piece.side === "player") progressMission("push", 1);
    logBattle(`${monsterOf(piece).name} pressionou ${monsterOf(defender).name}.`);
    if (piece.side === "player") progressTutorial("pressure");
    if (completeTutorialActionScenario(action, { collision: pushed.out || pushed.collision })) return;
  }

  if (completeTutorialActionScenario(action)) return;
  if (options.skipFinishTurn) return;
  finishTurn();
}

function basicAttack(attacker, defender, isDash) {
  if (!attacker || !defender) return;
  const damage = calculateDamage(attacker, defender, isDash);
  applyDamage(defender, damage, attacker.side, { precalculated: true });
  const actionName = isDash ? "chutou contra" : "driblou";
  logBattle(`${monsterOf(attacker).name} ${actionName} ${monsterOf(defender).name}: ${damage} dano.`);

  if (defender.hp > 0) {
    const force = isDash ? attacker.shot : attacker.dribble;
    const steps = isDash ? (force > defender.speed ? 2 : 1) : (force > defender.speed ? 1 : 0);
    if (steps > 0) {
      const pushed = pushPiece(defender, attacker, steps, force);
      if (pushed.out && attacker.side === "player") progressMission("push", 1);
    }
  }

  if (isDash) consumeFullShot(attacker.side);
}

function calculateDamage(attacker, defender, isDash) {
  const fullShot = isDash && fullShotCharges(attacker.side) > 0;
  const base = isDash ? attacker.shot * (fullShot ? 1 : 0.5) : attacker.dribble;
  const surrounded = isSurrounded(defender) ? 1.25 : 1;
  const matchup = typeMultiplier(monsterOf(attacker).types, monsterOf(defender).types);
  const positionalAttack = positionalAttackMultiplier(attacker);
  const positionalDefense = positionalDefenseMultiplier(defender);
  return Math.max(1, Math.round(base * surrounded * matchup * positionalAttack * positionalDefense));
}

function fullShotCharges(side) {
  const value = state.battle?.effects?.[side]?.fullShot;
  if (value === true) return 1;
  return Math.max(0, Number(value) || 0);
}

function consumeFullShot(side) {
  const charges = fullShotCharges(side);
  if (!charges || !state.battle?.effects?.[side]) return;
  state.battle.effects[side].fullShot = Math.max(0, charges - 1);
}

function typeMultiplier(attackerTypes, defenderTypes) {
  const advantages = {
    Atacante: "Meia",
    Meia: "Defensor",
    Defensor: "Atacante"
  };
  const attackerList = Array.isArray(attackerTypes) ? attackerTypes : [];
  const defenderList = Array.isArray(defenderTypes) ? defenderTypes : [];
  if (attackerList.some((type) => defenderList.includes(advantages[type]))) return 1.25;
  return 1;
}

function positionalAttackMultiplier(piece) {
  return hasPositionalRoleBonus(piece) ? 1.1 : 1;
}

function positionalDefenseMultiplier(piece) {
  return hasPositionalRoleBonus(piece) ? 0.9 : 1;
}

function incomingDamageAfterPosition(piece, damage) {
  return Math.max(1, Math.round(damage * positionalDefenseMultiplier(piece)));
}

function hasPositionalRoleBonus(piece) {
  const monster = piece ? monsterOf(piece) : null;
  if (monster?.types?.includes("Atacante") && state.battle?.effects?.[piece.side]?.attackerFieldBonus) return true;
  const bonusType = positionalBonusType(piece);
  return Boolean(monster && bonusType && monster.types.includes(bonusType));
}

function positionalBonusType(piece) {
  const zone = tacticalZone(piece);
  if (zone === "own") return "Defensor";
  if (zone === "mid") return "Meia";
  if (zone === "enemy") return "Atacante";
  return "";
}

function tacticalZone(piece) {
  if (!piece) return "";
  const ownArea = piece.side === "player" ? piece.x <= 1 : piece.x >= 5;
  const enemyArea = piece.side === "player" ? piece.x >= 5 : piece.x <= 1;
  if (ownArea) return "own";
  if (enemyArea) return "enemy";
  return "mid";
}

function pushPiece(target, attacker, steps, force = attacker.dribble) {
  const dx = Math.sign(target.x - attacker.x);
  const dy = Math.sign(target.y - attacker.y);
  const result = { moved: 0, collision: false, out: false };
  if (dx === 0 && dy === 0) return result;

  for (let i = 0; i < steps; i += 1) {
    const next = { x: target.x + dx, y: target.y + dy };
    if (!insideArena(next.x, next.y)) {
      const damage = incomingDamageAfterPosition(target, Math.round(force * 0.5));
      applyDamage(target, damage, attacker.side, { precalculated: true });
      logBattle(`${monsterOf(target).name} bateu na borda: ${damage} dano extra.`);
      playSfx("wall-bump", { pitch: 0.04 });
      if (attacker.side === "player") progressTutorial("collision");
      result.out = true;
      break;
    }

    const blocker = pieceAt(next.x, next.y);
    if (blocker) {
      const baseDamage = Math.round(force * 0.25);
      const targetDamage = incomingDamageAfterPosition(target, baseDamage);
      const blockerDamage = incomingDamageAfterPosition(blocker, baseDamage);
      applyDamage(target, targetDamage, attacker.side, { precalculated: true });
      applyDamage(blocker, blockerDamage, attacker.side, { precalculated: true });
      logBattle(`Colisao entre ${monsterOf(target).name} e ${monsterOf(blocker).name}: ${targetDamage}/${blockerDamage} dano.`);
      playSfx("collision", { pitch: 0.04 });
      if (attacker.side === "player") {
        progressMission("collision", 1);
        progressTutorial("collision");
      }
      result.collision = true;
      break;
    }

    target.x = next.x;
    target.y = next.y;
    result.moved += 1;
  }

  return result;
}

function applyDamage(piece, damage, sourceSide, options = {}) {
  const wasAlive = piece.hp > 0;
  const finalDamage = options.precalculated ? damage : incomingDamageAfterPosition(piece, damage);
  piece.hp = Math.max(0, piece.hp - finalDamage);
  if (sourceSide === "player") state.battle.damageByPlayer += finalDamage;
  if (sourceSide === "cpu") state.battle.damageByCpu += finalDamage;
  if (wasAlive && piece.hp <= 0) {
    logBattle(`${monsterOf(piece).name} saiu da arena.`);
    playSfx("ko", { cooldown: 140, pitch: 0.03 });
  }
}

function battleGoalkeeper(side) {
  return state.battle?.goalkeepers?.[side] || null;
}

function canUseKeeperAbility(sideOrPiece) {
  const side = typeof sideOrPiece === "string" ? sideOrPiece : sideOrPiece?.side;
  const keeper = battleGoalkeeper(side);
  const active = activePiece();
  const monster = keeper ? MONSTER_BY_ID[keeper.monsterId] : null;
  return Boolean(
    side
    && active
    && active.side === side
    && active.hp > 0
    && monster?.keeperAbility
    && !keeper.used
    && keeperAbilityCanResolve(side, monster.keeperAbility)
  );
}

function keeperAbilityCanResolve(side, ability) {
  if (ability === "attackerFieldBonus") {
    return !state.battle.effects[side]?.attackerFieldBonus
      && state.battle.pieces.some((ally) => ally.side === side && ally.hp > 0 && monsterOf(ally).types.includes("Atacante"));
  }
  if (ability === "reviveRandom") return defeatedPieces(side).length > 0;
  if (ability === "resetEnemies") {
    return alivePieces().some((piece) => (
      piece.side !== side
      && (piece.x !== startingX(piece) || piece.y !== startingY(piece))
    ));
  }
  return true;
}

function useKeeperAbility(sideOrPiece) {
  const side = typeof sideOrPiece === "string" ? sideOrPiece : sideOrPiece?.side;
  if (!canUseKeeperAbility(side)) return false;

  const keeper = battleGoalkeeper(side);
  const monster = MONSTER_BY_ID[keeper.monsterId];
  const active = activePiece();
  keeper.used = true;
  state.battle.pendingAction = null;
  state.battle.validTargets = [];
  if (side === "player") {
    progressMission("keeper", 1);
    progressTutorial("keeper");
  }

  if (monster.keeperAbility === "extraTurn") {
    state.battle.effects[side].extraTurnId = active.id;
    logBattle(`${monster.name} fechou o gol: ${monsterOf(active).name} jogara de novo apos esta acao.`);
    return true;
  }

  if (monster.keeperAbility === "fullShot") {
    state.battle.effects[side].fullShot = 1;
    logBattle(`${monster.name} armou o chute perfeito: o proximo chute causa dano cheio.`);
    return true;
  }

  if (monster.keeperAbility === "attackerFieldBonus") {
    state.battle.effects[side].attackerFieldBonus = true;
    logBattle(`${monster.name} abriu o campo: atacantes contam como em zona ideal ate o fim da partida.`);
    return true;
  }

  if (monster.keeperAbility === "reviveRandom") {
    const revived = reviveRandomDefeatedPiece(side);
    if (!revived) return false;
    logBattle(`${monster.name} chamou reforco: ${monsterOf(revived).name} voltou para a arena.`);
    return true;
  }

  if (monster.keeperAbility === "resetEnemies") {
    const moved = resetEnemyPiecesToStart(side);
    logBattle(`${monster.name} reorganizou o rival: ${moved} jogador(es) voltaram para a formacao inicial.`);
    finishTurn();
    return true;
  }

  if (monster.keeperAbility === "investidaTotal") {
    state.battle.effects[side].fullShot = 2;
    logBattle(`${monster.name} chamou a investida total: os proximos 2 chutes causam dano cheio.`);
    return true;
  }

  if (monster.keeperAbility === "teamHeal") {
    state.battle.pieces
      .filter((ally) => ally.side === side && ally.hp > 0)
      .forEach((ally) => {
        ally.hp = ally.maxHp;
      });
    logBattle(`${monster.name} reorganizou a defesa: o time recuperou toda a vitalidade.`);
    finishTurn();
    return true;
  }

  if (monster.keeperAbility === "freeSwap") {
    state.battle.effects[side].freeSwap = true;
    logBattle(`${monster.name} liberou inversao total: a proxima troca pode ser feita em qualquer lugar.`);
    finishTurn();
    return true;
  }

  if (monster.keeperAbility === "substitution") {
    state.battle.effects[side].substitution = true;
    state.battle.effects[side].freeSwap = true;
    logBattle(`${monster.name} ativou substituicao: trocas livres ate o fim da partida.`);
    finishTurn();
    return true;
  }

  return false;
}

function moveDashAttacker(attacker, defender) {
  const dx = Math.sign(defender.x - attacker.x);
  const dy = Math.sign(defender.y - attacker.y);
  const beforeTarget = { x: defender.x - dx, y: defender.y - dy };
  if (insideArena(beforeTarget.x, beforeTarget.y) && !pieceAt(beforeTarget.x, beforeTarget.y)) {
    attacker.x = beforeTarget.x;
    attacker.y = beforeTarget.y;
  }
}

async function finishTurn(options = {}) {
  const finishedId = state.battle.activeId;
  const finishedPiece = state.battle.pieces.find((piece) => piece.id === finishedId);
  const finishedSide = finishedPiece?.side;
  clearTurnTimer();
  state.battle.pendingAction = null;
  state.battle.validTargets = [];
  await checkVictory();
  if (state.battle.over) {
    renderAll();
    return;
  }
  if (!options.ignoreExtraTurn && finishedSide && state.battle.effects[finishedSide]?.extraTurnId === finishedId) {
    state.battle.effects[finishedSide].extraTurnId = null;
    options.extraTurnId = finishedId;
  }
  if (options.ignoreExtraTurn && finishedSide && state.battle.effects[finishedSide]?.extraTurnId === finishedId) {
    state.battle.effects[finishedSide].extraTurnId = null;
  }
  if (options.extraTurnId) {
    const extra = state.battle.pieces.find((piece) => piece.id === options.extraTurnId && piece.hp > 0);
    if (extra) {
      state.battle.activeId = extra.id;
      if (extra.side === "cpu" && !state.battle.online) {
        startTurnTimer(0);
        window.setTimeout(runAiTurn, 420);
      } else {
        startTurnTimer(state.battle.actionTime || 20);
      }
      renderAll();
      return;
    }
  }
  advanceTurn();
  renderAll();
}

function advanceTurn() {
  if (!state.battle || state.battle.over) return;

  while (true) {
    if (!state.battle.turnQueue.length) {
      state.battle.round += 1;
      state.battle.turnQueue = alivePieces().sort(turnSort).map((piece) => piece.id);
    }

    const nextId = state.battle.turnQueue.shift();
    const next = state.battle.pieces.find((piece) => piece.id === nextId && piece.hp > 0);
    if (next) {
      state.battle.activeId = next.id;
      if (next.side === "player") playSfx("turn-start", { cooldown: 220, pitch: 0.03 });
      if (next.side === "cpu" && !state.battle.online) {
        startTurnTimer(0);
        window.setTimeout(runAiTurn, 420);
      } else {
        startTurnTimer(state.battle.actionTime || 20);
      }
      return;
    }
  }
}

function runAiTurn() {
  const piece = activePiece();
  if (!piece || piece.side !== "cpu" || state.battle.over) return;
  if (state.battle.animation?.stage === "windup") return;

  if (shouldUseKeeperAbility(piece)) {
    queueAiKeeperAbility(piece);
    return;
  }

  const dribbleTargets = validTargetsFor(piece, "dribble");
  if (dribbleTargets.length) {
    executeAiAction(piece, bestAttackTarget(piece, dribbleTargets, false));
    return;
  }

  const shotTargets = validTargetsFor(piece, "shot");
  if (shotTargets.length) {
    executeAiAction(piece, bestAttackTarget(piece, shotTargets, true));
    return;
  }

  const moveTargets = validTargetsFor(piece, "move");
  if (moveTargets.length) {
    const best = moveTargets.sort((a, b) => scoreMove(piece, a) - scoreMove(piece, b))[0];
    executeAiAction(piece, best);
    return;
  }

  queueAiPass(piece);
}

function shouldUseKeeperAbility(piece) {
  if (!canUseKeeperAbility(piece.side)) return false;
  const keeper = battleGoalkeeper(piece.side);
  const ability = MONSTER_BY_ID[keeper.monsterId].keeperAbility;
  if (ability === "teamHeal") {
    const missingHp = state.battle.pieces
      .filter((ally) => ally.side === piece.side && ally.hp > 0)
      .reduce((sum, ally) => sum + (ally.maxHp - ally.hp), 0);
    return missingHp >= 40;
  }
  if (ability === "attackerFieldBonus") {
    return keeperAbilityCanResolve(piece.side, ability);
  }
  if (ability === "reviveRandom") {
    return defeatedPieces(piece.side).length > 0;
  }
  if (ability === "resetEnemies") {
    return alivePieces().some((enemy) => (
      enemy.side !== piece.side
      && (enemy.x !== startingX(enemy) || enemy.y !== startingY(enemy))
    ));
  }
  if (ability === "fullShot" || ability === "investidaTotal") return validTargetsFor(piece, "shot").length > 0;
  if (ability === "extraTurn") return validTargetsFor(piece, "dribble").length > 0 || validTargetsFor(piece, "shot").length > 0;
  if (ability === "freeSwap" || ability === "substitution") {
    const allies = alivePieces().filter((ally) => ally.side === piece.side && ally.id !== piece.id);
    return allies.length > 0 && !validTargetsFor(piece, "dribble").length && !validTargetsFor(piece, "shot").length;
  }
  return false;
}

function executeAiAction(piece, target) {
  queueAiAction(piece, target);
}

function queueAiAction(piece, target) {
  const animation = battleActionAnimation(piece, target, "windup");
  state.battle.animation = animation;
  state.battle.status = animation.text;
  renderAll();

  window.setTimeout(() => {
    if (!state.battle || state.battle.over || state.battle.animation !== animation) return;
    const currentPiece = state.battle.pieces.find((item) => item.id === piece.id && item.hp > 0);
    if (!currentPiece || currentPiece.side !== "cpu" || activePiece()?.id !== piece.id) return;

    const resolvedAnimation = { ...animation, stage: "resolve", text: battleActionResolvedText(currentPiece, target) };
    state.battle.animation = resolvedAnimation;
    state.battle.status = resolvedAnimation.text;
    executeAction(currentPiece, target);
    scheduleBattleAnimationClear(resolvedAnimation);
  }, AI_ACTION_WINDUP_MS);
}

function queueAiPass(piece) {
  const animation = {
    side: "cpu",
    stage: "windup",
    actorId: piece.id,
    targetId: null,
    action: "pass",
    from: { x: piece.x, y: piece.y },
    to: { x: piece.x, y: piece.y },
    text: `${state.battle.enemyName}: ${monsterOf(piece).name} vai passar.`
  };
  state.battle.animation = animation;
  state.battle.status = animation.text;
  renderAll();

  window.setTimeout(() => {
    if (!state.battle || state.battle.over || state.battle.animation !== animation) return;
    const currentPiece = state.battle.pieces.find((item) => item.id === piece.id && item.hp > 0);
    if (!currentPiece || currentPiece.side !== "cpu" || activePiece()?.id !== piece.id) return;
    const resolvedAnimation = { ...animation, stage: "resolve", text: `${monsterOf(currentPiece).name} passou o turno.` };
    state.battle.animation = resolvedAnimation;
    state.battle.status = resolvedAnimation.text;
    logBattle(`${monsterOf(currentPiece).name} passou.`);
    finishTurn();
    scheduleBattleAnimationClear(resolvedAnimation);
  }, AI_ACTION_WINDUP_MS);
}

function queuePlayerKeeperAbility() {
  const piece = activePiece();
  if (!piece || piece.side !== "player" || !canUseKeeperAbility(piece.side)) return;
  const keeper = battleGoalkeeper(piece.side);
  const keeperMonster = MONSTER_BY_ID[keeper?.monsterId];
  if (!keeperMonster) return;
  const animation = keeperAbilityAnimation(piece, "windup", `${keeperMonster.name} vai ativar a habilidade.`);
  state.battle.animation = animation;
  state.battle.status = animation.text;
  playSfx("keeper-charge");
  renderAll();

  window.setTimeout(() => {
    if (!state.battle || state.battle.over || state.battle.animation !== animation) return;
    const currentPiece = state.battle.pieces.find((item) => item.id === piece.id && item.hp > 0);
    if (!currentPiece || currentPiece.side !== "player" || activePiece()?.id !== piece.id) return;
    const resolvedAnimation = {
      ...animation,
      stage: "resolve",
      text: keeperAbilityResolvedText(keeperMonster)
    };
    state.battle.animation = resolvedAnimation;
    state.battle.status = resolvedAnimation.text;
    const used = useKeeperAbility(currentPiece.side);
    if (used) playSfx("keeper-activate");
    if (used && completeTutorialActionScenario("keeper")) {
      scheduleBattleAnimationClear(resolvedAnimation);
      return;
    }
    if (used && !state.battle.over) renderAll();
    scheduleBattleAnimationClear(resolvedAnimation);
  }, AI_ACTION_WINDUP_MS);
}

function queueAiKeeperAbility(piece) {
  const keeper = battleGoalkeeper(piece.side);
  const keeperMonster = MONSTER_BY_ID[keeper?.monsterId];
  if (!keeperMonster) return;
  const animation = keeperAbilityAnimation(piece, "windup", `${state.battle.enemyName}: ${keeperMonster.name} vai ativar a habilidade.`);
  state.battle.animation = animation;
  state.battle.status = animation.text;
  playSfx("keeper-charge", { volume: 0.72 });
  renderAll();

  window.setTimeout(() => {
    if (!state.battle || state.battle.over || state.battle.animation !== animation) return;
    const currentPiece = state.battle.pieces.find((item) => item.id === piece.id && item.hp > 0);
    if (!currentPiece || currentPiece.side !== "cpu" || activePiece()?.id !== piece.id) return;
    const resolvedAnimation = {
      ...animation,
      stage: "resolve",
      text: keeperAbilityResolvedText(keeperMonster)
    };
    state.battle.animation = resolvedAnimation;
    state.battle.status = resolvedAnimation.text;
    const used = useKeeperAbility(currentPiece.side);
    if (used) playSfx("keeper-activate", { volume: 0.78 });
    if (used && !state.battle.over && activePiece()?.id === currentPiece.id) {
      renderAll();
      window.setTimeout(runAiTurn, AI_ACTION_RESULT_MS);
    }
    scheduleBattleAnimationClear(resolvedAnimation);
  }, AI_ACTION_WINDUP_MS);
}

function keeperAbilityAnimation(piece, stage, text) {
  const keeper = battleGoalkeeper(piece.side);
  return {
    side: piece.side,
    stage,
    actorId: piece.id,
    targetId: null,
    keeperMonsterId: keeper?.monsterId || "",
    action: "keeper",
    from: { x: piece.x, y: piece.y },
    to: { x: piece.x, y: piece.y },
    text
  };
}

function keeperAbilityResolvedText(keeperMonster) {
  return `${keeperMonster.name} ativou ${keeperAbilityText(keeperMonster).replace("Habilidade: ", "").toLowerCase()}.`;
}

function scheduleBattleAnimationClear(animation) {
  window.setTimeout(() => {
    if (!state.battle || state.battle.animation !== animation) return;
    state.battle.animation = null;
    renderAll();
  }, AI_ACTION_RESULT_MS);
}

function battleActionAnimation(piece, target, stage) {
  const targetPiece = pieceAt(target.x, target.y);
  return {
    side: "cpu",
    stage,
    actorId: piece.id,
    targetId: targetPiece && targetPiece.id !== piece.id ? targetPiece.id : null,
    action: target.action,
    from: { x: piece.x, y: piece.y },
    to: { x: target.x, y: target.y },
    text: `${state.battle.enemyName}: ${monsterOf(piece).name} vai ${aiActionVerb(piece, target, targetPiece)}.`
  };
}

function battleActionResolvedText(piece, target) {
  const targetPiece = pieceAt(target.x, target.y);
  return `${monsterOf(piece).name} executou ${actionName(target.action).toLowerCase()}${targetPiece && targetPiece.id !== piece.id ? ` em ${monsterOf(targetPiece).name}` : ""}.`;
}

function aiActionVerb(piece, target, targetPiece) {
  const targetName = targetPiece && targetPiece.id !== piece.id ? monsterOf(targetPiece).name : "";
  if (target.action === "move") return `mover para casa ${target.x + 1}, ${target.y + 1}`;
  if (target.action === "retreat") return `recuar para casa ${target.x + 1}, ${target.y + 1}`;
  if (target.action === "swap") return targetName ? `trocar com ${targetName}` : "trocar posicao";
  if (target.action === "dribble") return targetName ? `driblar ${targetName}` : "driblar";
  if (target.action === "shot") return targetName ? `chutar contra ${targetName}` : "chutar";
  if (target.action === "pressure") return targetName ? `pressionar ${targetName}` : "pressionar";
  return actionName(target.action).toLowerCase();
}

function bestAttackTarget(piece, targets, isDash) {
  return targets
    .map((target) => {
      const defender = pieceAt(target.x, target.y);
      const damage = defender ? calculateDamage(piece, defender, isDash) : 0;
      return { ...target, score: damage + (defender ? (defender.maxHp - defender.hp) * 0.15 : 0) };
    })
    .sort((a, b) => b.score - a.score)[0];
}

function scoreMove(piece, cell) {
  const enemies = alivePieces().filter((item) => item.side !== piece.side);
  const nearest = Math.min(...enemies.map((enemy) => distance(cell, enemy)));
  const center = Math.abs(cell.x - 3) + Math.abs(cell.y - 2);
  return nearest * 3 + center;
}

async function checkVictory() {
  const playerAlive = alivePieces().some((piece) => piece.side === "player");
  const cpuAlive = alivePieces().some((piece) => piece.side === "cpu");

  if (playerAlive && cpuAlive) return;

  state.battle.over = true;
  clearTurnTimer();
  clearMatchTimer();
  progressMission("battle", 1);

  if (playerAlive) {
    if (state.battle.tournamentId) {
      const tournamentReward = await resolveTournamentBattle(true);
      setBattleResult({
        winner: "player",
        title: "Vitoria no torneio",
        reason: `Voce derrotou ${state.battle.enemyName}.`,
        rewards: tournamentReward.rewards,
        tournamentId: state.battle.tournamentId,
        packReward: tournamentReward.packReward
      });
    } else if (state.battle.ranked) {
      const rankedReward = await resolveRankedBattle("win");
      setBattleResult({
        winner: "player",
        title: "Vitoria ranqueada",
        reason: `Voce derrotou ${state.battle.enemyName}.`,
        rewards: rankedReward.rewards,
        ranked: true
      });
    } else {
      const rewards = state.battle.mode === "training" ? await trainingAiRewardSummary("win") : ["+250 Merreis"];
      state.battle.status = state.battle.mode === "training" ? rewards.status : "Vitoria! +250 Merreis";
      if (state.battle.mode !== "training") state.save.merreis += 250;
      setBattleResult({
        winner: "player",
        title: "Vitoria!",
        reason: `Voce derrotou ${state.battle.enemyName}.`,
        rewards: rewards.items || rewards
      });
    }
    progressMission("win", 1);
    progressTutorial("win");
    logBattle("Voce venceu a partida.");
  } else {
    if (state.battle.tournamentId) {
      const tournamentReward = await resolveTournamentBattle(false);
      setBattleResult({
        winner: "cpu",
        title: "Eliminado",
        reason: `${state.battle.enemyName} venceu a batalha.`,
        rewards: tournamentReward.rewards,
        tournamentId: state.battle.tournamentId
      });
    } else if (state.battle.ranked) {
      const rankedReward = await resolveRankedBattle("loss");
      setBattleResult({
        winner: "cpu",
        title: "Derrota ranqueada",
        reason: `${state.battle.enemyName} venceu a batalha.`,
        rewards: rankedReward.rewards,
        ranked: true
      });
    } else {
      const rewards = state.battle.mode === "training" ? await trainingAiRewardSummary("loss") : ["+60 Merreis"];
      state.battle.status = state.battle.mode === "training" ? rewards.status : `Derrota. ${state.battle.enemyName} venceu.`;
      if (state.battle.mode !== "training") state.save.merreis += 60;
      setBattleResult({
        winner: "cpu",
        title: "Derrota",
        reason: `${state.battle.enemyName} venceu a partida.`,
        rewards: rewards.items || rewards
      });
    }
    logBattle(`${state.battle.enemyName} venceu a partida.`);
  }

  saveGame();
}

async function resolveTimeoutBattle() {
  if (!state.battle || state.battle.over) return;
  clearTurnTimer();
  clearMatchTimer();
  state.battle.over = true;

  const winner = timeoutWinner();
  progressMission("battle", 1);

  if (state.battle.tournamentId) {
    if (winner === "player") {
      progressMission("win", 1);
      progressTutorial("win");
    }
    const tournamentReward = await resolveTournamentBattle(winner === "player", winner === "draw" ? "empate tecnico" : "desempate");
    setBattleResult({
      winner: winner === "player" ? "player" : winner === "draw" ? "draw" : "cpu",
      title: winner === "player" ? "Vitoria no desempate" : "Eliminado no desempate",
      reason: winner === "draw" ? "Empate tecnico favoreceu a chave adversaria." : "O tempo acabou e o placar decidiu.",
      rewards: tournamentReward.rewards,
      tournamentId: state.battle.tournamentId,
      packReward: tournamentReward.packReward
    });
    logBattle(winner === "player" ? "Voce venceu o torneio no desempate." : "O torneio foi perdido no desempate.");
  } else if (state.battle.ranked) {
    if (winner === "player") {
      progressMission("win", 1);
      progressTutorial("win");
    }
    const outcome = winner === "player" ? "win" : winner === "draw" ? "draw" : "loss";
    const rankedReward = await resolveRankedBattle(outcome, winner === "draw" ? "empate tecnico" : "desempate");
    setBattleResult({
      winner: winner === "player" ? "player" : winner === "draw" ? "draw" : "cpu",
      title: winner === "player" ? "Vitoria ranqueada" : winner === "draw" ? "Empate ranqueado" : "Derrota ranqueada",
      reason: winner === "draw" ? "Vivos, vida e dano terminaram empatados." : "O tempo acabou e o placar decidiu.",
      rewards: rankedReward.rewards,
      ranked: true
    });
    logBattle(winner === "player" ? "Voce venceu a ranqueada no desempate." : winner === "draw" ? "A ranqueada terminou empatada." : "Voce perdeu a ranqueada no desempate.");
  } else if (state.battle.mode === "training") {
    const rewards = await trainingAiRewardSummary(winner === "player" ? "win" : winner === "draw" ? "draw" : "loss");
    state.battle.status = rewards.status;
    if (winner === "player") {
      progressMission("win", 1);
      progressTutorial("win");
    }
    setBattleResult({
      winner: winner === "player" ? "player" : winner === "draw" ? "draw" : "cpu",
      title: winner === "player" ? "Vitoria por desempate" : winner === "draw" ? "Empate tecnico" : "Derrota por desempate",
      reason: winner === "draw" ? "Vivos, vida e dano terminaram empatados." : "O tempo acabou e o placar decidiu.",
      rewards: rewards.items
    });
    logBattle(winner === "player" ? "O treino terminou com vitoria no desempate." : winner === "draw" ? "O treino terminou empatado." : "O treino terminou com derrota no desempate.");
  } else if (winner === "player") {
    state.battle.status = "Tempo esgotado: vitoria por desempate! +220 Merreis";
    state.save.merreis += 220;
    progressMission("win", 1);
    progressTutorial("win");
    setBattleResult({
      winner: "player",
      title: "Vitoria por desempate",
      reason: "O tempo acabou e voce venceu pelo placar.",
      rewards: ["+220 Merreis"]
    });
    logBattle("O tempo acabou. Voce venceu no desempate.");
  } else if (winner === "cpu") {
    state.battle.status = `Tempo esgotado: ${state.battle.enemyName} venceu no desempate.`;
    state.save.merreis += 60;
    setBattleResult({
      winner: "cpu",
      title: "Derrota por desempate",
      reason: `${state.battle.enemyName} levou a melhor no placar.`,
      rewards: ["+60 Merreis"]
    });
    logBattle(`O tempo acabou. ${state.battle.enemyName} venceu no desempate.`);
  } else {
    state.battle.status = "Tempo esgotado: empate tecnico. +100 Merreis";
    state.save.merreis += 100;
    setBattleResult({
      winner: "draw",
      title: "Empate tecnico",
      reason: "Vivos, vida e dano terminaram empatados.",
      rewards: ["+100 Merreis"]
    });
    logBattle("O tempo acabou em empate tecnico.");
  }

  saveGame();
  renderAll();
}

function timeoutWinner() {
  const player = battleSideStats("player");
  const cpu = battleSideStats("cpu");
  if (player.alive !== cpu.alive) return player.alive > cpu.alive ? "player" : "cpu";
  if (player.hp !== cpu.hp) return player.hp > cpu.hp ? "player" : "cpu";
  if (state.battle.damageByPlayer !== state.battle.damageByCpu) {
    return state.battle.damageByPlayer > state.battle.damageByCpu ? "player" : "cpu";
  }
  return "draw";
}

function setBattleResult(result) {
  playSfx(result.winner === "player" ? "battle-win" : result.winner === "draw" ? "battle-draw" : "battle-lose");
  if (typeof trackTelemetry === "function") {
    trackTelemetry("battle:result", {
      mode: state.battle?.mode || "",
      winner: result.winner,
      reason: result.reason || "",
      ranked: Boolean(result.ranked),
      tournamentId: result.tournamentId || null
    }, { dedupeKey: `battle:result:${Date.now()}`, cooldown: 0 });
  }
  state.battle.result = {
    winner: result.winner,
    title: result.title,
    reason: result.reason,
    rewards: result.rewards || [],
    tournamentId: result.tournamentId || null,
    ranked: Boolean(result.ranked),
    packReward: Boolean(result.packReward)
  };
}

async function trainingAiRewardSummary(outcome) {
  const result = await resolveTrainingAiBattleRewards(outcome);
  return {
    status: result.status || "Treino contra IA concluido.",
    items: result.rewards || []
  };
}

function battleSideStats(side) {
  const pieces = state.battle.pieces.filter((piece) => piece.side === side && piece.hp > 0);
  return {
    alive: pieces.length,
    hp: pieces.reduce((sum, piece) => sum + piece.hp, 0)
  };
}

function validTargetsFor(piece, action) {
  if (!piece || piece.hp <= 0) return [];
  if (action === "move") return moveCells(piece).map((cell) => ({ ...cell, action }));
  if (action === "retreat") return retreatCells(piece).map((cell) => ({ ...cell, action }));
  if (action === "dribble") return adjacentEnemies(piece).map((enemy) => ({ x: enemy.x, y: enemy.y, action }));
  if (action === "pressure") return adjacentEnemies(piece).map((enemy) => ({ x: enemy.x, y: enemy.y, action }));
  if (action === "swap") {
    const allies = state.battle.effects[piece.side]?.freeSwap || state.battle.effects[piece.side]?.substitution
      ? alivePieces().filter((ally) => ally.side === piece.side && ally.id !== piece.id)
      : adjacentAllies(piece);
    return allies.map((ally) => ({ x: ally.x, y: ally.y, action }));
  }
  if (action === "shot") return dashEnemies(piece).map((enemy) => ({ x: enemy.x, y: enemy.y, action }));
  return [];
}

function moveCells(piece) {
  const cells = movementCells(piece, movementFor(piece.speed));
  if (!isMarked(piece)) return cells;
  return cells.filter((cell) => adjacentEnemiesAt(piece.side, cell.x, cell.y).length > 0);
}

function movementCells(piece, maxSteps) {
  const visited = new Set([coordKey(piece.x, piece.y)]);
  const queue = [{ x: piece.x, y: piece.y, steps: 0 }];
  const results = [];

  while (queue.length) {
    const current = queue.shift();
    if (current.steps >= maxSteps) continue;
    orthogonalNeighbors(current.x, current.y).forEach((next) => {
      const key = coordKey(next.x, next.y);
      if (visited.has(key) || pieceAt(next.x, next.y)) return;
      visited.add(key);
      results.push({ x: next.x, y: next.y });
      queue.push({ ...next, steps: current.steps + 1 });
    });
  }

  return results;
}

function retreatCells(piece) {
  const adjacent = adjacentEnemies(piece);
  if (!adjacent.length) return movementCells(piece, Math.ceil(movementFor(piece.speed) / 2));
  const currentDistance = Math.min(...adjacent.map((enemy) => distance(piece, enemy)));
  return movementCells(piece, Math.ceil(movementFor(piece.speed) / 2)).filter((cell) => {
    const nextDistance = Math.min(...adjacent.map((enemy) => distance(cell, enemy)));
    return nextDistance > currentDistance && adjacentEnemiesAt(piece.side, cell.x, cell.y).length === 0;
  });
}

function dashEnemies(piece) {
  const maxDistance = dashFor(piece.speed);
  return alivePieces().filter((enemy) => {
    if (enemy.side === piece.side) return false;
    const dx = enemy.x - piece.x;
    const dy = enemy.y - piece.y;
    const aligned = dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    return aligned && dist <= maxDistance && dist > 0 && pathClear(piece, enemy);
  });
}

function pathClear(from, to) {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x + dx;
  let y = from.y + dy;
  while (x !== to.x || y !== to.y) {
    if (pieceAt(x, y)) return false;
    x += dx;
    y += dy;
  }
  return true;
}

function adjacentEnemies(piece) {
  return alivePieces().filter((other) => other.side !== piece.side && adjacent(piece, other));
}

function adjacentEnemiesAt(side, x, y) {
  return alivePieces().filter((other) => {
    if (other.side === side) return false;
    return Math.max(Math.abs(x - other.x), Math.abs(y - other.y)) === 1;
  });
}

function adjacentAllies(piece) {
  return alivePieces().filter((other) => other.side === piece.side && other.id !== piece.id && adjacent(piece, other));
}

function isMarked(piece) {
  return adjacentEnemies(piece).length > 0;
}

function isSurrounded(piece) {
  return adjacentEnemies(piece).length >= 2;
}

function adjacent(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
}

function movementFor(speed) {
  if (speed >= 100) return 4;
  if (speed >= 70) return 3;
  if (speed >= 40) return 2;
  return 1;
}

function dashFor(speed) {
  if (speed >= 100) return 5;
  if (speed >= 70) return 4;
  if (speed >= 40) return 3;
  return 2;
}

function insideArena(x, y) {
  return x >= 0 && x < 7 && y >= 0 && y < 5;
}

function orthogonalNeighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ].filter((cell) => insideArena(cell.x, cell.y));
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function coordKey(x, y) {
  return `${x},${y}`;
}

function startingX(piece) {
  return Number.isFinite(Number(piece?.startingX)) ? Number(piece.startingX) : Number(piece?.x) || 0;
}

function startingY(piece) {
  return Number.isFinite(Number(piece?.startingY)) ? Number(piece.startingY) : Number(piece?.y) || 0;
}

function defeatedPieces(side) {
  return state.battle.pieces.filter((piece) => piece.side === side && piece.hp <= 0);
}

function pieceAtExcept(x, y, exceptId = "") {
  return state.battle.pieces.find((piece) => piece.hp > 0 && piece.id !== exceptId && piece.x === x && piece.y === y);
}

function openCellNear(x, y, movingPiece = null) {
  const base = { x: Math.max(0, Math.min(6, Math.round(Number(x) || 0))), y: Math.max(0, Math.min(4, Math.round(Number(y) || 0))) };
  const candidates = [
    base,
    ...[-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => ({ x: base.x + dx, y: base.y + dy })))
      .filter((cell) => cell.x !== base.x || cell.y !== base.y)
      .sort((a, b) => distance(a, base) - distance(b, base) || a.y - b.y || a.x - b.x)
  ];
  return candidates.find((cell) => (
    insideArena(cell.x, cell.y)
    && !pieceAtExcept(cell.x, cell.y, movingPiece?.id || "")
  )) || { x: movingPiece?.x ?? base.x, y: movingPiece?.y ?? base.y };
}

function reviveRandomDefeatedPiece(side) {
  const defeated = defeatedPieces(side);
  if (!defeated.length) return null;
  const piece = defeated[Math.floor(Math.random() * defeated.length)];
  const cell = openCellNear(startingX(piece), startingY(piece), piece);
  piece.x = cell.x;
  piece.y = cell.y;
  piece.hp = piece.maxHp;
  return piece;
}

function resetEnemyPiecesToStart(side) {
  let moved = 0;
  state.battle.pieces
    .filter((piece) => piece.side !== side && piece.hp > 0)
    .forEach((piece) => {
      const cell = openCellNear(startingX(piece), startingY(piece), piece);
      if (piece.x !== cell.x || piece.y !== cell.y) moved += 1;
      piece.x = cell.x;
      piece.y = cell.y;
    });
  return moved;
}

function pieceAt(x, y) {
  return state.battle.pieces.find((piece) => piece.hp > 0 && piece.x === x && piece.y === y);
}

function activePiece() {
  return state.battle.pieces.find((piece) => piece.id === state.battle.activeId && piece.hp > 0);
}

function alivePieces() {
  return state.battle.pieces.filter((piece) => piece.hp > 0);
}

function turnSort(a, b) {
  if (b.speed !== a.speed) return b.speed - a.speed;
  if (a.hp !== b.hp) return a.hp - b.hp;
  return a.side === "player" ? -1 : 1;
}

function monsterOf(piece) {
  return MONSTER_BY_ID[piece.monsterId];
}

function isPlayerTurn() {
  const active = activePiece();
  return Boolean(active && active.side === "player" && !state.battle.over);
}

function actionStatusText() {
  if (state.battle.animation?.text) return state.battle.animation.text;
  if (state.battle.online) {
    if (state.battle.online.pendingAction) return state.battle.online.message || "Enviando jogada online...";
    if (state.battle.pendingAction) return `${actionName(state.battle.pendingAction)}: escolha o alvo online.`;
    return state.battle.online.message || (state.battle.online.isYourTurn ? "Seu turno online: escolha uma acao e um alvo." : "Arena online sincronizada pelo servidor.");
  }
  if (!isPlayerTurn()) return "Turno da IA.";
  const active = activePiece();
  const tutorialAction = tutorialAllowedAction();
  if (!state.battle.pendingAction && tutorialAction) {
    return `Tutorial: selecione ${actionName(tutorialAction)} para ver as jogadas.`;
  }
  if (!state.battle.pendingAction) return `${monsterOf(active).name} esta pronto.`;
  const count = state.battle.validTargets.length;
  if (tutorialAction) {
    return `Tutorial: clique em uma das ${count} jogada(s) destacadas.`;
  }
  if (state.battle.pendingAction === "move" && isMarked(active)) {
    return `Mover: ${count} opcao(s). Marcado: use Recuar para sair do contato.`;
  }
  if (state.battle.pendingAction === "retreat" && isMarked(active)) {
    return `Recuar: ${count} rota(s) para escapar da marcacao.`;
  }
  return `${actionName(state.battle.pendingAction)}: ${count} opcao(s).`;
}

function tutorialAllowedAction() {
  return typeof currentTutorialAllowedAction === "function" ? currentTutorialAllowedAction() : "";
}

function completeTutorialActionScenario(action, details = {}) {
  return typeof completeTutorialScenario === "function" ? completeTutorialScenario(action, details) : false;
}

function logBattle(text) {
  state.battle.log.push(text);
}
