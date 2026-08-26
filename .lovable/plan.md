# Arcade retro 2D: invasión espacial 8-bit

Juego completo en un `<canvas>` HTML5 dentro de React, con estética pixel art 8-bit y bucle de juego propio (sin librerías externas).

## Pantalla y estilo
- Canvas de resolución interna baja (p. ej. 320x240) escalado con `image-rendering: pixelated` para pixels nítidos.
- Fondo negro espacial con estrellas cuadradas blancas de 1-2 px que caen a distintas velocidades (scroll infinito).
- Tipografía blocky arcade (fuente pixel vía Google Fonts en el head del root) para todo el HUD.
- HUD: arriba izquierda 4 iconos verdes de vida; arriba derecha el score en verde neón.

## Jugabilidad
- Nave del jugador abajo al centro: movimiento fluido izquierda/derecha con flechas (estado de teclas presionadas, no repetición de teclado), limitada a los bordes.
- Disparo con barra espaciadora: láser celeste segmentado, con cadencia limitada.
- Enemigos: formación 3x6 de alienígenas morados, movimiento en bloque lateral; al tocar un borde, toda la formación baja un escalón e invierte dirección, acelerando a medida que quedan menos enemigos.
- Enemigos disparan proyectiles hacia abajo de forma aleatoria (solo los de la fila inferior de cada columna).
- Colisiones: láser-enemigo (puntos + destrucción), proyectil-jugador (pierde vida + breve invulnerabilidad), enemigos que llegan abajo (game over).
- Al limpiar la formación aparece una oleada nueva más rápida.

## Efectos
- Explosión de partículas naranjas y rojas al destruir un enemigo (y al perder una vida), con vida útil corta y píxeles cuadrados.
- Parpadeo del jugador durante la invulnerabilidad.

## Estados del juego
- `start`: pantalla "PRESS START" con título parpadeante; empieza con Espacio o Enter.
- `playing`: bucle activo.
- `gameover`: "GAME OVER", score final y opción de reiniciar.

## Detalles técnicos
- Ruta: se reescribe `src/routes/index.tsx` (reemplaza el placeholder) con `head()` propio: título, descripción, og y twitter.
- Componentes nuevos en `src/components/`: `ArcadeGame.tsx` (canvas + bucle) y lógica de juego en `src/lib/game/` (entidades, actualización, dibujo) para mantener el componente delgado.
- Bucle con `requestAnimationFrame` y delta-time; estado del juego en `useRef` para evitar re-renders; solo score/vidas/estado se reflejan en React si hace falta para el HUD (o se dibujan directo en canvas).
- Listeners de teclado montados en `useEffect`, con limpieza; `preventDefault` en flechas y espacio.
- Todo el render dentro del canvas; los colores se definen como constantes de paleta 8-bit del juego.
- Sin backend: no requiere base de datos ni persistencia (se puede añadir high score con Lovable Cloud más adelante si se desea).
