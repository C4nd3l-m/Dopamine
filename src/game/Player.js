export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height - 150;
        this.targetX = this.x;
        this.radius = 18; // Larger for mobile
        this.color = '#00ffff';
        this.trail = [];

        // Velocity
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.9;

        // Powerups
        this.shieldActive = false;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.shieldTimer = 0;

        this.initInput();
    }

    initInput() {
        const onMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            this.targetX = clientX;
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
    }

    update(deltaTime) {
        // Smooth movement
        this.x += (this.targetX - this.x) * 15 * deltaTime;

        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Boundaries
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx = 0;
        }
        if (this.x > this.canvas.width - this.radius) {
            this.x = this.canvas.width - this.radius;
            this.vx = 0;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy = 0;
        }
        if (this.y > this.canvas.height - this.radius) {
            this.y = this.canvas.height - this.radius;
            this.vy = 0;
        }

        // Powerup Timers
        if (this.magnetActive) {
            this.magnetTimer -= deltaTime;
            if (this.magnetTimer <= 0) this.magnetActive = false;
        }
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }

        // Trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
        if (this.trail.length > 10) this.trail.shift();
        this.trail.forEach(t => t.alpha -= 5 * deltaTime);
    }

    draw(ctx) {
        // Trail
        this.trail.forEach((t, i) => {
            if (t.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha * 0.5})`;
            ctx.fill();
        });

        // Shield
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(Date.now() / 100))})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Magnet
        if (this.magnetActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 100, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.1)';
            ctx.stroke();
        }

        // Player
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}
