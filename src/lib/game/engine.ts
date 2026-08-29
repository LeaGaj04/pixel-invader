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
  saucer: "#ffd23f",
  saucerDark: "#b8860b",
  saucerLight: "#fff3c4",
  fighter: "#4dff2f",
  fighterDark: "#127a1f",
  fighterLight: "#d7ffcf",
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
  vx?: number;
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
interface Saucer {
  x: number;
  y: number;
  vx: number;
  hp: number;
  flash: number;
}
interface Boss {
  x: number;
  y: number;
  vx: number;
  hp: number;
  flash: number;
  fireTimer: number;
}
interface Fighter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  flash: number;
}

const PU_W = 10;
const PU_H = 10;
const S_W = 20;
const S_H = 8;
const S_Y = 20;
const SAUCER_HP = 3;
const SAUCER_SCORE = 500;

export const PHASE2_SCORE = 700;
export const PHASE3_SCORE = 1500;
const B_W = 72;
const B_H = 32;
const B_Y = 26;
const BOSS_HP = 45;
const BOSS_SCORE = 2000;

const F_W = 12;
const F_H = 10;
const FIGHTER_HP = 2;
const FIGHTER_SCORE = 150;
const F_TOP = 14;


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
  private saucer: Saucer | null = null;
  private saucerTimer = 6 + Math.random() * 6;
  boss: Boss | null = null;
  private bossDefeated = false;
  private fighters: Fighter[] = [];
  private squadTimer = 0;
  private waveSpeed = 0;
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
    this.dir = 1;
    this.eBullets = [];
    this.bullets = [];
    this.powerUps = [];
    this.saucer = null;
    this.saucerTimer = 6 + Math.random() * 6;

    // Fase 4: la cuadrícula morada queda desactivada; llegan escuadrones verdes
    if (this.bossDefeated) {
      this.fighters = [];
      this.squadTimer = 0.6;
      return;
    }

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
  }

  // 2 grupos de 3 cazas verdes en formación táctica
  private spawnSquadrons() {
    const speed = 110 + this.wave * 6 + Math.random() * 30;
    for (let g = 0; g < 2; g++) {
      const dir = g === 0 ? 1 : -1;
      const baseX = g === 0 ? 24 : GAME_W - 24 - F_W;
      for (let i = 0; i < 3; i++) {
        this.fighters.push({
          x: baseX + dir * i * (F_W + 6),
          y: F_TOP + i * 8,
          vx: speed * dir,
          vy: 34 + Math.random() * 18,
          hp: FIGHTER_HP,
          flash: 0,
        });
      }
    }
  }


  start() {
    this.state = "playing";
    this.score = 0;
    this.lives = 4;
    this.wave = 1;
    this.px = GAME_W / 2 - P_W / 2;
    this.particles = [];
    this.invuln = 0;
    this.doubleShot = 0;
    this.boss = null;
    this.bossDefeated = false;
    this.fighters = [];
    this.squadTimer = 0;
    this.waveSpeed = 0;
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
    if (this.doubleShot > 0) this.doubleShot = Math.max(0, this.doubleShot - dt);
    if (this.keys["Space"] && this.cooldown <= 0) {
      if (this.doubleShot > 0) {
        this.cooldown = 0.26;
        this.bullets.push({ x: this.px + 3, y: GAME_H - 22, vy: -270 });
        this.bullets.push({ x: this.px + P_W - 3, y: GAME_H - 22, vy: -270 });
      } else {
        this.cooldown = 0.32;
        this.bullets.push({ x: this.px + P_W / 2, y: GAME_H - 22, vy: -230 });
      }
    }

    for (const b of this.bullets) b.y += b.vy * dt;
    this.bullets = this.bullets.filter((b) => b.y > -10);
    for (const b of this.eBullets) {
      b.y += b.vy * dt;
      if (b.vx) b.x += b.vx * dt;
    }
    this.eBullets = this.eBullets.filter((b) => b.y < GAME_H + 10);

    // power-ups caen y son recogidos
    const pTop = GAME_H - 24;
    for (const p of this.powerUps) p.y += p.vy * dt;
    this.powerUps = this.powerUps.filter((p) => {
      if (p.y > GAME_H + 10) return false;
      const hit =
        p.y + PU_H >= pTop &&
        p.y <= pTop + P_H &&
        p.x + PU_W >= this.px &&
        p.x <= this.px + P_W;
      if (hit) {
        this.doubleShot = POWER_DURATION;
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 20 + Math.random() * 50;
          this.particles.push({
            x: p.x + PU_W / 2,
            y: p.y + PU_H / 2,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.25 + Math.random() * 0.35,
            color: Math.random() < 0.5 ? PALETTE.powerNeon : PALETTE.powerWhite,
          });
        }
        return false;
      }
      return true;
    });

    // platillo veloz: aparición ocasional y movimiento con rebote
    if (this.saucer) {
      const s = this.saucer;
      s.x += s.vx * dt;
      if (s.x < 4) {
        s.x = 4;
        s.vx = Math.abs(s.vx);
      } else if (s.x > GAME_W - S_W - 4) {
        s.x = GAME_W - S_W - 4;
        s.vx = -Math.abs(s.vx);
      }
      if (s.flash > 0) s.flash -= dt;
    } else if (this.score >= PHASE2_SCORE && !this.boss) {
      this.saucerTimer -= dt;
      if (this.saucerTimer <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const speed = 70 + this.wave * 10 + Math.random() * 30;
        this.saucer = {
          x: dir === 1 ? 4 : GAME_W - S_W - 4,
          y: S_Y,
          vx: speed * dir,
          hp: SAUCER_HP,
          flash: 0,
        };
      }
    }

    // Fase 3: jefe final (nave nodriza)
    if (!this.boss && !this.bossDefeated && this.score >= PHASE3_SCORE) {
      for (const e of this.enemies) e.alive = false;
      this.eBullets = [];
      this.saucer = null;
      this.boss = {
        x: GAME_W / 2 - B_W / 2,
        y: B_Y,
        vx: 18,
        hp: BOSS_HP,
        flash: 0,
        fireTimer: 1.6,
      };
    }

    if (this.boss) {
      const bo = this.boss;
      bo.x += bo.vx * dt;
      if (bo.x < 8) {
        bo.x = 8;
        bo.vx = Math.abs(bo.vx);
      } else if (bo.x > GAME_W - B_W - 8) {
        bo.x = GAME_W - B_W - 8;
        bo.vx = -Math.abs(bo.vx);
      }
      if (bo.flash > 0) bo.flash -= dt;

      bo.fireTimer -= dt;
      if (bo.fireTimer <= 0) {
        bo.fireTimer = 1.5 + Math.random() * 0.8;
        const cx = bo.x + B_W / 2;
        const cy = bo.y + B_H;
        for (const vx of [-55, 0, 55]) this.eBullets.push({ x: cx, y: cy, vx, vy: 95 });
      }

      for (const b of this.bullets) {
        if (b.x >= bo.x && b.x <= bo.x + B_W && b.y >= bo.y && b.y <= bo.y + B_H) {
          b.y = -100;
          bo.hp--;
          bo.flash = 0.12;
          if (bo.hp <= 0) {
            this.score += BOSS_SCORE;
            this.explode(bo.x + B_W / 2, bo.y + B_H / 2, 70);
            this.boss = null;
            this.bossDefeated = true;
            this.waveSpeed = 3;
            this.wave++;
            this.spawnWave();
          } else {
            this.explode(b.x, bo.y + B_H - 2, 5);
          }
          break;
        }
      }
      this.bullets = this.bullets.filter((b) => b.y > -10);
    }

    // formation movement
    const alive = this.boss ? [] : this.enemies.filter((e) => e.alive);
    if (!this.boss) {
      if (alive.length === 0) {
        this.wave++;
        this.spawnWave();
        return;
      }
      const base =
        16 +
        (ROWS * COLS - alive.length) * 2.2 +
        (this.wave - 1) * 8 +
        this.waveSpeed * 6;
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
      if (Math.random() < (0.5 + this.wave * 0.15 + this.waveSpeed * 0.1) * dt) {
        const cols = new Map<number, Enemy>();
        for (const e of alive) {
          const cur = cols.get(e.col);
          if (!cur || e.y > cur.y) cols.set(e.col, e);
        }
        const shooters = [...cols.values()];
        const s = shooters[Math.floor(Math.random() * shooters.length)];
        if (s) this.eBullets.push({ x: s.x + E_W / 2, y: s.y + E_H, vy: 90 + this.wave * 8 });
      }
    }

    // laser vs platillo (vuela por encima de la formación)
    if (this.saucer) {
      const s = this.saucer;
      for (const b of this.bullets) {
        if (b.x >= s.x && b.x <= s.x + S_W && b.y >= s.y && b.y <= s.y + S_H) {
          b.y = -100;
          s.hp--;
          s.flash = 0.15;
          if (s.hp <= 0) {
            this.score += SAUCER_SCORE;
            this.explode(s.x + S_W / 2, s.y + S_H / 2, 34);
            if (Math.random() < 0.15) {
              this.powerUps.push({
                x: s.x + S_W / 2 - PU_W / 2,
                y: s.y + S_H / 2,
                vy: 52,
              });
            }
            this.saucer = null;
            this.saucerTimer = 12 + Math.random() * 8;
          } else {
            this.explode(b.x, s.y + S_H / 2, 6);
          }
          break;
        }
      }
      this.bullets = this.bullets.filter((b) => b.y > -10);
    }

    // laser vs enemy
    for (const b of this.bullets) {
      for (const e of alive) {
        if (b.x >= e.x && b.x <= e.x + E_W && b.y >= e.y && b.y <= e.y + E_H) {
          e.alive = false;
          b.y = -100;
          this.score += 10 * (ROWS - e.row);
          this.explode(e.x + E_W / 2, e.y + E_H / 2);
          if (Math.random() < 0.15) {
            this.powerUps.push({
              x: e.x + E_W / 2 - PU_W / 2,
              y: e.y + E_H / 2,
              vy: 52,
            });
          }
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

    // jefe final
    if (this.boss) {
      drawBoss(
        ctx,
        Math.floor(this.boss.x),
        Math.floor(this.boss.y),
        this.boss.flash > 0,
        Math.floor(this.t * 5) % 2 === 0,
      );
      // barra de vida del jefe
      const bw = GAME_W - 80;
      const bx = 40;
      const by = GAME_H - 8;
      ctx.fillStyle = PALETTE.powerBase;
      ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = PALETTE.fire2;
      ctx.fillRect(bx, by, Math.round((bw * this.boss.hp) / BOSS_HP), 4);
      ctx.strokeStyle = PALETTE.powerNeon;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 3);
    }

    // platillo veloz
    if (this.saucer) {
      drawSaucer(
        ctx,
        Math.floor(this.saucer.x),
        Math.floor(this.saucer.y),
        this.saucer.flash > 0,
        Math.floor(this.t * 6) % 2 === 0,
      );
    }

    // power-ups
    for (const p of this.powerUps) {
      drawPowerUp(ctx, Math.floor(p.x), Math.floor(p.y), Math.floor(this.t * 8) % 2 === 0);
    }

    // bullets
    const twin = this.doubleShot > 0;
    for (const b of this.bullets) {
      const x = Math.floor(b.x);
      const y = Math.floor(b.y);
      if (twin) {
        ctx.fillStyle = PALETTE.powerGlow;
        ctx.fillRect(x - 1, y, 4, 6);
        ctx.fillStyle = PALETTE.powerNeon;
        ctx.fillRect(x, y, 2, 6);
        ctx.fillStyle = PALETTE.powerWhite;
        ctx.fillRect(x, y + 1, 2, 2);
      } else {
        ctx.fillStyle = PALETTE.laser;
        ctx.fillRect(x, y, 2, 4);
        ctx.fillRect(x, y + 6, 2, 3);
      }
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

    // barra de tiempo del power-up
    if (this.doubleShot > 0) {
      const bw = 70;
      const bx = GAME_W / 2 - bw / 2;
      const by = 6;
      drawPowerUp(ctx, bx - 14, by - 1, Math.floor(this.t * 8) % 2 === 0);
      ctx.fillStyle = PALETTE.powerBase;
      ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = PALETTE.powerGlow;
      ctx.fillRect(bx, by, Math.round((bw * this.doubleShot) / POWER_DURATION), 6);
      ctx.fillStyle = PALETTE.powerNeon;
      ctx.fillRect(bx, by, Math.round((bw * this.doubleShot) / POWER_DURATION), 2);
      ctx.strokeStyle = PALETTE.powerNeon;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 5);
      ctx.fillStyle = PALETTE.powerWhite;
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText("DOBLE", GAME_W / 2, by + 18);
      ctx.textAlign = "left";
    }


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

function drawPowerUp(ctx: CanvasRenderingContext2D, x: number, y: number, pulse: boolean) {
  // base oscura con borde neón celeste y detalles blancos
  ctx.fillStyle = PALETTE.powerBase;
  ctx.fillRect(x + 1, y + 1, PU_W - 2, PU_H - 2);
  ctx.fillStyle = pulse ? PALETTE.powerNeon : PALETTE.powerGlow;
  ctx.fillRect(x + 2, y, PU_W - 4, 1);
  ctx.fillRect(x + 2, y + PU_H - 1, PU_W - 4, 1);
  ctx.fillRect(x, y + 2, 1, PU_H - 4);
  ctx.fillRect(x + PU_W - 1, y + 2, 1, PU_H - 4);
  ctx.fillStyle = PALETTE.powerNeon;
  ctx.fillRect(x + 3, y + 3, 1, 4);
  ctx.fillRect(x + 6, y + 3, 1, 4);
  ctx.fillStyle = PALETTE.powerWhite;
  ctx.fillRect(x + 3, y + 3, 1, 1);
  ctx.fillRect(x + 6, y + 3, 1, 1);
}

function drawSaucer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flash: boolean,
  blink: boolean,
) {
  const body = flash ? PALETTE.fire2 : PALETTE.saucer;
  const dark = flash ? PALETTE.fire2 : PALETTE.saucerDark;
  const light = flash ? PALETTE.fire1 : PALETTE.saucerLight;
  // cúpula
  ctx.fillStyle = light;
  ctx.fillRect(x + 8, y, 4, 2);
  ctx.fillRect(x + 6, y + 2, 8, 2);
  // cuerpo
  ctx.fillStyle = body;
  ctx.fillRect(x + 2, y + 4, 16, 2);
  ctx.fillRect(x, y + 6, 20, 2);
  // luces inferiores
  ctx.fillStyle = blink ? PALETTE.powerWhite : dark;
  ctx.fillRect(x + 3, y + 6, 2, 2);
  ctx.fillRect(x + 9, y + 6, 2, 2);
  ctx.fillRect(x + 15, y + 6, 2, 2);
}

function drawBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flash: boolean,
  blink: boolean,
) {
  const hull = flash ? PALETTE.fire2 : "#0a0a14";
  const plate = flash ? "#ff6b6b" : "#161a2b";
  const neon = flash ? PALETTE.fire1 : PALETTE.powerNeon;
  const glow = flash ? PALETTE.fire1 : PALETTE.powerGlow;

  // cuerpo principal
  ctx.fillStyle = hull;
  ctx.fillRect(x + 12, y, B_W - 24, 6);
  ctx.fillRect(x + 4, y + 6, B_W - 8, 12);
  ctx.fillRect(x, y + 12, B_W, 8);
  ctx.fillRect(x + 10, y + 20, B_W - 20, 6);

  // placas
  ctx.fillStyle = plate;
  ctx.fillRect(x + 16, y + 2, B_W - 32, 4);
  ctx.fillRect(x + 8, y + 14, B_W - 16, 4);

  // núcleo neón
  ctx.fillStyle = glow;
  ctx.fillRect(x + B_W / 2 - 8, y + 8, 16, 8);
  ctx.fillStyle = neon;
  ctx.fillRect(x + B_W / 2 - 6, y + 10, 12, 4);
  ctx.fillStyle = PALETTE.powerWhite;
  ctx.fillRect(x + B_W / 2 - 2, y + 11, 4, 2);

  // franjas laterales
  ctx.fillStyle = neon;
  ctx.fillRect(x + 2, y + 14, 6, 2);
  ctx.fillRect(x + B_W - 8, y + 14, 6, 2);

  // cañones inferiores
  ctx.fillStyle = hull;
  ctx.fillRect(x + 14, y + 26, 6, 6);
  ctx.fillRect(x + B_W / 2 - 3, y + 26, 6, 6);
  ctx.fillRect(x + B_W - 20, y + 26, 6, 6);
  ctx.fillStyle = blink ? PALETTE.powerWhite : neon;
  ctx.fillRect(x + 16, y + 30, 2, 2);
  ctx.fillRect(x + B_W / 2 - 1, y + 30, 2, 2);
  ctx.fillRect(x + B_W - 18, y + 30, 2, 2);
}
