# Nexos

El café internet de tu barrio, abierto toda la noche: un lugar para cualquier jugador que quiere resolver una duda, encontrar el precio más bajo de un juego, comparar dos juegos, seguir partidos de eSports en vivo o conversar en el foro.

**Sitio:** https://mateolmr.github.io/nexos/

## Qué tiene

- **Catálogo y detalle de juegos:** galería, valoración, ficha y juegos relacionados.
- **Precios del día:** ofertas de tiendas de PC (CheapShark) convertidas a pesos colombianos. Las tiendas populares van primero y se marca la más barata.
- **Plataformas:** en qué sistemas está cada juego (RAWG).
- **Comparar:** dos juegos frente a frente, con valoración y precio.
- **eSports:** partidos en vivo y próximos de Valorant, CS2, League of Legends y Dota 2 (PandaScore).
- **Foro:** publicaciones, likes y comentarios, con inicio de sesión de Google.
- **Perfil:** tu "cubículo", con tu foto, tus datos y el tiempo de sesión.

## Cómo está armado

```
Angular (GitHub Pages)  ──►  API en Vercel (nexos-proxy)  ──►  Neon Postgres
        │                           ├─► CheapShark (precios)
        │                           ├─► RAWG (plataformas)
        │                           └─► PandaScore (eSports)
        ├─► Firebase Auth (solo el login con Google)
        └─► Cloudflare R2 (imágenes y videos del catálogo)
```

- **Frontend:** Angular 21 (componentes standalone, signals), Tailwind CSS v4, GSAP para las animaciones y rutas con `#` para funcionar en GitHub Pages.
- **API:** funciones de Vercel que hablan con Neon y con las APIs externas. Las llaves y la cadena de conexión viven solo como variables de entorno en Vercel; el navegador nunca las ve.

## Estructura

```
src/app/
├─ core/          servicios (datos, auth, foro, perfil, eSports) e interceptor del token
├─ layout/        navbar y footer
├─ shared/        directivas (afiches, contadores), íconos y utilidades (animación, rutas)
└─ pages/         home, juegos, juego, comparar, esports, foro, perfil
public/           logo, avatares, imágenes de eSports y torneos, logos de la cinta
```

## Correrlo en local

Requisitos: Node.js 20 o superior.

```bash
npm install
```

Crea `src/environments/environment.ts` y `src/environments/environment.development.ts` (no se suben al repositorio) con la URL de la API y la configuración web de Firebase:

```ts
export const environment = {
  production: false,
  apiUrl: 'https://nexos-proxy.vercel.app/api',
  firebase: { apiKey: '…', authDomain: '…', projectId: '…', storageBucket: '…', messagingSenderId: '…', appId: '…' },
};
```

```bash
npm start
```

Abre http://localhost:4200.

## Publicar en GitHub Pages

```bash
npx ng build --base-href /nexos/
```

```bash
npx angular-cli-ghpages --dir=dist/nexos/browser
```

## Pruebas

```bash
npm test
```

## Créditos

Precios por [CheapShark](https://www.cheapshark.com) · Datos de juegos por [RAWG](https://rawg.io) · Partidos por [PandaScore](https://pandascore.co).
