import { useEffect, useRef } from "react";
import { Game, GAME_H, GAME_W } from "@/lib/game/engine";

const HANDLED = new Set([
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "Enter",
  "KeyA",
  "KeyD",
]);

export function ArcadeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const game = new Game();

    const onDown = (e: KeyboardEvent) => {
      if (HANDLED.has(e.code)) e.preventDefault();
      if (!e.repeat) game.press(e.code);
      game.keys[e.code] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      game.keys[e.code] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      game.update(dt);
      game.draw(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_W}
      height={GAME_H}
      aria-label="Juego arcade retro de invasores espaciales"
      className="w-full max-w-[720px] rounded-sm border-4 border-primary/60 bg-black shadow-[0_0_40px_rgba(57,255,136,0.15)]"
      style={{ imageRendering: "pixelated", aspectRatio: `${GAME_W} / ${GAME_H}` }}
    />
  );
}
