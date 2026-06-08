// Improved collision detection
function checkCollisions() {
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const entity = state.entities[i];
        
        if (entity instanceof Bullet) {
            for (let j = state.entities.length - 1; j >= 0; j--) {
                const target = state.entities[j];
                
                if (target instanceof Enemy) {
                    // Better collision: distance between centers
                    const dx = entity.x - target.x;
                    const dy = entity.y - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Approximate collision radius
                    const bulletRadius = 8;
                    const enemySize = 28;
                    
                    if (distance < bulletRadius + enemySize) {
                        handleBulletEnemyCollision(entity, target, i, j);
                        break; // Bullet can only hit one enemy
                    }
                }
            }
        }
        
        // Coin collection
        if (entity instanceof Coin) {
            const dx = entity.x - state.playerX;
            const dy = entity.y - state.playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 35) {
                state.score += 50;
                app.addScore(50, entity.x, entity.y);
                state.entities.splice(i, 1);
            }
        }
    }
}

function handleBulletEnemyCollision(bullet, enemy, bulletIndex, enemyIndex) {
    const isMatch = bullet.color === enemy.color;
    
    if (isMatch) {
        // Correct color - destroy enemy
        state.score += state.isBoost ? 15 : 5;
        app.addScore(state.isBoost ? 15 : 5, enemy.x, enemy.y);
        state.entities.splice(enemyIndex, 1);
        
        // Remove bullet
        const bIdx = state.entities.indexOf(bullet);
        if (bIdx > -1) state.entities.splice(bIdx, 1);
    } else {
        // Wrong color - mix or damage
        if (!enemy.mixed) {
            enemy.color = 'purple'; // or use MIX_MAP
            enemy.mixed = true;
        } else {
            // Already mixed, damage player
            app.loseLife();
            const bIdx = state.entities.indexOf(bullet);
            if (bIdx > -1) state.entities.splice(bIdx, 1);
        }
    }
}