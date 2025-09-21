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
let player, platforms, enemies, waters, goal, cameraX, currentLevel, unlockedLevels = 1;
let gameState = "home"; // "home", "playing", "dead", "win"
let animationId;

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
        gameOver();
      }
    }

    // reach goal
    if (this.x + this.width > goal.x &&
        this.y + this.height > goal.y &&
        this.y < goal.y + goal.height) {
      winLevel();
    }

    // water drains
    this.water -= 0.05;
    if (this.water <= 0) gameOver();

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
  constructor(x, y, range=200) {
    this.startX = x;
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.dir = 1;
    this.range = range;
  }
  update() {
    this.x += this.dir * 2;
    if (this.x > this.startX + this.range || this.x < this.startX - this.range) {
      this.dir *= -1;
    }
  }
  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// --- GOAL FLAG ---
class Goal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 100;
  }
  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x - cameraX, this.y - this.height, this.width, this.height);
  }
}

// --- LEVELS ---
const levels = {
  1: () => ({
    platforms: [
      new Platform(0, canvas.height - 50, 2000, 50),
      new Platform(300, canvas.height - 150, 100, 20),
      new Platform(600, canvas.height - 250, 100, 20),
      new Platform(900, canvas.height - 350, 100, 20)
    ],
    waters: [ new WaterPickup(320, canvas.height - 170) ],
    enemies: [ new Enemy(500, canvas.height - 90) ],
    goal: new Goal(1500, canvas.height - 50)
  }),
  2: () => ({
    platforms: [
      new Platform(0, canvas.height - 50, 2000, 50),
      new Platform(400, canvas.height - 150, 100, 20),
      new Platform(800, canvas.height - 250, 100, 20)
    ],
    waters: [ new WaterPickup(820, canvas.height - 270) ],
    enemies: [ new Enemy(600, canvas.height - 90, 300) ],
    goal: new Goal(1700, canvas.height - 50)
  }),
  3: () => ({
    platforms: [
      new Platform(0, canvas.height - 50, 2500, 50),
      new Platform(500, canvas.height - 200, 100, 20),
      new Platform(1000, canvas.height - 300, 100, 20)
    ],
    waters: [ new WaterPickup(520, canvas.height - 220), new WaterPickup(1020, canvas.height - 320) ],
    enemies: [ new Enemy(700, canvas.height - 90), new Enemy(1200, canvas.height - 90, 400) ],
    goal: new Goal(2000, canvas.height - 50)
  })
};

// --- GAME LOOP ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.update();
  enemies.forEach(e => e.update());

  // smooth camera
  let targetCam = player.x - canvas.width / 2;
  cameraX += (targetCam - cameraX) * 0.1;

  // draw
  platforms.forEach(p => p.draw());
  waters.forEach(w => w.draw());
  enemies.forEach(e => e.draw());
  goal.draw();
  player.draw();

  if (gameState === "playing") animationId = requestAnimationFrame(gameLoop);
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
  cancelAnimationFrame(animationId);

  homeScreen.style.display = "none";
  canvas.style.display = "block";
  hud.style.display = "flex";

  const data = levels[level](); // fresh copy every time
  platforms = data.platforms;
  waters = data.waters;
  enemies = data.enemies;
  goal = data.goal;

  player = new Player(50, canvas.height - 200);
  cameraX = 0;
  currentLevel = level;
  gameState = "playing";

  gameLoop();
}

function resetLevel() {
  startGame(currentLevel);
}

function gameOver() {
  cancelAnimationFrame(animationId);
  gameState = "dead";
  showOverlay("💀 You Died!", () => resetLevel());
}

function winLevel() {
  cancelAnimationFrame(animationId);
  gameState = "win";

  if (currentLevel === unlockedLevels && unlockedLevels < 3) {
    unlockedLevels++;
    document.querySelector(`.level-btn[data-level="${unlockedLevels}"]`).disabled = false;
  }

  showOverlay("🎉 Level Complete!", () => {
    if (currentLevel < 3) startGame(currentLevel + 1);
    else goHome();
  });
}

function showOverlay(message, onRetry) {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.7)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "white";
  overlay.style.fontSize = "40px";
  overlay.innerHTML = `
    <p>${message}</p>
    <button id="retry-btn">Retry</button>
    <button id="home-btn">Home</button>
  `;
  document.body.appendChild(overlay);

  document.getElementById("retry-btn").onclick = () => {
    overlay.remove();
    onRetry();
  };
  document.getElementById("home-btn").onclick = () => {
    overlay.remove();
    goHome();
  };
}

function goHome() {
  cancelAnimationFrame(animationId);
  gameState = "home";
  canvas.style.display = "none";
  hud.style.display = "none";
  homeScreen.style.display = "block";
  playBtn.style.display = "block";
  levelSelect.style.display = "block";
}

// --- Fullscreen ---
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
