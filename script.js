// Update all entities position + removal
function updateEntities(dt) {
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const e = state.entities[i];
        e.y += e.speed * dt;

        // Remove if out of screen (top or bottom)
        if (e.y < -50 || e.y > 900) {
            state.entities.splice(i, 1);
            continue;
        }

        // Enemy reaches player
        if (e instanceof Enemy && e.y > state.playerY - 20) {
            app.loseLife();
            state.entities.splice(i, 1);
        }
    }
}

// Call this in your game loop (app.update)
// updateEntities(dt);