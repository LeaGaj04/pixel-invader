import { createFileRoute } from "@tanstack/react-router";
import { ArcadeGame } from "@/components/ArcadeGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixel Invaders — Juego arcade retro 8-bit" },
      {
        name: "description",
        content:
          "Juega Pixel Invaders: un shooter espacial arcade 8-bit en canvas. Mueve tu nave, dispara láseres y destruye la formación alienígena.",
      },
      { property: "og:title", content: "Pixel Invaders — Juego arcade retro 8-bit" },
      {
        property: "og:description",
        content:
          "Shooter espacial pixel art con naves, láseres y explosiones. Flechas para moverte, espacio para disparar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main
      className="flex h-[100dvh] w-full touch-none flex-col items-center justify-center gap-4 overflow-hidden bg-[#05050f] px-3 py-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <h1
        className="text-center text-sm text-[#a45cff] sm:text-2xl"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        PIXEL INVADERS
      </h1>
      <ArcadeGame />
      <p
        className="hidden text-center text-[10px] leading-relaxed text-[#8891b5] sm:block"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        ← → MOVER · ESPACIO DISPARAR
      </p>
    </main>
  );
}
