

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const homeScreen = document.getElementById("home-screen");
const playBtn = document.getElementById("play-btn");
const levelSelect = document.getElementById("level-select");
const waterBar = document.getElementById("water-bar");
const hud = document.getElementById("hud");
const fullscreenBtn = document.getElementById("fullscreen-btn");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let player, platforms, enemies, waters, cameraX, currentLevel, unlockedLevels = 1;

// --- PLAYER (Cactus) ---
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.water = 100;
  }

  update() {
    this.vy += 0.5; // gravity

    if (keys["ArrowLeft"]) this.vx = -4;
    else if (keys["ArrowRight"]) this.vx = 4;
    else this.vx = 0;

    if (keys[" "] && this.onGround) {
      this.vy = -12;
      this.onGround = false;
    }

    this.x += this.vx;
    this.y += this.vy;

    // collisions
    this.onGround = false;
    for (let p of platforms) {
      if (this.x < p.x + p.width &&
          this.x + this.width > p.x &&
          this.y < p.y + p.height &&
          this.y + this.height > p.y) {
        if (this.vy > 0) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    // collect water
    for (let w of waters) {
      if (!w.collected &&
          this.x < w.x + w.width &&
          this.x + this.width > w.x &&
          this.y < w.y + w.height &&
          this.y + this.height > w.y) {
        this.water = Math.min(100, this.water + 30);
        w.collected = true;
      }
    }

    // enemy collision
    for (let e of enemies) {
      if (this.x < e.x + e.width &&
          this.x + this.width > e.x &&
          this.y < e.y + e.height &&
          this.y + this.height > e.y) {
        resetLevel(); // restart
      }
    }

    // water drains
    this.water -= 0.05;
    if (this.water <= 0) resetLevel();

    // update HUD
    waterBar.style.width = this.water + "%";
  }

  draw() {
    ctx.fillStyle = "green"; // cactus placeholder
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// --- PLATFORM ---
class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  draw() {
    ctx.fillStyle = "brown";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// --- WATER PICKUP ---
class WaterPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.collected = false;
  }
  draw() {
    if (!this.collected) {
      ctx.fillStyle = "cyan";
      ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
    }
  }
}

// --- ENEMY ---
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.dir = 1;
  }
  update() {
    this.x += this.dir * 2;
    if (this.x < 100 || this.x > 700) this.dir *= -1;
  }
  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// --- LEVELS ---
const levels = {
  1: {
    platforms: [
      new Platform(0, canvas.height - 50, 2000, 50),
      new Platform(300, canvas.height - 150, 100, 20),
      new Platform(600, canvas.height - 250, 100, 20),
      new Platform(900, canvas.height - 350, 100, 20)
    ],
    waters: [ new WaterPickup(320, canvas.height - 170) ],
    enemies: [ new Enemy(500, canvas.height - 90) ]
  },
  2: {
    platforms: [
      new Platform(0, canvas.height - 50, 2000, 50),
      new Platform(400, canvas.height - 150, 100, 20),
      new Platform(800, canvas.height - 250, 100, 20)
    ],
    waters: [ new WaterPickup(820, canvas.height - 270) ],
    enemies: [ new Enemy(600, canvas.height - 90) ]
  },
  3: {
    platforms: [
      new Platform(0, canvas.height - 50, 2500, 50),
      new Platform(500, canvas.height - 200, 100, 20),
      new Platform(1000, canvas.height - 300, 100, 20)
    ],
    waters: [ new WaterPickup(520, canvas.height - 220), new WaterPickup(1020, canvas.height - 320) ],
    enemies: [ new Enemy(700, canvas.height - 90), new Enemy(1200, canvas.height - 90) ]
  }
};

// --- GAME LOOP ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.update();
  enemies.forEach(e => e.update());

  cameraX = player.x - canvas.width / 2;

  platforms.forEach(p => p.draw());
  waters.forEach(w => w.draw());
  enemies.forEach(e => e.draw());
  player.draw();

  requestAnimationFrame(gameLoop);
}

// --- INPUT ---
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// --- UI ---
playBtn.addEventListener("click", () => {
  playBtn.style.display = "none";
  levelSelect.style.display = "block";
});

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const level = parseInt(btn.dataset.level);
    if (level <= unlockedLevels) startGame(level);
  });
});

function startGame(level) {
  homeScreen.style.display = "none";
  canvas.style.display = "block";
  hud.style.display = "flex";

  const data = levels[level];
  platforms = data.platforms;
  waters = data.waters;
  enemies = data.enemies;

  player = new Player(50, canvas.height - 200);
  cameraX = 0;
  currentLevel = level;

  gameLoop();
}

function resetLevel() {
  startGame(currentLevel);
}

// --- Fullscreen ---
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

