const CONSTANTS = {
    HEX: {
        bg: '#0a0a0f',
        red: '#ff004d',
        blue: '#00a8ff',
        lime: '#00ff9d',
        yellow: '#fff200',
        purple: '#9b59b6',
        white: '#ffffff'
    },
    PLAYER_Y: 720,
    ENEMY_SPEED: 120,
    BULLET_SPEED: 450,
    SPAWN_INTERVAL: 1200
};

const state = {
    entities: [],
    score: 0,
    lives: 3,
    isPlaying: false,
    playerX: 200,
    playerY: CONSTANTS.PLAYER_Y,
    playerName: '',
    lastSpawn: 0,
    isBoost: false,
    boostEndTime: 0
};

// Entity Classes
class Entity {
    constructor(x, y, color = 'white') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = 0;
    }
}

class Enemy extends Entity {
    constructor(x, y, color) {
        super(x, y, color);
        this.speed = CONSTANTS.ENEMY_SPEED;
        this.width = 32;
        this.height = 32;
        this.mixed = false;
    }
}

class Bullet extends Entity {
    constructor(x, y, color) {
        super(x, y, color);
        this.speed = CONSTANTS.BULLET_SPEED;
    }
}

class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 'gold');
        this.speed = 80;
    }
}

// Core Functions
window.app = {
    canvas: null,
    ctx: null,
    lastTime: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        state.playerX = this.canvas.width / 2;
        
        this.setupControls();
        this.startGame();
    },

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    },

    setupControls() {
        const buttons = document.querySelectorAll('.ctrl-btn');
        buttons.forEach(btn => {
            const color = btn.dataset.color;
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.shoot(color);
            });
            
            btn.addEventListener('mousedown', () => {
                this.shoot(color);
            });
        });
    },

    startGame() {
        state.isPlaying = true;
        state.score = 0;
        state.lives = 3;
        state.entities = [];
        state.lastSpawn = Date.now();
        
        // Initial enemies
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy();
        }
        
        this.gameLoop();
    },

    shoot(color) {
        if (!state.isPlaying) return;
        
        const bullet = new Bullet(state.playerX, state.playerY - 30, color);
        state.entities.push(bullet);
    },

    spawnEnemy() {
        const colors = ['red', 'blue', 'lime', 'yellow'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const x = Math.random() * (this.canvas.width - 60) + 30;
        const enemy = new Enemy(x, -40, color);
        state.entities.push(enemy);
    },

    gameLoop(timestamp = 0) {
        if (!state.isPlaying) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    },

    update(dt) {
        // Spawn enemies
        if (Date.now() - state.lastSpawn > CONSTANTS.SPAWN_INTERVAL) {
            this.spawnEnemy();
            state.lastSpawn = Date.now();
        }

        // Update entities
        updateEntities(dt);
        
        // Check collisions
        checkCollisions();

        // Update UI
        this.updateUI();
    },

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = CONSTANTS.HEX.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw player
        ctx.shadowColor = CONSTANTS.HEX.white;
        ctx.shadowBlur = 20;
        ctx.fillStyle = CONSTANTS.HEX.white;
        ctx.beginPath();
        ctx.arc(state.playerX, state.playerY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw entities
        state.entities.forEach(entity => {
            ctx.shadowBlur = 15;
            
            if (entity instanceof Enemy) {
                ctx.fillStyle = CONSTANTS.HEX[entity.color] || CONSTANTS.HEX.white;
                ctx.fillRect(entity.x - 16, entity.y - 16, 32, 32);
            } 
            else if (entity instanceof Bullet) {
                ctx.fillStyle = CONSTANTS.HEX[entity.color] || CONSTANTS.HEX.white;
                ctx.beginPath();
                ctx.arc(entity.x, entity.y, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            else if (entity instanceof Coin) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('🪙', entity.x, entity.y);
            }
            
            ctx.shadowBlur = 0;
        });
    },

    updateUI() {
        document.getElementById('score-display').textContent = state.score;
        document.getElementById('lives-display').innerHTML = '❤️'.repeat(state.lives);
        
        const highScore = localStorage.getItem('highScore') || 0;
        document.getElementById('highscore-display').textContent = highScore;
    },

    loseLife() {
        state.lives--;
        if (state.lives <= 0) {
            this.gameOver();
        }
    },

    gameOver() {
        state.isPlaying = false;
        const overlay = document.getElementById('game-over-overlay');
        overlay.classList.add('active');
        
        document.getElementById('final-score').innerHTML = state.score;
    }
};

// Helper functions from previous fixes
window.updateEntities = function(dt) {
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const e = state.entities[i];
        if (!e.speed) e.speed = 100;
        e.y += e.speed * dt;

        if (e.y > 900) {
            if (e instanceof Enemy) app.loseLife();
            state.entities.splice(i, 1);
        }
    }
};

window.checkCollisions = function() {
    // Basic collision - can be expanded
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const entity = state.entities[i];
        if (entity instanceof Bullet) {
            for (let j = state.entities.length - 1; j >= 0; j--) {
                const target = state.entities[j];
                if (target instanceof Enemy) {
                    const dx = entity.x - target.x;
                    const dy = entity.y - target.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 30) {
                        // Simple collision handling
                        state.entities.splice(j, 1);
                        const bIdx = state.entities.indexOf(entity);
                        if (bIdx > -1) state.entities.splice(bIdx, 1);
                        state.score += 10;
                        break;
                    }
                }
            }
        }
    }
};

// Start the game when page loads
window.onload = () => {
    if (typeof app !== 'undefined') {
        app.init();
    }
};