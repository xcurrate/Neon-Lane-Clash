gameOver() {
    state.isPlaying = false;
    
    const overlay = document.getElementById('game-over-overlay');
    overlay.classList.add('active');
    
    // FIXED: Clean score display
    const finalScoreEl = document.getElementById('final-score');
    finalScoreEl.innerHTML = state.score;

    // Update leaderboard loading state
    const leaderboardEl = document.getElementById('global-leaderboard');
    leaderboardEl.innerHTML = '<p class="leaderboard-loading">Memuat leaderboard...</p>';

    if (state.score > 0 && state.playerName) {
        submitScoreToGlobal(state.playerName, state.score);
    } else {
        fetchTopScores();
    }
}