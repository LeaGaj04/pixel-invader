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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#05050f] px-4 py-10">
      <h1
        className="text-center text-xl text-[#a45cff] sm:text-2xl"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        PIXEL INVADERS
      </h1>
      <ArcadeGame />
      <p
        className="text-center text-[10px] leading-relaxed text-[#8891b5]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        ← → MOVER · ESPACIO DISPARAR
      </p>
    </main>
  );
}
