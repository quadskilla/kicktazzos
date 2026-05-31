(function () {
  "use strict";

  function renderCompetitive(ctx) {
    const rank = ctx.currentRank();
    const next = ctx.nextRank();
    const progress = next ? Math.round(((ctx.state.save.trophies - rank.min) / (next.min - rank.min)) * 100) : 100;
    const cost = ctx.teamCost();
    const power = Math.round(ctx.teamPower());
    const legal = cost <= 10;
    const chance = Math.round(ctx.rankedChance() * 100);
    const latest = ctx.state.competitiveLog[0] || "Sem partidas competitivas nesta sessao.";
    const rankedOpponent = ctx.rankedOpponentForCurrentRank();
    const searching = Boolean(ctx.state.matchmaking?.active);
    const streak = Number(ctx.state.save.competitiveWinStreak) || 0;
    const nextBonus = streak >= 5 ? 8 : streak >= 4 ? 8 : streak >= 3 ? 6 : streak >= 2 ? 4 : 2;
    const savedCompetitive = ctx.activeSavedCompetitive();
    const savedTournamentId = savedCompetitive?.type === "tournament" ? savedCompetitive.tournamentId : "";
    const savedRanked = savedCompetitive?.type === "ranked";
    const tournamentsAvailable = ctx.TOURNAMENTS_AVAILABLE !== false;
    const matchmakingElapsed = searching ? Math.max(0, Date.now() - (Number(ctx.state.matchmaking.startedAt) || Date.now())) : 0;
    const matchmakingElapsedSeconds = Math.floor(matchmakingElapsed / 1000);
    const matchmakingEstimateSeconds = Math.ceil(ctx.COMPETITIVE_MATCHMAKING_TIMEOUT_MS / 1000);
    const matchmakingRemaining = searching ? Math.max(0, Math.ceil((ctx.COMPETITIVE_MATCHMAKING_TIMEOUT_MS - matchmakingElapsed) / 1000)) : 0;
    const matchmakingProgress = searching ? ctx.clamp(Math.round((matchmakingElapsed / ctx.COMPETITIVE_MATCHMAKING_TIMEOUT_MS) * 100), 0, 100) : 0;
    const matchmakingLabel = searching
      ? matchmakingRemaining
        ? `Bot em ${matchmakingRemaining}s`
        : "Chamando bot"
      : "Fila real";
    const matchmakingPanel = searching ? `
      <div class="matchmaking-search-card" role="status" aria-live="polite">
        <div class="matchmaking-search-head">
          <span class="eyebrow">${ctx.state.matchmaking.label || "Busca"}</span>
          <strong>Procurando adversario</strong>
        </div>
        <div class="matchmaking-search-grid">
          <span><strong>${matchmakingElapsedSeconds}s</strong><small>decorridos</small></span>
          <span><strong>~${matchmakingEstimateSeconds}s</strong><small>estimativa</small></span>
          <span><strong>${matchmakingRemaining || 0}s</strong><small>ate bot</small></span>
        </div>
        <div class="matchmaking-search-meter" aria-hidden="true"><span style="width:${matchmakingProgress}%"></span></div>
        <p>Primeiro tentamos parear com jogador real. Se a fila passar da estimativa, a partida entra com bot automaticamente.</p>
      </div>
    ` : "";

    document.getElementById("rank-card").innerHTML = `
      <span class="eyebrow">Divisao atual</span>
      <div class="rank-value">${rank.name}</div>
      <div class="stat-line">
        <span>${ctx.formatNumber(ctx.state.save.trophies)} pontos</span>
        <span>${ctx.state.save.rankedWins}V/${ctx.state.save.rankedLosses}D</span>
        <span>Online ${ctx.formatNumber(ctx.state.save.onlineTrophies || 0)}</span>
        <span>Sequencia ${streak}V</span>
        <span>${ctx.state.save.tournamentWins} torneio(s)</span>
      </div>
      <div class="rank-meter">
        <div class="progress"><span style="width:${ctx.clamp(progress, 0, 100)}%"></span></div>
      </div>
      <p class="evolution-note">${next ? `${next.name} em ${next.min} trofeus.` : "Topo da liga local."}</p>
    `;

    document.getElementById("ranked-summary").innerHTML = `
      ${matchmakingPanel}
      ${window.TazzoMenuShared.smallSummary("Custo do time", `${cost}/10`, legal ? "Ranqueada liberada" : "Ranqueada liberada por agora")}
      ${window.TazzoMenuShared.smallSummary("Forca do trio", power, `${chance}% de chance estimada`)}
      ${window.TazzoMenuShared.smallSummary("Oponente", rankedOpponent.name, `${rankedOpponent.team.map((id) => ctx.MONSTER_BY_ID[id].name).join(", ")} | Goleiro ${ctx.MONSTER_BY_ID[rankedOpponent.goalkeeper]?.name || "sorteado"}`)}
      ${window.TazzoMenuShared.smallSummary("Matchmaking", searching ? "Procurando" : matchmakingLabel, searching ? `${matchmakingElapsedSeconds}s de busca | estimativa ~${matchmakingEstimateSeconds}s` : "Se nao parear em 40s, vem bot")}
      ${window.TazzoMenuShared.smallSummary("Pontuacao", "+10 / -5", streak ? `Proximo bonus ate +${nextBonus}` : "2V seguidas ativam bonus")}
      ${window.TazzoMenuShared.smallSummary("Ultimo resultado", "Liga", latest)}
    `;

    const activeTournamentId = tournamentsAvailable
      ? ctx.activeTournamentBattle() ? ctx.state.battle.tournamentId : savedTournamentId
      : "";
    const activeRanked = ctx.activeRankedBattle() || savedRanked;
    const rankedButton = document.getElementById("ranked-button");
    rankedButton.disabled = searching || (!savedRanked && Boolean(activeTournamentId));
    rankedButton.textContent = searching
      ? `Procurando ${matchmakingElapsedSeconds}s/~${matchmakingEstimateSeconds}s`
      : savedRanked
      ? "Retomar ranqueada"
      : activeTournamentId
      ? "Finalize o torneio"
      : activeRanked
      ? "Ranqueada ativa"
      : "Disputar ranqueada";

    if (!tournamentsAvailable) {
      document.getElementById("tournament-list").innerHTML = `
        <article class="tournament-card is-active">
          <h3>Torneios indisponiveis</h3>
          <p>Por agora, a liga competitiva esta aberta apenas para ranqueadas.</p>
        </article>
      `;
      document.getElementById("leaderboard-list").innerHTML = renderLeaderboardRows(ctx, rank);
      return;
    }

    document.getElementById("tournament-list").innerHTML = ctx.TOURNAMENTS.map((tournament) => {
      const active = activeTournamentId === tournament.id;
      const disabled = searching || (activeTournamentId && !active) || activeRanked || (!active && (ctx.state.save.merreis < tournament.entry || !legal));
      const label = searching
        ? `Procurando ${matchmakingElapsedSeconds}s/~${matchmakingEstimateSeconds}s`
        : active
        ? ctx.activeTournamentBattle() ? "Voltar para batalha" : "Retomar torneio"
        : "Entrar e batalhar";
      const opponent = ctx.TOURNAMENT_OPPONENTS[tournament.id];
      return `
        <article class="tournament-card${active ? " is-active" : ""}">
          <h3>${tournament.name}</h3>
          <p>Entrada ${ctx.formatNumber(tournament.entry)} Merreis. Premio: ${tournament.prize}.</p>
          <div class="tournament-opponent">
            <span class="eyebrow">Oponente</span>
            <strong>${opponent.name}</strong>
            <span>${opponent.team.map((id) => ctx.MONSTER_BY_ID[id].name).join(", ")} | Goleiro ${ctx.MONSTER_BY_ID[opponent.goalkeeper]?.name || "sorteado"}</span>
          </div>
          <button type="button" data-tournament="${tournament.id}" ${disabled ? "disabled" : ""}>${label}</button>
        </article>
      `;
    }).join("");

    document.getElementById("leaderboard-list").innerHTML = renderLeaderboardRows(ctx, rank);
  }

  function fallbackLeaderboardRows(ctx) {
    return [
      ["Mestre Kiko", 2920, 148, 19, 12, 2710, 92, 15, 5, 146],
      ["Duda Holo", 2760, 136, 21, 9, 2635, 86, 18, 4, 143],
      ["Juninho Caps", 2595, 128, 24, 8, 2510, 79, 16, 6, 141],
      ["Bia do Recreio", 2440, 121, 22, 7, 2385, 74, 14, 7, 139],
      ["Tio Crocante", 2315, 115, 26, 7, 2260, 69, 18, 5, 137],
      ["Nina Lamina", 2190, 109, 25, 6, 2135, 66, 17, 4, 136],
      ["Gui Tampinha", 2075, 101, 24, 6, 2040, 61, 16, 6, 134],
      ["Lari Chuteira", 1960, 96, 23, 5, 1925, 57, 15, 5, 132],
      ["Pepe Album", 1850, 89, 22, 5, 1810, 52, 14, 6, 130],
      ["Madu Hologol", 1740, 84, 21, 4, 1715, 49, 13, 5, 128],
      ["Caio Caneta", 1650, 79, 20, 4, 1620, 45, 12, 5, 126],
      ["Tata Borda", 1565, 74, 19, 4, 1530, 42, 11, 6, 124],
      ["Lipe Snack", 1480, 70, 18, 3, 1450, 39, 10, 4, 122],
      ["Rafa Drible", 1395, 66, 18, 3, 1360, 36, 10, 5, 120],
      ["Pri Recheado", 1320, 62, 17, 3, 1285, 34, 9, 4, 118],
      ["Zeca Goleiro", 1245, 58, 16, 2, 1210, 31, 8, 4, 116],
      ["Sol Merreis", 1165, 54, 15, 2, 1130, 28, 8, 3, 114],
      ["Nando Tabelinha", 1080, 49, 14, 2, 1055, 25, 7, 4, 112],
      ["Bel Clash", 995, 44, 13, 1, 970, 22, 7, 3, 110],
      ["Ivo Colecao", 920, 40, 12, 1, 900, 20, 6, 3, 108]
    ].map((row, index) => {
      const [name, trophies, rankedWins, rankedLosses, tournamentWins, onlineTrophies, onlineWins, onlineLosses, onlineDraws, album] = row;
      return {
        playerId: `fictional-local-${index + 1}`,
        name,
        trophies,
        rank: ctx.currentRankForPoints ? ctx.currentRankForPoints(trophies).name : "Mestre dos Tazzos",
        rankedWins,
        rankedLosses,
        tournamentWins,
        onlineTrophies,
        onlineWins,
        onlineLosses,
        onlineDraws,
        album,
        albumTotal: ctx.MONSTERS.length,
        fictional: true
      };
    });
  }

  function renderLeaderboardRows(ctx, currentPlayerRank) {
    const serverRows = ctx.state.leaderboard.rows || [];
    const currentPlayerId = ctx.state.server.playerId;
    const currentName = ctx.state.server.profile?.name || "Voce";
    const visibleMonsters = ctx.visibleCollectionMonsters();
    const currentRow = {
      playerId: currentPlayerId || "local",
      name: currentName,
      trophies: ctx.state.save.trophies,
      rank: currentPlayerRank.name,
      rankedWins: ctx.state.save.rankedWins,
      rankedLosses: ctx.state.save.rankedLosses,
      tournamentWins: ctx.state.save.tournamentWins,
      onlineTrophies: ctx.state.save.onlineTrophies,
      onlineWins: ctx.state.save.onlineWins,
      onlineLosses: ctx.state.save.onlineLosses,
      onlineDraws: ctx.state.save.onlineDraws,
      album: visibleMonsters.filter((monster) => ctx.state.save.collection[monster.id] > 0).length,
      albumTotal: visibleMonsters.length
    };
    const rows = serverRows.length ? serverRows : fallbackLeaderboardRows(ctx);
    const hasCurrent = rows.some((row) => row.playerId && currentPlayerId && row.playerId === currentPlayerId);
    const withCurrent = hasCurrent ? rows : [...rows, currentRow];
    const sorted = [...withCurrent].sort((a, b) => (b.onlineTrophies || 0) - (a.onlineTrophies || 0) || b.trophies - a.trophies || (b.onlineWins || 0) - (a.onlineWins || 0) || (b.album || 0) - (a.album || 0));
    const visibleRows = sorted.slice(0, 20);
    const currentSortedRow = currentPlayerId
      ? sorted.find((row) => row.playerId === currentPlayerId)
      : null;
    if (currentSortedRow && !visibleRows.some((row) => row.playerId === currentPlayerId)) {
      visibleRows.push(currentSortedRow);
    }
    const statusRow = ctx.state.leaderboard.loading
      ? `<div class="small-row"><span class="chip">...</span><div><strong>Atualizando ranking</strong><span>Buscando jogadores online</span></div><span></span></div>`
      : ctx.state.leaderboard.error
      ? `<div class="small-row"><span class="chip">!</span><div><strong>Ranking local</strong><span>${ctx.state.leaderboard.error}</span></div><span></span></div>`
      : "";

    return `${statusRow}${visibleRows.map((row, index) => {
      const isCurrent = row.playerId && currentPlayerId && row.playerId === currentPlayerId;
      const onlineRecord = `${Number(row.onlineWins) || 0}V/${Number(row.onlineLosses) || 0}D/${Number(row.onlineDraws) || 0}E`;
      const meta = `Online ${ctx.formatNumber(row.onlineTrophies || 0)} pts ${onlineRecord} | Liga ${row.rank || "Tampinha"} | ${Number(row.tournamentWins) || 0} torneio(s)`;
      const album = row.albumTotal ? `${row.album}/${row.albumTotal}` : "";
      return `
        <div class="small-row${isCurrent ? " is-selected" : ""}">
          <span class="chip">#${index + 1}</span>
          <div>
            <strong>${row.name}${isCurrent ? " (voce)" : ""}</strong>
            <span>${meta}${album ? ` | Album ${album}` : ""}</span>
          </div>
          <span class="chip">${ctx.formatNumber(row.onlineTrophies || row.trophies || 0)}</span>
        </div>
      `;
    }).join("")}`;
  }

  window.TazzoMenuTournaments = Object.freeze({
    renderCompetitive,
    renderLeaderboardRows
  });
})();
