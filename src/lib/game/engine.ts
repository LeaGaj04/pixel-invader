// 8-bit arcade space shooter engine. Pure logic + canvas drawing, no React.

export const GAME_W = 320;
export const GAME_H = 240;

export const PALETTE = {
  bg: "#05050f",
  star: "#ffffff",
  ship: "#dfe9ff",
  shipAccent: "#39ff88",
  laser: "#6ff2ff",
  enemy: "#a45cff",
  enemyDark: "#6c2fb8",
  enemyShot: "#ff4fd8",
  life: "#39ff88",
  score: "#39ff88",
  fire1: "#ff8a1f",
  fire2: "#ff2d2d",
  powerBase: "#0b1b2e",
  powerNeon: "#4fd8ff",
  powerGlow: "#0ea5e9",
  powerWhite: "#ffffff",
};

export const POWER_DURATION = 10;

type State = "start" | "playing" | "gameover";

interface Star {
  x: number;
  y: number;
  s: number;
  v: number;
}
interface Bullet {
  x: number;
  y: number;
  vy: number;
}
interface Enemy {
  x: number;
  y: number;
  row: number;
  col: number;
  alive: boolean;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
interface PowerUp {
  x: number;
  y: number;
  vy: number;
}

const PU_W = 10;
const PU_H = 10;


const ROWS = 3;
const COLS = 6;
const E_W = 16;
const E_H = 12;
const E_GAP_X = 12;
const E_GAP_Y = 12;
const P_W = 16;
const P_H = 10;

export class Game {
  state: State = "start";
  score = 0;
  lives = 4;
  wave = 1;
  private t = 0;
  private stars: Star[] = [];
  private bullets: Bullet[] = [];
  private eBullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  doubleShot = 0;
  private px = GAME_W / 2 - P_W / 2;
  private cooldown = 0;
  private invuln = 0;
  private dir = 1;
  private stepDown = 0;
  keys: Record<string, boolean> = {};

  constructor() {
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * GAME_W),
        y: Math.floor(Math.random() * GAME_H),
        s: Math.random() < 0.25 ? 2 : 1,
        v: 8 + Math.random() * 26,
      });
    }
    this.spawnWave();
  }

  private spawnWave() {
    this.enemies = [];
    const totalW = COLS * E_W + (COLS - 1) * E_GAP_X;
    const startX = (GAME_W - totalW) / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.enemies.push({
          x: startX + c * (E_W + E_GAP_X),
          y: 34 + r * (E_H + E_GAP_Y),
          row: r,
          col: c,
          alive: true,
        });
      }
    }
    this.dir = 1;
    this.eBullets = [];
    this.bullets = [];
  }

  start() {
    this.state = "playing";
    this.score = 0;
    this.lives = 4;
    this.wave = 1;
    this.px = GAME_W / 2 - P_W / 2;
    this.particles = [];
    this.invuln = 0;
    this.spawnWave();
  }

  press(code: string) {
    if (this.state !== "playing" && (code === "Space" || code === "Enter")) {
      this.start();
    }
  }

  private explode(x: number, y: number, n = 18) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.3 + Math.random() * 0.45,
        color: Math.random() < 0.5 ? PALETTE.fire1 : PALETTE.fire2,
      });
    }
  }

  update(dt: number) {
    this.t += dt;

    for (const s of this.stars) {
      s.y += s.v * dt;
      if (s.y > GAME_H) {
        s.y = -s.s;
        s.x = Math.floor(Math.random() * GAME_W);
      }
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.state !== "playing") return;

    // player
    const speed = 120;
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) this.px -= speed * dt;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) this.px += speed * dt;
    this.px = Math.max(4, Math.min(GAME_W - P_W - 4, this.px));

    this.cooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.keys["Space"] && this.cooldown <= 0) {
      this.cooldown = 0.32;
      this.bullets.push({ x: this.px + P_W / 2, y: GAME_H - 22, vy: -230 });
    }

    for (const b of this.bullets) b.y += b.vy * dt;
    this.bullets = this.bullets.filter((b) => b.y > -10);
    for (const b of this.eBullets) b.y += b.vy * dt;
    this.eBullets = this.eBullets.filter((b) => b.y < GAME_H + 10);

    // formation movement
    const alive = this.enemies.filter((e) => e.alive);
    if (alive.length === 0) {
      this.wave++;
      this.spawnWave();
      return;
    }
    const base = 16 + (ROWS * COLS - alive.length) * 2.2 + (this.wave - 1) * 8;
    if (this.stepDown > 0) {
      const d = Math.min(this.stepDown, 60 * dt);
      for (const e of this.enemies) e.y += d;
      this.stepDown -= d;
    } else {
      const dx = base * this.dir * dt;
      for (const e of this.enemies) e.x += dx;
      const minX = Math.min(...alive.map((e) => e.x));
      const maxX = Math.max(...alive.map((e) => e.x + E_W));
      if (minX < 6 || maxX > GAME_W - 6) {
        this.dir *= -1;
        this.stepDown = 8;
        for (const e of this.enemies) e.x += this.dir * 2;
      }
    }

    // enemy fire (only lowest per column)
    if (Math.random() < (0.5 + this.wave * 0.15) * dt) {
      const cols = new Map<number, Enemy>();
      for (const e of alive) {
        const cur = cols.get(e.col);
        if (!cur || e.y > cur.y) cols.set(e.col, e);
      }
      const shooters = [...cols.values()];
      const s = shooters[Math.floor(Math.random() * shooters.length)];
      if (s) this.eBullets.push({ x: s.x + E_W / 2, y: s.y + E_H, vy: 90 + this.wave * 8 });
    }

    // laser vs enemy
    for (const b of this.bullets) {
      for (const e of alive) {
        if (b.x >= e.x && b.x <= e.x + E_W && b.y >= e.y && b.y <= e.y + E_H) {
          e.alive = false;
          b.y = -100;
          this.score += 10 * (ROWS - e.row);
          this.explode(e.x + E_W / 2, e.y + E_H / 2);
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.y > -10);

    // enemy bullet vs player
    const pyTop = GAME_H - 24;
    if (this.invuln <= 0) {
      for (const b of this.eBullets) {
        if (b.x >= this.px && b.x <= this.px + P_W && b.y >= pyTop && b.y <= pyTop + P_H) {
          b.y = GAME_H + 100;
          this.hit();
          break;
        }
      }
      this.eBullets = this.eBullets.filter((b) => b.y < GAME_H + 10);
    }

    // enemies reach bottom
    if (alive.some((e) => e.y + E_H >= pyTop)) {
      this.lives = 0;
      this.explode(this.px + P_W / 2, pyTop + P_H / 2, 30);
      this.state = "gameover";
    }
  }

  private hit() {
    this.lives--;
    this.invuln = 1.6;
    this.explode(this.px + P_W / 2, GAME_H - 20, 24);
    if (this.lives <= 0) {
      this.lives = 0;
      this.state = "gameover";
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.fillStyle = PALETTE.star;
    for (const s of this.stars) ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.s, s.s);

    // enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      drawAlien(ctx, Math.floor(e.x), Math.floor(e.y), Math.floor(this.t * 2) % 2 === 0);
    }

    // bullets
    ctx.fillStyle = PALETTE.laser;
    for (const b of this.bullets) {
      const x = Math.floor(b.x);
      const y = Math.floor(b.y);
      ctx.fillRect(x, y, 2, 4);
      ctx.fillRect(x, y + 6, 2, 3);
    }
    ctx.fillStyle = PALETTE.enemyShot;
    for (const b of this.eBullets) ctx.fillRect(Math.floor(b.x), Math.floor(b.y), 2, 5);

    // player
    if (this.state === "playing" && (this.invuln <= 0 || Math.floor(this.t * 12) % 2 === 0)) {
      drawShip(ctx, Math.floor(this.px), GAME_H - 24);
    }

    // particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }

    // HUD
    for (let i = 0; i < this.lives; i++) drawLifeIcon(ctx, 6 + i * 12, 6);
    ctx.fillStyle = PALETTE.score;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = "right";
    ctx.fillText(String(this.score).padStart(5, "0"), GAME_W - 6, 14);
    ctx.textAlign = "left";

    if (this.state === "start") {
      overlay(ctx);
      ctx.fillStyle = PALETTE.enemy;
      centerText(ctx, "PIXEL INVADERS", GAME_H / 2 - 26, 14);
      if (Math.floor(this.t * 2) % 2 === 0) {
        ctx.fillStyle = PALETTE.score;
        centerText(ctx, "PRESS START", GAME_H / 2 + 6, 10);
      }
      ctx.fillStyle = "#8891b5";
      centerText(ctx, "ARROWS MOVE  SPACE FIRE", GAME_H / 2 + 34, 6);
    } else if (this.state === "gameover") {
      overlay(ctx);
      ctx.fillStyle = PALETTE.fire2;
      centerText(ctx, "GAME OVER", GAME_H / 2 - 24, 14);
      ctx.fillStyle = PALETTE.score;
      centerText(ctx, `SCORE ${String(this.score).padStart(5, "0")}`, GAME_H / 2 + 4, 8);
      if (Math.floor(this.t * 2) % 2 === 0) {
        ctx.fillStyle = "#dfe9ff";
        centerText(ctx, "PRESS SPACE TO RETRY", GAME_H / 2 + 28, 8);
      }
    }
  }
}

function overlay(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(5,5,15,0.72)";
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function centerText(ctx: CanvasRenderingContext2D, text: string, y: number, size: number) {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, GAME_W / 2, y);
  ctx.textAlign = "left";
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = PALETTE.ship;
  ctx.fillRect(x + 7, y, 2, 3);
  ctx.fillRect(x + 5, y + 3, 6, 3);
  ctx.fillRect(x + 1, y + 6, 14, 3);
  ctx.fillRect(x, y + 9, 16, 1);
  ctx.fillStyle = PALETTE.shipAccent;
  ctx.fillRect(x + 2, y + 6, 2, 2);
  ctx.fillRect(x + 12, y + 6, 2, 2);
}

function drawAlien(ctx: CanvasRenderingContext2D, x: number, y: number, frame: boolean) {
  ctx.fillStyle = PALETTE.enemy;
  ctx.fillRect(x + 3, y, 10, 2);
  ctx.fillRect(x + 1, y + 2, 14, 6);
  ctx.fillRect(x, y + 4, 2, 4);
  ctx.fillRect(x + 14, y + 4, 2, 4);
  ctx.fillStyle = PALETTE.enemyDark;
  ctx.fillRect(x + 4, y + 4, 2, 2);
  ctx.fillRect(x + 10, y + 4, 2, 2);
  ctx.fillStyle = PALETTE.enemy;
  if (frame) {
    ctx.fillRect(x + 2, y + 9, 3, 3);
    ctx.fillRect(x + 11, y + 9, 3, 3);
  } else {
    ctx.fillRect(x + 4, y + 9, 3, 3);
    ctx.fillRect(x + 9, y + 9, 3, 3);
  }
}

function drawLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = PALETTE.life;
  ctx.fillRect(x + 3, y, 2, 2);
  ctx.fillRect(x + 1, y + 2, 6, 2);
  ctx.fillRect(x, y + 4, 8, 2);
}
