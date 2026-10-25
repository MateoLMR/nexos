# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Cualquier gamer, de cualquier plataforma y género. Llega con una duda sobre un juego, buscando dónde comprarlo más barato, para conversar con otros jugadores o para enterarse de qué pasa en los eSports.

## Product Purpose
Nexos es un punto de encuentro (un "nexo") para jugadores: un catálogo de juegos con detalle y comparación, precios por tienda y plataforma, un foro para preguntar y conversar, y noticias y partidos de eSports. Tiene éxito cuando cualquier jugador resuelve su duda o encuentra su oferta y se queda a conversar.

## Positioning
Nexos empezó como un sitio exclusivo de juegos de estrategia y creció para ser la casa de todo tipo de jugador. Su hilo es la historia que nos trajo hasta aquí como jugadores: un lugar donde cualquiera se sienta en casa.

## Operating Context
- Sitio Angular publicado en GitHub Pages (rutas con hash).
- Datos en Neon Postgres a través de una API en Vercel (nexos-proxy).
- Login con Google (Firebase Auth).
- Partidos de eSports desde PandaScore (Valorant, CS2, League of Legends, Dota 2).

## Capabilities and Constraints
- Catálogo de juegos con filtro y búsqueda, detalle (ratings, tiendas con precio, galería, pros y contras) y comparación entre dos juegos.
- Foro: publicar, dar o quitar like y comentar, con sesión.
- Perfil del usuario logueado.
- eSports: partidos en vivo y próximos por juego.
- Los precios están guardados como texto, por tienda (COP, US, €); no hay historial de precios ni alertas.
- Proyecto académico en evolución.

## Brand Commitments
- Nombre "Nexos" y logo existente (`public/Imagenes/Logo.png`).
- Esencia: el mundo gamer y su historia; un lugar donde cualquier jugador se sienta en casa.

## Evidence on Hand
- Arte y capturas de 9 juegos en `public/Imagenes`, `public/Imagenes-juegos` y `public/Videos-juegos`.
- Imágenes de eSports en `public/Imagenes-esports` y logos en `public/Logos-Juegos`.
- No hay testimonios, cifras de usuarios ni alianzas con tiendas; no se deben inventar.

## Product Principles
1. Cualquier jugador es bienvenido: nada asume un género, una plataforma o un nivel.
2. Datos reales primero: precios, partidos y publicaciones vienen de la base de datos o de APIs, nunca inventados.
3. Resolver rápido: la duda, la oferta o el partido deben encontrarse en segundos.
4. Comunidad sobre vitrina: el foro y la conversación pesan tanto como el catálogo.

## Accessibility & Inclusion
Contraste AA, navegación por teclado y respeto por "reducir movimiento" en todas las animaciones.
