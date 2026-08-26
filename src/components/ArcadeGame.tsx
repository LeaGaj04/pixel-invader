import { useEffect, useRef } from "react";
import { Game, GAME_H, GAME_W } from "@/lib/game/engine";

const HANDLED = new Set(["ArrowLeft", "ArrowRight", "Space", "Enter", "KeyA", "KeyD"]);

export function ArcadeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const game = new Game();
    gameRef.current = game;

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

    // Bloquear scroll/zoom por gestos sobre el juego
    const prevent = (e: Event) => e.preventDefault();
    canvas.addEventListener("touchstart", prevent, { passive: false });
    canvas.addEventListener("touchmove", prevent, { passive: false });
    let lastTap = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 350) e.preventDefault();
      lastTap = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    const onGesture = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", onGesture as EventListener);

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
      canvas.removeEventListener("touchstart", prevent);
      canvas.removeEventListener("touchmove", prevent);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("gesturestart", onGesture as EventListener);
      gameRef.current = null;
    };
  }, []);

  const hold = (code: string, down: boolean) => {
    const g = gameRef.current;
    if (!g) return;
    if (down) g.press(code);
    g.keys[code] = down;
  };

  const padProps = (code: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      hold(code, true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      hold(code, false);
    },
    onPointerCancel: () => hold(code, false),
    onPointerLeave: () => hold(code, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const btn =
    "select-none touch-none flex items-center justify-center border-2 border-primary/70 bg-primary/15 text-primary active:bg-primary/40 backdrop-blur-[1px]";

  return (
    <div className="relative flex w-full max-w-[720px] flex-1 items-center justify-center">
      <div className="relative w-full" style={{ aspectRatio: `${GAME_W} / ${GAME_H}` }}>
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          aria-label="Juego arcade retro de invasores espaciales"
          className="h-full w-full touch-none rounded-sm border-4 border-primary/60 bg-black shadow-[0_0_40px_rgba(57,255,136,0.15)]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Virtual pad táctil */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-2 sm:hidden">
        <div className="pointer-events-auto flex gap-2">
          <button
            {...padProps("ArrowLeft")}
            aria-label="Mover a la izquierda"
            className={`${btn} h-14 w-14 text-lg`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            ←
          </button>
          <button
            {...padProps("ArrowRight")}
            aria-label="Mover a la derecha"
            className={`${btn} h-14 w-14 text-lg`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            →
          </button>
        </div>
        <button
          {...padProps("Space")}
          aria-label="Disparar"
          className={`${btn} pointer-events-auto h-16 w-16 rounded-full text-sm`}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          A
        </button>
      </div>
    </div>
  );
}
