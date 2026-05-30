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
    const matchmakingElapsed = searching ? Math.max(0, Date.now() - (Number(ctx.state.matchmaking.startedAt) || Date.now())) : 0;
    const matchmakingRemaining = searching ? Math.max(0, Math.ceil((ctx.COMPETITIVE_MATCHMAKING_TIMEOUT_MS - matchmakingElapsed) / 1000)) : 0;
    const matchmakingLabel = searching
      ? matchmakingRemaining
        ? `Bot em ${matchmakingRemaining}s`
        : "Chamando bot"
      : "Fila real";

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
      ${window.TazzoMenuShared.smallSummary("Custo competitivo", `${cost}/10`, legal ? "Time valido" : "Ajuste o time na colecao")}
      ${window.TazzoMenuShared.smallSummary("Forca do trio", power, `${chance}% de chance estimada`)}
      ${window.TazzoMenuShared.smallSummary("Oponente", rankedOpponent.name, `${rankedOpponent.team.map((id) => ctx.MONSTER_BY_ID[id].name).join(", ")} | Goleiro ${ctx.MONSTER_BY_ID[rankedOpponent.goalkeeper]?.name || "sorteado"}`)}
      ${window.TazzoMenuShared.smallSummary("Matchmaking", searching ? "Procurando" : matchmakingLabel, searching ? `${ctx.state.matchmaking.label || "Partida"}: ${matchmakingLabel}` : "Se nao parear em 40s, vem bot")}
      ${window.TazzoMenuShared.smallSummary("Pontuacao", "+10 / -5", streak ? `Proximo bonus ate +${nextBonus}` : "2V seguidas ativam bonus")}
      ${window.TazzoMenuShared.smallSummary("Ultimo resultado", "Liga", latest)}
    `;

    const activeTournamentId = ctx.activeTournamentBattle() ? ctx.state.battle.tournamentId : savedTournamentId;
    const activeRanked = ctx.activeRankedBattle() || savedRanked;
    const rankedButton = document.getElementById("ranked-button");
    rankedButton.disabled = searching || (!savedRanked && (!legal || Boolean(activeTournamentId)));
    rankedButton.textContent = searching
      ? `Procurando partida (${matchmakingLabel})`
      : savedRanked
      ? "Retomar ranqueada"
      : activeTournamentId
      ? "Finalize o torneio"
      : activeRanked
      ? "Ranqueada ativa"
      : "Disputar ranqueada";

    document.getElementById("tournament-list").innerHTML = ctx.TOURNAMENTS.map((tournament) => {
      const active = activeTournamentId === tournament.id;
      const disabled = searching || (activeTournamentId && !active) || activeRanked || (!active && (ctx.state.save.merreis < tournament.entry || !legal));
      const label = searching
        ? `Procurando (${matchmakingLabel})`
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
    const rows = serverRows.length
      ? serverRows
      : [
        { name: "Nina Holo", trophies: 1180, rank: "Lendario", rankedWins: 12, rankedLosses: 3, tournamentWins: 4 },
        { name: "Tio Croc", trophies: 910, rank: "Lendario", rankedWins: 9, rankedLosses: 4, tournamentWins: 2 },
        { name: "Bia Caps", trophies: 640, rank: "Holografico", rankedWins: 7, rankedLosses: 5, tournamentWins: 1 },
        currentRow,
        { name: "Lipe Snack", trophies: 350, rank: "Crocante", rankedWins: 4, rankedLosses: 4, tournamentWins: 0 },
        { name: "Madu Tazo", trophies: 210, rank: "Recreio", rankedWins: 2, rankedLosses: 2, tournamentWins: 0 }
      ];
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
