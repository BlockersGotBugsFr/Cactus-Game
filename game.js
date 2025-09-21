const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let gameState = "MENU"; // MENU, LEVEL, PAUSE, DEATH, WIN
let currentLevel = 1;
let unlockedLevels = 1;
let entities = [];
let particles = [];
let player;
let cameraX = 0;

// ========== GAME OBJECT CLASSES ==========

// Parallax Background
class Background {
  constructor(img, speed) {
    this.img = img;
    this.speed = speed;
  }
  draw() {
    const w = canvas.width;
    const h = canvas.height;
    const x = -cameraX * this.speed % w;
    ctx.drawImage(this.img, x, 0, w, h);
    ctx.drawImage(this.img, x + w, 0, w, h);
  }
}

// Player (Cactus)
class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.width = 40; this.height = 60;
    this.onGround = false;
    this.water = 100;
    this.frame = 0;
  }
  update() {
    // Gravity
    this.vy += 0.5;

    // Movement
    if (keys["ArrowLeft"]) this.vx = -4;
    else if (keys["ArrowRight"]) this.vx = 4;
    else this.vx = 0;

    // Jump
    if (keys[" "] && this.onGround) {
      this.vy = -12;
      this.onGround = false;
      spawnDust(this.x, this.y + this.height);
    }

    this.x += this.vx;
    this.y += this.vy;

    // Collisions
    this.onGround = false;
    for (let p of entities.filter(e => e.type === "platform")) {
      if (checkCollision(this, p)) {
        if (this.vy > 0) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    // Collect water
    for (let w of entities.filter(e => e.type === "water" && !e.collected)) {
      if (checkCollision(this, w)) {
        this.water = Math.min(100, this.water + 30);
        w.collected = true;
        spawnSparkle(w.x, w.y);
      }
    }

    // Enemy hit
    for (let e of entities.filter(e => e.type === "enemy")) {
      if (checkCollision(this, e)) {
        triggerDeath();
      }
    }

    // Flag
    for (let f of entities.filter(e => e.type === "flag")) {
      if (checkCollision(this, f)) {
        triggerWin();
      }
    }

    // Water drain
    this.water -= 0.05;
    if (this.water <= 0) triggerDeath();

    // Update HUD
    document.getElementById("water-bar").style.width = this.water + "%";
  }
  draw() {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// Enemy
class Enemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.width = 40; this.height = 40;
    this.dir = 1;
    this.type = "enemy";
  }
  update() {
    this.x += this.dir * 2;
    if (this.x < 200 || this.x > 800) this.dir *= -1;
  }
  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// Platform
class Platform {
  constructor(x, y, w, h) {
    this.x = x; this.y = y;
    this.width = w; this.height = h;
    this.type = "platform";
  }
  draw() {
    ctx.fillStyle = "brown";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// Water
class WaterPickup {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.width = 20; this.height = 20;
    this.collected = false;
    this.type = "water";
  }
  draw() {
    if (!this.collected) {
      ctx.fillStyle = "cyan";
      ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
    }
  }
}

// Flag
class Flag {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.width = 40; this.height = 60;
    this.type = "flag";
  }
  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// Particle System
function spawnDust(x, y) {
  particles.push({x, y, life: 30, color: "gray"});
}
function spawnSparkle(x, y) {
  particles.push({x, y, life: 30, color: "cyan"});
}
function updateParticles() {
  for (let p of particles) {
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
}
function drawParticles() {
  for (let p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - cameraX, p.y, 5, 5);
  }
}

// ========== GAME HELPERS ==========
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function triggerDeath() {
  gameState = "DEATH";
  setTimeout(() => startLevel(currentLevel), 2000);
}
function triggerWin() {
  gameState = "WIN";
  unlockedLevels = Math.max(unlockedLevels, currentLevel + 1);
  setTimeout(() => startLevel(currentLevel + 1), 2000);
}

// ========== LEVEL DATA ==========
const levels = {
  1: () => {
    entities = [
      new Platform(0, canvas.height - 50, 2000, 50),
      new Platform(300, canvas.height - 150, 100, 20),
      new Enemy(500, canvas.height - 90),
      new WaterPickup(320, canvas.height - 170),
      new Flag(1800, canvas.height - 110)
    ];
    player = new Player(50, canvas.height - 200);
  }
};

// ========== GAME LOOP ==========
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "LEVEL") {
    player.update();
    entities.forEach(e => e.update?.());
    cameraX = player.x - canvas.width / 2;

    entities.forEach(e => e.draw());
    player.draw();
    updateParticles();
    drawParticles();
  }

  requestAnimationFrame(gameLoop);
}

// ========== START ==========
function startLevel(lvl) {
  currentLevel = lvl;
  levels[lvl]();
  gameState = "LEVEL";
}

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

gameLoop();
