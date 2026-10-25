---
version: 1
slug: "src-app-pages-home-home-html"
primary_target: "src/app/pages/home/home.html"
related_targets: ["src/app/pages/juegos/juegos.html","src/app/pages/juego/juego.html","src/app/pages/comparar/comparar.html","src/app/pages/foro/foro-home/foro-home.html","src/app/pages/esports/esports.html","src/app/pages/perfil/perfil/perfil.html","src/app/components/navbar/navbar.html"]
---

## Scope

Home de Nexos (`src/app/pages/home`) y, por extensión, el sistema visual de todo el sitio. Modo: Persuade en el home; Operate en catálogo, foro, eSports y perfil.

## Audience and job

Cualquier gamer con una duda, buscando una oferta, queriendo conversar o siguiendo los eSports. Acción principal: buscar un juego, una duda o una oferta desde el primer pantallazo.

## Direction contract

THESIS: Nexos es el café internet de tu barrio a las 9 de la noche, abierto para cualquier jugador. Rechaza el portal oscuro de eSports con neón morado-fucsia y la grilla de tarjetas iguales bajo un titular centrado.

OWN-WORLD: Paleta "luces apagadas": pared #14121C, cubículo #2A1F45 / #3A2C5E, morado Nexos #6D3BD2 para acciones, letrero ámbar #FFB020 para precios y ofertas, verde temporizador #3DDC84 para lo que está en vivo, luz de monitor #E8EEFF para el texto. Letreros en Bricolage Grotesque, interfaz en Onest y precios, marcadores y temporizador en JetBrains Mono. Tarjetas como cubículos (esquinas de 4px, borde de 1px) y afiches pegados con cinta, levemente rotados. Sin neón, sin vidrio, sin degradados.

STORY: El visitante entra al local: el letrero se enciende, ve qué hay hoy en la pared (torneo, precios, dudas nuevas), busca lo que necesita en el mostrador y, si quiere quedarse, se sienta en un cubículo (inicia sesión) para conversar.

FIRST VIEWPORT: Arriba, una barra-mostrador con el letrero "Nexos · abierto" que se enciende como un tubo de luz, la navegación y el cubículo de sesión con temporizador. A la izquierda, en grande, la pregunta "¿Qué buscas hoy?" y el buscador del mostrador como acción principal, que filtra el catálogo real en vivo y lleva al juego. A la derecha, la pared de tres afiches rotados: "Precios de hoy" (tablero ámbar con filas de game_stores y números que ruedan), el torneo destacado (PandaScore, con el punto verde en vivo) y "Dudas nuevas" del foro. Debajo arranca la sección de recomendados.

FORM: café internet, elegido por el usuario en la ronda de dirección (paleta B "luces apagadas"). No se tiró concept-seed: la dirección fue fijada por el usuario y una dirección fijada gana sobre la tirada. seed: none (roll skipped: direction pinned by the user)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction and motion

Letrero que se enciende (una vez por sesión), afiches que se despegan en 3D al pasar el mouse, tablero de precios con números que ruedan, View Transitions con morph de la portada del catálogo al detalle, Flip al filtrar, ScrollTrigger con ritmo variado, temporizador de sesión. Todo cae a fundidos cortos con prefers-reduced-motion.

## Unresolved

Ninguna decisión de producto pendiente. Build code-led (sin generador de imágenes).
