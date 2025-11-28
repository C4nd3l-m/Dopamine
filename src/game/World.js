export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.obstacles = [];
    this.collectibles = [];
    this.powerups = [];
    this.speed = 300;
    this.spawnTimer = 0;
    this.difficultyMultiplier = 1;
    this.distance = 0;
    
    // Biomes
    this.biomes = [
      { bg: '#050505', obstacle: '#ff0055', collect: '#00ff00' }, // Neon Cyber
      { bg: '#1a001a', obstacle: '#ff9900', collect: '#00ffff' }, // Sunset
      { bg: '#001a1a', obstacle: '#ff00ff', collect: '#ffff00' }, // Toxic
    ];
    this.currentBiome = 0;
  }

  update(deltaTime) {
    this.speed += 10 * deltaTime;
    this.distance += this.speed * deltaTime;
    this.difficultyMultiplier = 1 + (this.speed - 300) / 1000;

    // Biome switch every 5000 pixels
    this.currentBiome = Math.floor(this.distance / 5000) % this.biomes.length;

    // Spawn logic
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0) {
      this.spawnObject();
      this.spawnTimer = 0.8 / this.difficultyMultiplier;
    }

    // Move objects
    const move = (obj) => {
      obj.y += this.speed * deltaTime;
      return obj.y < this.canvas.height + 100;
    };

    this.obstacles = this.obstacles.filter(move);
    this.collectibles = this.collectibles.filter(move);
    this.powerups = this.powerups.filter(move);
  }

  spawnObject() {
    const rand = Math.random();
    const x = Math.random() * (this.canvas.width - 60) + 30;
    const y = -50;

    if (rand < 0.05) { // 5% chance for Powerup
      const type = Math.random() > 0.5 ? 'shield' : 'magnet';
      this.powerups.push({
        x, y,
        type,
        radius: 15,
        color: '#ffffff',
        collected: false
      });
    } else if (rand < 0.4) { // 35% chance Obstacle
      this.obstacles.push({
        x, y,
        width: 60 + Math.random() * 40,
        height: 20,
        color: this.biomes[this.currentBiome].obstacle
      });
    } else { // 60% chance Collectible
      this.collectibles.push({
        x, y,
        radius: 10,
        color: this.biomes[this.currentBiome].collect,
        collected: false
      });
    }
  }

  draw(ctx) {
    // Draw Obstacles
    ctx.shadowBlur = 10;
    this.obstacles.forEach(obs => {
      ctx.fillStyle = obs.color;
      ctx.shadowColor = obs.color;
      ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
    });

    // Draw Collectibles
    this.collectibles.forEach(col => {
      if (col.collected) return;
      ctx.beginPath();
      ctx.arc(col.x, col.y, col.radius, 0, Math.PI * 2);
      ctx.fillStyle = col.color;
      ctx.shadowColor = col.color;
      ctx.fill();
    });

    // Draw Powerups
    this.powerups.forEach(p => {
      if (p.collected) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.fill();
      // Icon
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'shield' ? 'S' : 'M', p.x, p.y);
    });

    ctx.shadowBlur = 0;
  }
}
