export class Maze {
    constructor(canvas) {
        this.canvas = canvas;
        this.cellSize = 50; // Mobile-friendly size
        this.cols = Math.floor(canvas.width / this.cellSize);

        // Vertical scrolling - slower for mobile
        this.scrollY = 0;
        this.scrollSpeed = 100;

        // Maze chunks
        this.chunks = [];
        this.chunkHeight = this.cellSize * 10;
        this.activeChunks = 3;

        this.walls = [];
        this.collectibles = [];
        this.powerups = [];
        this.distance = 0;

        // Trail effect
        this.trail = [];
        this.maxTrailLength = 15;

        this.generateInitialChunks();
    }

    generateInitialChunks() {
        for (let i = 0; i < this.activeChunks; i++) {
            this.generateChunk(i);
        }
        this.updateWallsFromChunks();
    }

    generateChunk(chunkIndex) {
        const chunk = {
            index: chunkIndex,
            y: chunkIndex * this.chunkHeight,
            walls: [],
            collectibles: [],
            powerups: []
        };

        // Wide corridor for mobile (60% of screen width)
        const corridorWidth = Math.max(3, Math.floor(this.cols * 0.6));
        const startCol = Math.floor((this.cols - corridorWidth) / 2);

        // Create walls on sides
        for (let row = 0; row < 10; row++) {
            const y = row * this.cellSize;

            // Left walls
            for (let col = 0; col < startCol; col++) {
                chunk.walls.push({
                    x: col * this.cellSize,
                    y: y,
                    width: this.cellSize,
                    height: this.cellSize,
                    color: '#00ffff'
                });
            }

            // Right walls
            for (let col = startCol + corridorWidth; col < this.cols; col++) {
                chunk.walls.push({
                    x: col * this.cellSize,
                    y: y,
                    width: this.cellSize,
                    height: this.cellSize,
                    color: '#00ffff'
                });
            }

            // Very sparse obstacles for mobile
            if (Math.random() > 0.9 && row > 2 && row < 8) {
                const obstacleCol = startCol + Math.floor(Math.random() * corridorWidth);
                chunk.walls.push({
                    x: obstacleCol * this.cellSize,
                    y: y,
                    width: this.cellSize,
                    height: this.cellSize,
                    color: '#00ffff'
                });
            }
        }

        // Add collectibles
        for (let i = 0; i < 5; i++) {
            const col = startCol + 1 + Math.random() * (corridorWidth - 2);
            const row = 1 + Math.random() * 8;
            chunk.collectibles.push({
                x: col * this.cellSize + this.cellSize / 2,
                y: row * this.cellSize + this.cellSize / 2,
                radius: 8,
                color: '#ffff00',
                collected: false
            });
        }

        // Add powerup
        if (Math.random() > 0.6) {
            const col = startCol + 1 + Math.random() * (corridorWidth - 2);
            const row = 1 + Math.random() * 8;
            chunk.powerups.push({
                x: col * this.cellSize + this.cellSize / 2,
                y: row * this.cellSize + this.cellSize / 2,
                type: 'magnet',
                radius: 12,
                color: '#ffffff',
                collected: false
            });
        }

        this.chunks.push(chunk);
    }

    updateWallsFromChunks() {
        this.walls = [];
        this.collectibles = [];
        this.powerups = [];

        this.chunks.forEach(chunk => {
            chunk.walls.forEach(wall => {
                this.walls.push({
                    ...wall,
                    y: wall.y + chunk.y - this.scrollY
                });
            });

            chunk.collectibles.forEach(col => {
                this.collectibles.push({
                    ...col,
                    y: col.y + chunk.y - this.scrollY
                });
            });

            chunk.powerups.forEach(pow => {
                this.powerups.push({
                    ...pow,
                    y: pow.y + chunk.y - this.scrollY
                });
            });
        });
    }

    update(deltaTime, playerY) {
        this.scrollY += this.scrollSpeed * deltaTime;
        this.distance += this.scrollSpeed * deltaTime;

        const highestChunk = this.chunks[this.chunks.length - 1];
        if (highestChunk && (highestChunk.y - this.scrollY) < this.canvas.height * 2) {
            this.generateChunk(highestChunk.index + 1);
        }

        this.chunks = this.chunks.filter(chunk => {
            return (chunk.y + this.chunkHeight - this.scrollY) > -this.canvas.height;
        });

        this.updateWallsFromChunks();
    }

    addTrailPoint(x, y) {
        this.trail.push({ x, y, alpha: 1.0 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.trail.forEach((point, i) => {
            point.alpha = i / this.trail.length;
        });
    }

    draw(ctx) {
        // Subtle grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Draw walls
        ctx.shadowBlur = 12;
        this.walls.forEach(wall => {
            if (wall.y > -wall.height && wall.y < this.canvas.height + wall.height) {
                ctx.fillStyle = wall.color;
                ctx.shadowColor = wall.color;
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.fillRect(wall.x + 5, wall.y + 5, wall.width - 10, wall.height - 10);
            }
        });

        // Draw trail
        ctx.shadowBlur = 10;
        this.trail.forEach((point, i) => {
            if (i > 0) {
                const prev = this.trail[i - 1];
                ctx.strokeStyle = `rgba(255, 255, 255, ${point.alpha * 0.5})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        });

        // Draw collectibles
        this.collectibles.forEach(col => {
            if (col.collected) return;
            if (col.y > -50 && col.y < this.canvas.height + 50) {
                const pulse = Math.sin(Date.now() / 200) * 2 + col.radius;
                ctx.beginPath();
                ctx.arc(col.x, col.y, pulse, 0, Math.PI * 2);
                ctx.fillStyle = col.color;
                ctx.shadowColor = col.color;
                ctx.shadowBlur = 15;
                ctx.fill();
            }
        });

        // Draw powerups
        this.powerups.forEach(p => {
            if (p.collected) return;
            if (p.y > -50 && p.y < this.canvas.height + 50) {
                const pulse = Math.sin(Date.now() / 150) * 3 + p.radius;
                ctx.beginPath();
                ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 20;
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('M', p.x, p.y);
            }
        });

        ctx.shadowBlur = 0;
    }
}
