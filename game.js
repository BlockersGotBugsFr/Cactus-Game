const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const homeScreen = document.getElementById("home-screen");
const playBtn = document.getElementById("play-btn");
const levelSelect = document.getElementById("level-select");

let keys = {};
let player, platforms, cameraX, currentLevel;

// --- SPRITE LOADER ---
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Sprite config: replace with your real PNGs later
const spriteSheets = {
  idle: { img: loadImage("assets/idle.png"), frames: 4, frameW: 32, frameH: 32 },
  run: { img: loadImage("assets/run.png"), frames: 6, frameW: 32, frameH: 32 },
  jump: { img: loadImage("assets/jump.png"), frames: 1, frameW: 32, frameH: 32 }
};

// --- PLAYER ---
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;

    this.state = "idle"; // idle, run, jump
    this.frame = 0;
    this.frameTimer = 0;
  }

  update() {
    this.vy += 0.5; // gravity

    // movement
    if (keys["ArrowLeft"]) {
      this.vx = -3;
      this.state = "run";
    } else if (keys["ArrowRight"]) {
      this.vx = 3;
      this.state = "run";
    } else {
      this.vx = 0;
      if (this.onGround) this.state = "idle";
    }

    // jump
    if (keys[" "] && this.onGround) {
      this.vy = -10;
      this.onGround = false;
      this.state = "jump";
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
          if (this.vx === 0) this.state = "idle";
          else this.state = "run";
        }
      }
    }

    // animation
    this.frameTimer++;
    const sheet = spriteSheets[this.state];
    if (this.frameTimer > 10) {
      this.frame = (this.frame + 1) % sheet.frames;
      this.frameTimer = 0;
    }
  }

  draw() {
    const sheet = spriteSheets[this.state];

    // If you don't have images yet → use colored blocks
    if (!sheet.img.complete) {
      ctx.fillStyle = (this.state === "idle") ? "orange" :
                      (this.state === "run") ? "blue" : "yellow";
      ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
      return;
    }

    ctx.drawImage(
      sheet.img,
      this.frame * sheet.frameW, 0, sheet.frameW, sheet.frameH,
      this.x - cameraX, this.y, this.width, this.height
    );
  }
}

// --- PLATFORM ---
class Platform {
  constructor(x, y, w, h, type="platform") {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.type = type;
  }

  draw() {
    ctx.fillStyle = (this.type === "ground") ? "green" : "blue";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

// --- LEVELS ---
const levels = {
  1: [
    new Platform(0, 400, 1000, 50, "ground"),
    new Platform(300, 300, 100, 20),
    new Platform(500, 250, 100, 20),
    new Platform(700, 200, 100, 20),
  ],
  2: [
    new Platform(0, 400, 800, 50, "ground"),
    new Platform(200, 300, 100, 20),
    new Platform(400, 250, 100, 20),
    new Platform(600, 150, 100, 20),
  ],
  3: [
    new Platform(0, 400, 1200, 50, "ground"),
    new Platform(250, 350, 100, 20),
    new Platform(500, 280, 100, 20),
    new Platform(800, 200, 100, 20),
  ],
};

// --- GAME LOOP ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#1e1e2f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player.update();
  cameraX = player.x - canvas.width / 2;

  for (let p of platforms) p.draw();
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
    currentLevel = btn.dataset.level;
    startGame(currentLevel);
  });
});

function startGame(level) {
  homeScreen.style.display = "none";
  canvas.style.display = "block";
  platforms = levels[level];
  player = new Player(50, 300);
  cameraX = 0;
  gameLoop();
}

