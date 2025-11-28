import { Player } from './Player.js';
import { World } from './World.js';
import { Particles } from './Particles.js';
import { SoundManager } from './Audio.js';

export class Engine {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onGameOver, onScoreUpdate }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.player = new Player(this.canvas);
        this.world = new World(this.canvas);
        this.particles = new Particles();
        this.audio = new SoundManager();

        this.lastTime = 0;
        this.isRunning = false;
        this.score = 0;
        this.shake = 0;

        // Initialize audio on first interaction
        const startAudio = () => {
            this.audio.init();
            window.removeEventListener('click', startAudio);
            window.removeEventListener('touchstart', startAudio);
        };
        window.addEventListener('click', startAudio);
        window.addEventListener('touchstart', startAudio);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    stop() {
        this.isRunning = false;
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        this.player.update(deltaTime);
        this.world.update(deltaTime);
        this.particles.update(deltaTime);

        // Shake decay
        if (this.shake > 0) {
            this.shake -= 30 * deltaTime;
            if (this.shake < 0) this.shake = 0;
        }

        // Magnet Effect
        if (this.player.magnetActive) {
            this.world.collectibles.forEach(col => {
                const dx = this.player.x - col.x;
                const dy = this.player.y - col.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    col.x += (dx / dist) * 500 * deltaTime;
                    col.y += (dy / dist) * 500 * deltaTime;
                }
            });
        }

        // Collision Detection
        // 1. Player vs Collectibles
        this.world.collectibles.forEach(col => {
            if (col.collected) return;
            const dx = this.player.x - col.x;
            const dy = this.player.y - col.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + col.radius) {
                col.collected = true;
                this.score += 10;
                this.callbacks.onScoreUpdate(this.score);
                this.particles.spawn(col.x, col.y, '#00ff00', 15);
                this.shake = 5; // Small shake on collect
                this.audio.playCollect();
            }
        });

        // 2. Player vs Powerups
        this.world.powerups.forEach(p => {
            if (p.collected) return;
            const dx = this.player.x - p.x;
            const dy = this.player.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + p.radius) {
                p.collected = true;
                if (p.type === 'shield') {
                    this.player.shieldActive = true;
                    this.player.shieldTimer = 5; // 5 seconds
                } else if (p.type === 'magnet') {
                    this.player.magnetActive = true;
                    this.player.magnetTimer = 5;
                }
                this.particles.spawn(p.x, p.y, '#ffffff', 20);
                this.audio.playPowerup();
            }
        });

        // 3. Player vs Obstacles
        for (const obs of this.world.obstacles) {
            // Simple AABB vs Circle check (approximated as Circle vs Rectangle)
            // Find closest point on rect to circle center
            const closestX = Math.max(obs.x - obs.width / 2, Math.min(this.player.x, obs.x + obs.width / 2));
            const closestY = Math.max(obs.y - obs.height / 2, Math.min(this.player.y, obs.y + obs.height / 2));

            const dx = this.player.x - closestX;
            const dy = this.player.y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq < this.player.radius * this.player.radius) {
                if (this.player.shieldActive) {
                    this.player.shieldActive = false;
                    this.particles.spawn(this.player.x, this.player.y, '#00ffff', 30);
                    this.shake = 10;
                    // Remove obstacle effectively by moving it off screen
                    obs.y = 10000;
                    this.audio.playExplosion(); // Shield break sound
                } else {
                    this.shake = 20; // Big shake on death
                    this.audio.playExplosion();
                    this.gameOver();
                    return;
                }
            }
        }
    }

    draw() {
        this.ctx.save();
        if (this.shake > 0) {
            const dx = (Math.random() - 0.5) * this.shake;
            const dy = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(dx, dy);
        }

        // Clear screen with trail effect for "speed" feel
        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.world.draw(this.ctx);
        this.particles.draw(this.ctx);
        this.player.draw(this.ctx);

        this.ctx.restore();
    }

    gameOver() {
        this.isRunning = false;
        this.particles.spawn(this.player.x, this.player.y, '#ff0000', 50);
        this.draw(); // Draw one last frame with explosion
        setTimeout(() => {
            this.callbacks.onGameOver(this.score);
        }, 500);
    }
}
