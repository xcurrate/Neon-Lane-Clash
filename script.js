// Updated collision with Mixed Mechanic
window.checkCollisions = function() {
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const entity = state.entities[i];

        if (entity instanceof Bullet) {
            for (let j = state.entities.length - 1; j >= 0; j--) {
                const enemy = state.entities[j];

                if (enemy instanceof Enemy) {
                    const dx = entity.x - enemy.x;
                    const dy = entity.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 28) { // collision radius
                        
                        if (entity.color === enemy.color && !enemy.isMixed) {
                            // Correct color - instant destroy
                            state.entities.splice(j, 1);
                            const bIdx = state.entities.indexOf(entity);
                            if (bIdx > -1) state.entities.splice(bIdx, 1);
                            state.score += 10;
                            break;
                        } 
                        else {
                            // Wrong color or already mixed
                            if (!enemy.isMixed) {
                                enemy.isMixed = true;
                                enemy.color = 'purple'; // visual mixed state
                                enemy.hits = 1;
                            } else {
                                enemy.hits = (enemy.hits || 0) + 1;
                            }

                            // Remove bullet
                            const bIdx = state.entities.indexOf(entity);
                            if (bIdx > -1) state.entities.splice(bIdx, 1);

                            // Check if mixed enemy should be destroyed
                            if (enemy.hits >= 3) {
                                state.entities.splice(j, 1);
                                state.score += 5; // lower score for mixed kills
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
};

// Make sure Enemy class supports mixed state
// (Add this if not already present in your Enemy class)
// this.isMixed = false;
// this.hits = 0;