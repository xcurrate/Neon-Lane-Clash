    

        /**
         * NEON LANE CLASH - Game Engine
         * Vanilla JS, Object-Based State, RequestAnimationFrame
         */

async function fetchTopScores() {
    const container = document.getElementById('global-leaderboard');
    if (!container) return;

    try {
        // PERHATIKAN: Kita tambahkan ?type=${currentTab} di ujung URL
        const response = await fetch(`/api/get-scores?type=${currentTab}`);
        const data = await response.json();

        if (data && data.length > 0) {
            let listHtml = "<h3 style='color:var(--c-yellow); font-size:14px; margin:10px 0;'>TOP 5 " + currentTab.toUpperCase() + "</h3>";
            data.forEach((entry, index) => {
                listHtml += `<p style='margin:2px 0; font-size:13px;'>${index + 1}. ${entry.name.toUpperCase()} - ${entry.score}</p>`;
            });
            container.innerHTML = listHtml;
        } else {
            container.innerHTML = "<h3 style='color:var(--c-yellow); font-size:14px; margin:10px 0;'>TOP 5 " + currentTab.toUpperCase() + "</h3><p style='font-size:12px; opacity:0.6;'>Belum ada skor untuk periode ini.</p>";
        }
    } catch (err) {
        console.error("Gagal ambil data:", err);
        container.innerHTML = "<p style='color:red;'>Gagal memuat.</p>";
    }
}


// Ganti fungsi kirim skor
async function submitScoreToGlobal(name, score) {
    try {
        await fetch('/api/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });
        fetchTopScores();
    } catch (err) {
        console.error("Gagal kirim skor:", err);
    }
}




        
        



        const CONSTANTS = {
            COLORS: {
                RED: 'red',
                BLUE: 'blue',
                LIME: 'lime', // Base Green
                YELLOW: 'yellow',
                PURPLE: 'purple',
                ORANGE: 'orange',
                GREEN: 'green' // Mixed Green
            },
            HEX: {
                'red': '#ff004d',
                'blue': '#00a8ff',
                'lime': '#00ff00',
                'yellow': '#fff200',
                'purple': '#9b59b6',
                'orange': '#e67e22',
                'green': '#2ecc71',
                'coin': '#ffd700',
                'bg': '#000000' // Updated to match CSS
            },
            SPEED: {
                ENEMY_BASE: 200, // pixels per second
                BOOST_VAL: 300,
                BULLET: 800
            },
            BOOST_DURATION: 5000, // 5 seconds
            BOOST_INTERVAL: 50, // Every 50 score
            SPAWN_RATE: 1.2, // seconds
            COIN_CHANCE: 0.0005, // 0.05% per frame logic
            LANE_WIDTH: 60 // Virtual width of the lane entity
        };

const MIX_MAP = {

    'red+blue': 'purple',
    'blue+red': 'purple',

    'red+yellow': 'purple',
    'yellow+red': 'purple',

    'blue+yellow': 'purple',
    'yellow+blue': 'purple',

    'red+green': 'purple',
    'green+red': 'purple',

    'blue+orange': 'purple',
    'orange+blue': 'purple',

    'yellow+purple': 'purple',
    'purple+yellow': 'purple',

    'orange+red': 'purple',
    'red+orange': 'purple',

    'purple+blue': 'purple',
    'blue+purple': 'purple',

  
    'lime+yellow': 'purple',
    'yellow+lime': 'purple',

    'lime+red': 'purple',
    'red+lime': 'purple',

    'lime+blue': 'purple',
    'blue+lime': 'purple',

    'lime+green': 'purple',
    'green+lime': 'purple',

    'lime+orange': 'purple',
    'orange+lime': 'purple',

    'lime+purple': 'purple',
    'purple+lime': 'purple'
};

        // --- GAME STATE ---
        const state = {
            score: 0,
            lives: 3,
            highScore: parseInt(localStorage.getItem('neon_clash_highscore')) || 0,
            mode: 'NORMAL', // NORMAL, BOOST
            isPlaying: true,
            lastTime: 0,
            spawnTimer: 0,
            boostTarget: 50,
            boostTimer: 0,
            nextLifeTarget: 150,
            gameTime: 0,
            firstBoostTriggered: false,
            entities: [], // Enemies, Bullets, Coins, Particles, FloatingText
            playerName: localStorage.getItem('neon_clash_name') || '',
            width: 0,
            height: 0,
            laneX: 0
        };

        // --- ENTITY CLASSES ---

        class Entity {
            constructor(type, x, y, color) {
                this.id = Math.random().toString(36).substr(2, 9);
                this.type = type; // 'enemy', 'bullet', 'player', 'coin', 'text', 'particle'
                this.x = x;
                this.y = y;
                this.color = color;
                this.width = 40;
                this.height = 40;
                this.vy = 0;
                this.toRemove = false;
                this.mixed = false;
                this.visualScale = 1;
            }

            update(dt) {
                this.y += this.vy * dt;
            }
        }

        class Enemy extends Entity {
            constructor(x, y, color, speed) {
                super('enemy', x, y, color);
                this.vy = speed;
                this.height = 40; // Neon bar height
            }
        }

        class Bullet extends Entity {
            constructor(x, y, color) {
                super('bullet', x, y, color);
                this.vy = -CONSTANTS.SPEED.BULLET;
                this.width = 20;
                this.height = 20;
            }
        }

        class Coin extends Entity {
            constructor(x, y) {
                super('coin', x, y, 'gold');
                this.vy = CONSTANTS.SPEED.ENEMY_BASE * 0.8; // Move slightly slower/different
                this.text = '💰';
            }
        }

        class FloatingText extends Entity {
            constructor(x, y, text, color) {
                super('text', x, y, color);
                this.text = text;
                this.vy = -50; // Float up
                this.life = 1.0; // Seconds
                this.alpha = 1;
            }
            update(dt) {
                super.update(dt);
                this.life -= dt;
                this.alpha = this.life;
                if(this.life <= 0) this.toRemove = true;
            }
        }

        // --- ENGINE ---

        const app = {
            canvas: null,
            ctx: null,

            init() {
            
    // Cek apakah nama pemain sudah tersimpan
this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupControls();

    // Munculkan skor di awal
    document.getElementById('highscore-display').innerText = state.highScore;

    // --- LOGIKA CEK NAMA ---
    if (!state.playerName) {
        state.isPlaying = false; // Pause game
        document.getElementById('name-overlay').classList.add('active');
    }
    
                // Start Loop
                requestAnimationFrame(t => this.loop(t));
            },

            resize() {
                const container = document.getElementById('game-container');
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
                state.width = this.canvas.width;
                state.height = this.canvas.height;
                state.laneX = state.width / 2;
            },

            setupControls() {
                const buttons = document.querySelectorAll('.ctrl-btn');
                buttons.forEach(btn => {
                    // Touch start for zero lag on mobile
                    btn.addEventListener('touchstart', (e) => {
                        e.preventDefault(); // Prevent ghost clicks
                        this.shoot(btn.dataset.color);
                    }, { passive: false });
                    
                    // Fallback for desktop testing
                    btn.addEventListener('mousedown', (e) => {
                        this.shoot(btn.dataset.color);
                    });
                });
            },

            shoot(color) {
                if (!state.isPlaying) return;
                // Spawn bullet at player position
                const b = new Bullet(state.laneX, state.height - 80, color);
                state.entities.push(b);
            },

            spawnEnemy() {
                const colors = [CONSTANTS.COLORS.RED, CONSTANTS.COLORS.BLUE, CONSTANTS.COLORS.LIME, CONSTANTS.COLORS.YELLOW];
                const randColor = colors[Math.floor(Math.random() * colors.length)];
                
                const speed = state.mode === 'BOOST' ? CONSTANTS.SPEED.BOOST_VAL : CONSTANTS.SPEED.ENEMY_BASE;
                
                const e = new Enemy(state.laneX, -50, randColor, speed);
                state.entities.push(e);
            },

            spawnCoin() {
                const c = new Coin(state.laneX, -50);
                state.entities.push(c);
            },

            // --- MAIN LOOP ---
            loop(timestamp) {
                if (!state.lastTime) state.lastTime = timestamp;
                const dt = (timestamp - state.lastTime) / 1000;
                state.lastTime = timestamp;

                if (state.isPlaying) {
                    this.update(dt);
                    this.draw();
                }

                requestAnimationFrame(t => this.loop(t));
            },

            update(dt) {
                // 1. Boost Logic
    if (!state.isPlaying) return;

    state.gameTime += dt;

    if (!state.firstBoostTriggered) {
        // Update tampilan detik setiap frame agar terlihat menghitung mundur
        this.ui.updateMode(); 
        
        if (state.gameTime >= 5) {
            state.firstBoostTriggered = true;
            this.triggerBoost();
        }
    }
    
                if (state.mode === 'BOOST') {
                    state.boostTimer -= dt * 1000;
                    if (state.boostTimer <= 0) {
                        state.mode = 'NORMAL';
                        this.ui.updateMode();
                    }
                }

                // 2. Spawning
                state.spawnTimer -= dt;
                if (state.spawnTimer <= 0) {
                    this.spawnEnemy();
                    // Adjust spawn rate based on mode
                    state.spawnTimer = state.mode === 'BOOST' ? 0.6 : CONSTANTS.SPAWN_RATE;
                }

                // Coin Random Spawn
                if (Math.random() < CONSTANTS.COIN_CHANCE) {
                    this.spawnCoin();
                }

                // 3. Entity Updates & Collision
                // Get Player Rect (Virtual)
                const playerY = state.height - 60;
                const playerRadius = 30;

                state.entities.forEach(ent => {
                    ent.update(dt);

                    // A. Out of bounds (Top/Bottom)
                    if (ent.y > state.height + 50 || (ent.type === 'bullet' && ent.y < -50)) {
                        ent.toRemove = true;
                    }

                    // B. Bullet vs Enemy Collision
                    if (ent.type === 'bullet') {
                        const target = state.entities.find(e => 
                            e.type === 'enemy' && 
                            !e.toRemove &&
                            Math.abs(e.y - ent.y) < (e.height + ent.height)/1.5 // Simple 1D collision
                        );

                        if (target) {
                            ent.toRemove = true; // Bullet always gone
                            
                            if (target.color === ent.color) {
                                // MATCH: Destroy
                                target.toRemove = true;
                                this.addScore(state.mode === 'BOOST' ? 15 : 5, target.x, target.y);
                            } else {
                                // MISMATCH: Try Mix
                                const key = `${target.color}+${ent.color}`;
                                const newColor = MIX_MAP[key];

                                if (newColor && !target.mixed) {
                                    target.color = newColor;
                                    target.mixed = true;
                                }
                            }
                        }
                        
                        // Bullet vs Coin
                        const coin = state.entities.find(e => 
                            e.type === 'coin' && !e.toRemove &&
                            Math.abs(e.y - ent.y) < 40
                        );
                        if (coin) {
                            ent.toRemove = true;
                            coin.toRemove = true;
                            this.addScore(50, coin.x, coin.y);
                        }
                    }

                    // C. Enemy/Coin vs Player Collision
                    if ((ent.type === 'enemy' || ent.type === 'coin') && !ent.toRemove) {
                        const dy = ent.y - playerY;
                        const dist = Math.abs(dy);

                        if (dist < 30) { // Hit Player
                            ent.toRemove = true;

                            if (ent.type === 'coin') {
                                this.addScore(50, ent.x, ent.y);
                            } else if (ent.type === 'enemy') {
                                if (ent.mixed) {
                                    this.loseLife();
                                    this.addScore(-10, ent.x, ent.y, true);
                                } else {
                                    this.loseLife();
                                }
                            }
                        }
                    }
                });

                // Cleanup
                state.entities = state.entities.filter(e => !e.toRemove);
            },

 addScore(val, x, y, isBad = false) {
    state.score += val;
    this.ui.spawnFloatingText(val > 0 ? `+${val}` : `${val}`, x, y, isBad ? 'red' : 'white');

    // CEK HIGH SCORE
    if (state.score > state.highScore) {
        state.highScore = state.score;
        // Simpan ke memori browser secara permanen
        localStorage.setItem('neon_clash_highscore', state.highScore);
    }
    // -----------------------------
    if (state.score >= state.nextLifeTarget) {
        state.nextLifeTarget += 150; // Target tetap naik setiap 150 poin

        if (state.lives < 3) { 
            // Hanya tambah nyawa jika nyawa saat ini kurang dari 3
            state.lives++;
            this.ui.updateLives();
            this.ui.spawnFloatingText("EXTRA LIFE!", state.laneX, state.height/2, 'lime');
        } else {
            // Jika nyawa sudah 3, berikan bonus skor tambahan sebagai ganti nyawa
            // agar pemain tidak merasa rugi mencapai target 1000 poin
            state.score += 100; 
            this.ui.spawnFloatingText("MAX LIVES! +100", state.laneX, state.height/2, 'cyan');
        }
    }
    if (state.score >= state.boostTarget) {
        if (state.mode === 'BOOST') {
            // JIKA sedang BOOST dan skor mencapai target:
            // Tambah target skor +50 agar tidak langsung boost lagi setelah selesai
            state.boostTarget += 50;
            this.ui.spawnFloatingText("BOOST EXTENDED TARGET +50", state.laneX, state.height/3, 'orange');
        } else {
            // JIKA sedang NORMAL: Jalankan boost seperti biasa
            this.triggerBoost();
        }
    }
    this.ui.updateScore();
},

            loseLife() {
                state.lives--;
                this.ui.updateLives();
                if (state.lives <= 0) {
                    this.gameOver();
                }
            },

            triggerBoost() {
                state.mode = 'BOOST';
                state.boostTarget += CONSTANTS.BOOST_INTERVAL;
                state.boostTimer = CONSTANTS.BOOST_DURATION;
                this.ui.updateMode();
                state.entities.forEach(e => {
                    if(e.type === 'enemy') e.vy = CONSTANTS.SPEED.BOOST_VAL;
                });
            },

            gameOver() {
state.isPlaying = false;
    
    // Tampilkan overlay
    document.getElementById('game-over-overlay').classList.add('active');
    
    // Tampilkan skor pemain
    const finalScoreEl = document.getElementById('final-score');
    finalScoreEl.innerHTML = `${state.playerName}skor kamu: ${state.score}`;

    // Jalankan pengiriman skor dan ambil data terbaru
    if (state.score > 0) {
        submitScoreToGlobal(state.playerName, state.score);
    } else {
        fetchTopScores(); // Jika skor 0, langsung tampilkan list
    }
    
    document.getElementById('game-over-overlay').classList.add('active');
            },

            draw() {
                const ctx = this.ctx;
                const W = state.width;
                const H = state.height;

                // Clear with BG color
                ctx.fillStyle = CONSTANTS.HEX['bg'];
                ctx.fillRect(0, 0, W, H);
                
                // Draw Lane
                ctx.strokeStyle = 'rgba(255,255,255,0.05)'; // Subtler lane
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(state.laneX, 0);
                ctx.lineTo(state.laneX, H);
                ctx.stroke();

                // Draw Player
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 20; // Stronger player glow
                ctx.beginPath();
                ctx.arc(state.laneX, H - 60, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset

                // Draw Entities
                state.entities.forEach(ent => {
                    if (ent.type === 'enemy') {
                        const colorHex = CONSTANTS.HEX[ent.color];
                        
                        // Neon Glow
                        ctx.shadowColor = colorHex;
                        ctx.shadowBlur = 25; // Stronger enemy glow
                        ctx.fillStyle = colorHex;
                        
                        // Draw Rect
                        const w = ent.width;
                        const h = ent.height;
                        ctx.fillRect(ent.x - w/2, ent.y - h/2, w, h);
                        
                        // White Core (Brighter)
                        ctx.fillStyle = 'rgba(255,255,255,0.8)';
                        ctx.fillRect(ent.x - w/4, ent.y - h/4, w/2, h/2);

                        ctx.shadowBlur = 0;
                    } else if (ent.type === 'bullet') {
                        const colorHex = CONSTANTS.HEX[ent.color];
                        ctx.fillStyle = colorHex;
                        ctx.shadowColor = colorHex;
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.arc(ent.x, ent.y, 10, 0, Math.PI*2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    } else if (ent.type === 'coin') {
                        ctx.font = "30px Arial";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("💰", ent.x, ent.y);
                    } else if (ent.type === 'text') {
                        ctx.font = "bold 24px monospace";
                        ctx.fillStyle = ent.color === 'red' ? '#ff004d' : '#ffffff';
                        ctx.shadowColor = ctx.fillStyle;
                        ctx.shadowBlur = 5;
                        ctx.globalAlpha = ent.alpha;
                        ctx.textAlign = "center";
                        ctx.fillText(ent.text, ent.x, ent.y);
                        ctx.globalAlpha = 1.0;
                        ctx.shadowBlur = 0;
                    }
                });
            },

            ui: {
                toggleOverlay(id) {
                    const el = document.getElementById(id + '-overlay');
                    if (el.style.display === 'flex') {
                        el.style.display = 'none';
                        state.isPlaying = state.lives > 0;
                        if(state.isPlaying) state.lastTime = performance.now();
                    } else {
                        el.style.display = 'flex';
                        state.isPlaying = false;
                    }
                },
                updateScore() {
                    document.getElementById('score-display').innerText = state.score;
                    document.getElementById('highscore-display').innerText = state.highScore;
        
                    this.updateMode();
                },
                updateLives() {
                    let hearts = "";
                    for(let i=0; i<state.lives; i++) hearts += "❤";
                    document.getElementById('lives-display').innerText = hearts;
                },
                
                saveName() {
        const input = document.getElementById('player-name-input');
        const name = input.value.trim();
        
        if (name.length >= 2) {
            state.playerName = name;
            localStorage.setItem('neon_clash_name', name);
            document.getElementById('name-overlay').classList.remove('active');
            state.isPlaying = true; // Jalankan game
            state.lastTime = performance.now();
        } else {
            alert("Nama minimal 2 karakter!");
        }
    },
    
updateMode() {
    const modeEl = document.getElementById('mode-display');
    const nextEl = document.getElementById('next-display');
    
    modeEl.innerText = state.mode;
    
    if (state.mode === 'BOOST') {
        modeEl.classList.add('boost');
        const secondsLeft = Math.ceil(state.boostTimer / 1000);
        nextEl.innerText = `Ends: ${secondsLeft}s`;
        nextEl.style.color = 'var(--c-yellow)';
    } else {
        modeEl.classList.remove('boost');
        
        // JIKA sedang menuju Boost pertama (detik ke-5)
        if (!state.firstBoostTriggered) {
            const timeLeft = Math.max(0, Math.ceil(5 - state.gameTime));
            nextEl.innerText = `Start: ${timeLeft}s`;
            nextEl.style.color = 'var(--c-blue)';
        } else {
            // SETELAH Boost pertama, kembali tunjukkan target skor
            nextEl.innerText = `Next: ${state.boostTarget}`;
            nextEl.style.color = '#fff';
        }
    }
},
                spawnFloatingText(text, x, y, color) {
                    state.entities.push(new FloatingText(x, y, text, color));
                }
            }
        };

        // --- BOOTSTRAP ---
        window.onload = () => app.init();
        
        // Baris ini hanya untuk ngetes koneksi saat halaman dibuka
// Jika berhasil, tulisan "Loading" akan langsung berubah
setTimeout(() => {
    console.log("Testing koneksi database...");
    fetchTopScores();
}, 2000);

// Variabel untuk menyimpan filter yang sedang aktif (default: all)
let currentTab = 'all';

// Fungsi untuk mengganti tab dan memperbarui tampilan tombol
async function changeTab(tabType) {
    currentTab = tabType;

    // 1. Hapus kelas 'active' dari semua tombol tab agar lampunya mati
    document.querySelectorAll('.leaderboard-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });

    // 2. Tambahkan kelas 'active' ke tombol yang baru saja diklik agar menyala
    const activeBtn = document.getElementById(`btn-${tabType}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // 3. Panggil ulang data dari database sesuai filter (daily/weekly/all)
    fetchTopScores();
}
