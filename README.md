# Leonida Heist Atlas

Mapa interactivo de puntos estratégicos para robos y farm de dinero **in-game** en GTA VI (Leonida), sobre el mapa estilo in-game de la comunidad gtadb.org con zoom y pan (Leaflet).

UI inspirada en MapGenie: mapa a pantalla completa, panel flotante con categorías agrupadas (Robos, Liquidez, Escape / Heat, Preparación) con icono y contador, mostrar/ocultar todo, búsqueda, popup por pin, progreso de "visitados" guardado en `localStorage`, etiquetas de región/barrio según zoom, modo Día/Noche (filtro visual sobre los mismos tiles), pantalla completa y deep links (`#id-del-pin`).

Filtros avanzados por región, seguridad y payout mínimo. Presets de rutas: bóvedas + escape, farm joyería → Yasmani, compounds, stick-ups low risk.

## Correr local

```bash
npm install
npm run dev
```

Abre `http://localhost:4731`.

## Datos

- **Mapa y coordenadas:** tiles `day` y landmarks de [gtadb.org](https://map.gtadb.org), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Los tiles se sirven vía jsDelivr desde el repo `rolux/gtadb.org`. Modificaciones: se añadieron pins propios.
- **Pins:** borde sólido = posición exacta de un landmark de gtadb; borde punteado = centroide del barrio (calculado de los landmarks de gtadb) porque el sitio exacto aún no está mapeado.
- **Gasolineras, supermercados, aeropuertos, tren/metro, mod shops y hospitales:** extraídos de los landmarks de gtadb con `node scripts/extract-landmarks.mjs` (genera `src/data/landmarkPins.ts`).
- **Payouts y tips:** guías post-lanzamiento (PowerPyx, gta6activities, thegta6map, Mobalytics, sixthstar).

No es el mapa oficial de Rockstar. Solo para uso dentro del videojuego.
