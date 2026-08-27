# Plan: Enemigo "Platillo Veloz"

Añadir un segundo tipo de enemigo al motor del juego (`src/lib/game/engine.ts`): una nave especial que sobrevuela la parte superior, independiente de la cuadrícula de alienígenas.

## Comportamiento

- **Aparición ocasional**: mientras el juego está en curso, un temporizador aleatorio (cada ~12-20 segundos) hace aparecer el platillo por un borde lateral, en la parte superior de la pantalla (por encima de la formación, debajo del HUD). Solo puede haber uno activo a la vez.
- **Movimiento rápido con rebote**: se desplaza horizontalmente a alta velocidad (mayor que la formación, y aumenta levemente con cada oleada) y **rebota al tocar los bordes** izquierdo/derecho, permaneciendo en pantalla hasta ser destruido.
- **Resistencia de 3 impactos**: cada láser que lo impacta resta 1 de sus 3 puntos de vida.
- **Parpadeo rojo al recibir daño**: al ser impactado, el platillo se dibuja en rojo durante un instante (~0.15 s) y emite unas pocas chispas, como retroalimentación visual del daño.
- **Bonificación de 500 puntos**: al agotar sus 3 vidas explota con una ráfaga de partículas más grande que la de un alienígena normal y suma **+500** al puntaje. Mantiene la probabilidad estándar (15%) de soltar un power-up de Disparo Doble.
- **No dispara** al jugador ni desciende: es un objetivo de bonificación, no una amenaza directa.

## Cambios técnicos

Todo el trabajo ocurre en `src/lib/game/engine.ts` (lógica pura + dibujo en canvas, sin tocar React):

1. **Paleta**: nuevos colores para el platillo (cuerpo ámbar/dorado con acento oscuro para distinguirlo de los alienígenas morados) y reutilización del rojo `fire2` para el parpadeo de daño.
2. **Estado**: entidad `Saucer` opcional (`x, y, vx, hp, flash, alive`) y temporizador de aparición `saucerTimer`.
3. **Update**: cuenta regresiva de aparición, movimiento con rebote en bordes, colisión láser-platillo (antes que la de la cuadrícula, ya que vuela más arriba), reducción de HP, flash, explosión y +500 puntos.
4. **Draw**: función `drawSaucer()` pixel art (forma de platillo clásico: cúpula + cuerpo ancho + luces), con variante roja cuando `flash > 0`.
5. **Reinicio**: `start()` y `spawnWave()` limpian el platillo y reinician su temporizador.

## Verificación

- `tsgo --noEmit` sin errores.
- Prueba con Playwright: forzar aparición del platillo, comprobar movimiento/rebote, 3 impactos, parpadeo rojo y suma de 500 puntos; captura de pantalla.
