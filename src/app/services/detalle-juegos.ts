import { Injectable } from '@angular/core';

export interface Rating { label: string; valor: number; }
export interface Tienda { nombre: string; precio: string; url: string; }
export interface MediaItem { tipo: 'video' | 'image'; src: string; thumb: string; }

export interface DetalleJuego {
  titulo: string;
  genero: string;
  lanzamiento: number;
  plataformas: string;
  descripcionLarga: string;
  imagen: string;
  Creador: string;
  tipo: string;
  ratings: Rating[];
  tiendas: Tienda[];
  galeria: MediaItem[];
  pros: string[];
  contras: string[];
}

@Injectable({ providedIn: 'root' })
export class DetalleJuegosService {
  private readonly data: Record<string, DetalleJuego> = {
    ck3: {
      titulo: 'Crusader Kings III',
      genero: 'Gran Estrategia · Rol',
      lanzamiento: 2020,
      plataformas: 'PC · PS5 · Xbox Series',
      descripcionLarga:
        'Crusader Kings III te pone al mando de una dinastía medieval. La estrategia aquí no se centra solo en el campo de batalla, sino en la intriga, la diplomacia, los matrimonios y la gestión de tu linaje a lo largo de generaciones.',
      imagen: 'Imagenes-juegos/Crusadersking3/Imagen-juego-1.png',
      Creador: 'Paradox Development Studio',
      tipo: 'Estrategia',
      ratings: [
        { label: 'Dificultad', valor: 85 },
        { label: 'Rejugabilidad', valor: 95 },
        { label: 'Historia', valor: 90 },
        { label: 'Multijugador', valor: 60 },
      ],
      tiendas: [
        { nombre: 'Steam', precio: '157.600 COP', url: 'https://store.steampowered.com/app/1158310/Crusader_Kings_III/' },
        { nombre: 'Microsoft Store', precio: '152.900 COP', url: 'https://www.xbox.com/es-co/games/store/crusader-kings-iii/9mz8rzsd0nfq' },
        { nombre: 'Eneba (KEY)', precio: '49.031 COP', url: 'https://www.eneba.com/latam/steam-crusader-kings-iii-steam-key-latam' },
        { nombre: 'InstantGaming (KEY)', precio: '8.99 €', url: 'https://www.instant-gaming.com/es/17664-comprar-crusader-kings-iii-pc-mac-juego-steam-latin-america/' },
      ],
      galeria: [
        { tipo: 'video', src: 'Videos-juegos/Crusader Kings III - Gameplay Teaser.mp4', thumb: 'Imagenes-juegos/Crusadersking3/Imagen-juego-1.png' },
        { tipo: 'video', src: 'Videos-juegos/Crusader Kings 3 - Official Story Trailer.mp4', thumb: 'Imagenes-juegos/Crusadersking3/Imagen-juego-1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/imgck2.png', thumb: 'Imagenes-juegos/Crusadersking3/imgck2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/imgck3.png', thumb: 'Imagenes-juegos/Crusadersking3/imgck3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/imgck4.png', thumb: 'Imagenes-juegos/Crusadersking3/imgck4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/imgck5.png', thumb: 'Imagenes-juegos/Crusadersking3/imgck5.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/imgck6.png', thumb: 'Imagenes-juegos/Crusadersking3/imgck6.png' },
      ],
      pros: ['Sistema de dinastías y personajes inigualable.', 'Alto valor de rejugabilidad por las intrigas de rol.', 'Excelentes gráficos para un juego de Gran Estrategia.'],
      contras: ['Curva de aprendizaje muy alta para principiantes.', 'El componente militar es más simple que en otros títulos.', 'Requiere múltiples DLCs para la experiencia completa.'],
    },
    cv1: {
      titulo: 'Civilization 1991',
      genero: '4X · Gestión · Por Turnos',
      lanzamiento: 1991,
      plataformas: 'PC (DOS)',
      descripcionLarga:
        'El pilar de los juegos de estrategia por turnos. Creado por Sid Meier, Civilization estableció el modelo 4X (eXplorar, eXpandir, eXplotar, eXterminar) donde controlas una civilización a lo largo de miles de años.',
      imagen: 'Imagenes/civilization1991.png',
      Creador: 'MicroProse / 2K',
      tipo: 'RPG',
      ratings: [
        { label: 'Dificultad', valor: 55 },
        { label: 'Rejugabilidad', valor: 80 },
        { label: 'Historia', valor: 70 },
        { label: 'Multijugador', valor: 10 },
      ],
      tiendas: [{ nombre: 'No se encuentra actualmente en ninguna tienda', precio: '—', url: '/juegos' }],
      galeria: [
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv1.png', thumb: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv2.png', thumb: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv3.png', thumb: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv4.png', thumb: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv5.png', thumb: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv5.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv6.png', thumb: 'Imagenes-juegos/Crusadersking3/civilization1991/imgcv6.png' },
      ],
      pros: ['Fórmula 4X clásica, perfecta para la estrategia pura.', 'Excelente por su valor histórico en el género.'],
      contras: ['Gráficos extremadamente anticuados (solo nostálgicos).', 'Mecánicas de juego muy sencillas comparadas con las versiones modernas.'],
    },
    wt2: {
      titulo: 'Warcraft II: Tides of Darkness',
      genero: 'RTS · Fantasía',
      lanzamiento: 1995,
      plataformas: 'PC (DOS/Windows) · Mac',
      descripcionLarga:
        'Warcraft II solidificó la fórmula de la Estrategia en Tiempo Real (RTS) con una adición clave de fantasía épica. Su éxito fue crucial para la explosión del multijugador en línea.',
      imagen: 'Imagenes/warcraft2.png',
      Creador: 'Blizzard Entertainment',
      tipo: 'RPG',
      ratings: [
        { label: 'Dificultad', valor: 65 },
        { label: 'Rejugabilidad', valor: 70 },
        { label: 'Historia', valor: 75 },
        { label: 'Multijugador', valor: 80 },
      ],
      tiendas: [{ nombre: 'Battle.net', precio: '41.480 COP', url: 'https://us.shop.battle.net/es-es/product/warcraft-2-battle-net-edition?p=1652739' }],
      galeria: [
        { tipo: 'video', src: 'Videos-juegos/Warcraft 2 Intro.mp4', thumb: 'Imagenes/warcraft2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Warcraft2/imgwt1.png', thumb: 'Imagenes-juegos/Crusadersking3/Warcraft2/imgwt1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Warcraft2/imgwt2.png', thumb: 'Imagenes-juegos/Crusadersking3/Warcraft2/imgwt2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Warcraft2/imgwt3.png', thumb: 'Imagenes-juegos/Crusadersking3/Warcraft2/imgwt3.png' },
      ],
      pros: ['Fórmula RTS pura, esencial para los fans del género.', 'Banda sonora y voz en off icónicas.', 'Campañas históricas y muy rejugables.'],
      contras: ['Gráficos anticuados (solo para nostálgicos).', 'Sin soporte multijugador moderno oficial.'],
    },
    hm3: {
      titulo: 'Heroes of Might and Magic III',
      genero: 'Estrategia por Turnos · Fantasía',
      lanzamiento: 1999,
      plataformas: 'PC · Mac',
      descripcionLarga:
        'Considerado el pico de la saga Heroes. Combina exploración del mapa, gestión de ciudades y combates tácticos por turnos en un mundo de fantasía rico en lore.',
      imagen: 'Imagenes/heroes of magic.png',
      Creador: 'New World Computing',
      tipo: 'RPG',
      ratings: [
        { label: 'Dificultad', valor: 70 },
        { label: 'Rejugabilidad', valor: 95 },
        { label: 'Historia', valor: 80 },
        { label: 'Multijugador', valor: 85 },
      ],
      tiendas: [
        { nombre: 'GOG.com (Complete Edition)', precio: '9.99 US', url: 'https://www.gog.com/game/heroes_of_might_and_magic_3_complete_edition' },
      ],
      galeria: [
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm1.png', thumb: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm2.png', thumb: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm3.png', thumb: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm4.png', thumb: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm5.png', thumb: 'Imagenes-juegos/Crusadersking3/heroesmagic/imghm5.png' },
      ],
      pros: ['El mejor juego de estrategia por turnos de su era.', 'Enorme cantidad de contenido y multijugador local.', 'Disponible en GOG a bajo precio.'],
      contras: ['Gráficos obsoletos.', 'La IA del juego puede ser muy predecible.'],
    },
    ag4: {
      titulo: 'Age of Empires IV',
      genero: 'RTS · Histórico',
      lanzamiento: 2021,
      plataformas: 'PC · Xbox Series · PS5',
      descripcionLarga:
        'El gran regreso de la saga RTS más aclamada. AoE IV refina la fórmula clásica de construcción de base y guerra con ocho civilizaciones únicas y campañas históricas bien narradas.',
      imagen: 'Imagenes/ag.png',
      Creador: 'Relic Entertainment',
      tipo: 'Estrategia',
      ratings: [
        { label: 'Dificultad', valor: 60 },
        { label: 'Rejugabilidad', valor: 85 },
        { label: 'Historia', valor: 88 },
        { label: 'Multijugador', valor: 90 },
      ],
      tiendas: [
        { nombre: 'Eneba (Key)', precio: '51.201 COP', url: 'https://www.eneba.com/es/steam-age-of-empires-iv-steam-key-global/gaming4life?product=digital&currency=COP' },
        { nombre: 'Steam (Anniversary Edition)', precio: '28.875 COP', url: 'https://store.steampowered.com/app/1466860/Age_of_Empires_IV_Anniversary_Edition/' },
        { nombre: 'PlayStation Store', precio: '39.99 US', url: 'https://store.playstation.com/es-co/product/UP6312-PPSA25366_00-0950569117932928/' },
        { nombre: 'Microsoft Store (Anniversary)', precio: '82.500 COP', url: 'https://www.xbox.com/es-CO/games/age-of-empires-iv#purchaseoptions' },
      ],
      galeria: [
        { tipo: 'video', src: 'Videos-juegos/age-video.mp4', thumb: 'Imagenes/ag.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag1.png', thumb: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag2.png', thumb: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag3.png', thumb: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag4.png', thumb: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag5.png', thumb: 'Imagenes-juegos/Crusadersking3/AgeofEmpires4/imgag5.png' },
      ],
      pros: ['Juego de RTS con alta calidad de producción y jugabilidad.', 'Civilizaciones asimétricas que requieren estrategias diferentes.', 'Excelente modo campaña y tutoriales para nuevos jugadores.'],
      contras: ['El balance entre civilizaciones ha sido un desafío constante.', 'Estilo visual menos detallado que AoE III Definitive Edition.'],
    },
    tw3: {
      titulo: 'Total War: Warhammer III',
      genero: 'Gran Estrategia · Táctico',
      lanzamiento: 2022,
      plataformas: 'PC · Mac',
      descripcionLarga:
        'El épico final de la trilogía Total War Warhammer. Combina la gestión de un imperio por turnos con batallas masivas en tiempo real. Conocido por su enorme escala y variedad de facciones fantásticas.',
      imagen: 'Imagenes/tw.png',
      Creador: 'Creative Assembly',
      tipo: 'Estrategia',
      ratings: [
        { label: 'Dificultad', valor: 75 },
        { label: 'Rejugabilidad', valor: 92 },
        { label: 'Historia', valor: 70 },
        { label: 'Multijugador', valor: 78 },
      ],
      tiendas: [
        { nombre: 'Eneba (Key)', precio: '67.160 COP', url: 'https://www.eneba.com/es/steam-total-war-warhammer-iii-pc-steam-key-global/frosty-entertainment?product=digital&currency=COP' },
        { nombre: 'Steam', precio: '52.500 COP', url: 'https://store.steampowered.com/app/1142710/Total_War_WARHAMMER_III/' },
      ],
      galeria: [
        { tipo: 'video', src: 'Videos-juegos/tw-trailer.mp4', thumb: 'Imagenes/tw.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw1.png', thumb: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw2.png', thumb: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw3.png', thumb: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw4.png', thumb: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw5.png', thumb: 'Imagenes-juegos/Crusadersking3/TotalWar3/imgtw5.png' },
      ],
      pros: ['Batallas tácticas masivas y visualmente impactantes.', 'Variedad increíble de facciones y unidades únicas.', 'Mapa de campaña enorme con un alto valor de rejugabilidad.'],
      contras: ['Tiempos de carga lentos en el mapa de campaña.', 'Curva de dificultad muy alta debido a la gran cantidad de mecánicas.'],
    },
    stB: {
      titulo: 'StarCraft: Brood War',
      genero: 'RTS · eSports',
      lanzamiento: 1998,
      plataformas: 'PC · Mac',
      descripcionLarga:
        'Considerado por muchos como el pináculo del RTS competitivo. StarCraft: Brood War definió la jugabilidad asimétrica y la alta habilidad mecánica requerida en el género.',
      imagen: 'Imagenes/st.png',
      Creador: 'Blizzard Entertainment',
      tipo: 'RPG',
      ratings: [
        { label: 'Dificultad', valor: 95 },
        { label: 'Rejugabilidad', valor: 98 },
        { label: 'Historia', valor: 85 },
        { label: 'Multijugador', valor: 100 },
      ],
      tiendas: [{ nombre: 'Battle.net (Gratis)', precio: '0,00 €', url: 'https://us.shop.battle.net/es-mx/product/starcraft-remastered' }],
      galeria: [
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st1.png', thumb: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st2.png', thumb: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st3.png', thumb: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st4.png', thumb: 'Imagenes-juegos/Crusadersking3/Starcraftbrood/st4.png' },
      ],
      pros: ['El balance competitivo es legendario e inalterado.', 'Esencial para entender la historia de los eSports.', 'El juego base es gratuito.'],
      contras: ['Mecánicas de interfaz muy anticuadas y rudas.', 'Requiere mucha práctica para ser medianamente competente.'],
    },
    mnl: {
      titulo: 'Manor Lords',
      genero: 'Constructor de Ciudades · Táctico',
      lanzamiento: 2024,
      plataformas: 'PC',
      descripcionLarga:
        'Combina la construcción de ciudades medievales con batallas tácticas masivas en tiempo real. Se enfoca en la gestión de recursos, la expansión territorial y el desarrollo orgánico de asentamientos.',
      imagen: 'Imagenes/mnl.png',
      Creador: 'Slavic Magic',
      tipo: 'Estrategia',
      ratings: [
        { label: 'Dificultad', valor: 65 },
        { label: 'Rejugabilidad', valor: 78 },
        { label: 'Historia', valor: 50 },
        { label: 'Multijugador', valor: 30 },
      ],
      tiendas: [
        { nombre: 'Steam', precio: '99.900 COP', url: 'https://store.steampowered.com/app/1363080/Manor_Lords/?l=spanish' },
        { nombre: 'Xbox', precio: '64.285 COP', url: 'https://www.xbox.com/es-CO/games/store/manor-lords-game-preview/9p5f966564fs' },
        { nombre: 'Epic Games', precio: '64.935 COP', url: 'https://store.epicgames.com/es-ES/p/manor-lords-ef795f' },
        { nombre: 'Eneba (Key)', precio: '74.734 COP', url: 'https://www.eneba.com/latam/steam-manor-lords-pc-steam-key-global' },
        { nombre: 'GOG.com', precio: '13.29 US', url: 'https://www.gog.com/en/game/manor_lords' },
      ],
      galeria: [
        { tipo: 'video', src: 'Videos-juegos/manorgameplay.mp4', thumb: 'Imagenes/mnl.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Manorlords/mnl1.png', thumb: 'Imagenes-juegos/Manorlords/mnl1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Manorlords/mnl2.png', thumb: 'Imagenes-juegos/Manorlords/mnl2.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Manorlords/mnl3.png', thumb: 'Imagenes-juegos/Manorlords/mnl3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Manorlords/mnl4.png', thumb: 'Imagenes-juegos/Manorlords/mnl4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Manorlords/mnl5.png', thumb: 'Imagenes-juegos/Manorlords/mnl5.png' },
      ],
      pros: ['Gráficos impresionantes y ambientación medieval inmersiva.', 'Innovadora combinación de gestión de ciudades y batallas RTS.', 'Profundo sistema de gestión de recursos y logística.'],
      contras: ['El juego está en acceso anticipado (Early Access).', 'La IA del combate puede ser mejorada.'],
    },
    xc2: {
      titulo: 'XCOM 2',
      genero: 'Táctico por Turnos · Ciencia Ficción',
      lanzamiento: 2016,
      plataformas: 'PC · PS4 · Xbox One · Switch',
      descripcionLarga:
        'Un líder del género táctico por turnos. Combina la gestión estratégica de tu base y tecnología con combates tácticos por escuadrones en misiones procedurales.',
      imagen: 'Imagenes/xc2.png',
      Creador: 'Firaxis Games',
      tipo: 'RPG',
      ratings: [
        { label: 'Dificultad', valor: 88 },
        { label: 'Rejugabilidad', valor: 90 },
        { label: 'Historia', valor: 82 },
        { label: 'Multijugador', valor: 45 },
      ],
      tiendas: [
        { nombre: 'Steam', precio: '5.450 COP', url: 'https://store.steampowered.com/app/268500/XCOM_2/?l=spanish' },
        { nombre: 'Xbox', precio: '11.495 COP', url: 'https://www.xbox.com/es-CO/games/store/xcom-2/BQWGBMCKRMSQ/0001' },
        { nombre: 'PlayStation', precio: '8.99 US', url: 'https://www.playstation.com/es-co/games/xcom-2/' },
        { nombre: 'Eneba (Key)', precio: '8.259 COP', url: 'https://www.eneba.com/latam/steam-xcom-2-steam-key-global' },
      ],
      galeria: [
        { tipo: 'image', src: 'Imagenes-juegos/Xcom2/xc1.png', thumb: 'Imagenes-juegos/Xcom2/xc1.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Xcom2/xc3.png', thumb: 'Imagenes-juegos/Xcom2/xc3.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Xcom2/xc4.png', thumb: 'Imagenes-juegos/Xcom2/xc4.png' },
        { tipo: 'image', src: 'Imagenes-juegos/Xcom2/xc5.png', thumb: 'Imagenes-juegos/Xcom2/xc5.png' },
      ],
      pros: ['Combate táctico por turnos muy profundo y satisfactorio.', 'Gran rejugabilidad gracias a los mapas procedurales.', 'Alta inmersión en la gestión de la base y personalización de escuadrones.'],
      contras: ["La dificultad es muy elevada (conocida como 'XCOM difficulty').", 'El componente de gestión puede volverse repetitivo.'],
    },
  };

  getTodos(): Record<string, DetalleJuego> {
    return this.data;
  }

  getPorId(id: string): DetalleJuego | undefined {
    return this.data[id];
  }

  getClaseTienda(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('steam')) return 'tienda-steam';
    if (n.includes('xbox') || n.includes('microsoft')) return 'tienda-xbox';
    if (n.includes('playstation') || n.includes('ps')) return 'tienda-ps';
    if (n.includes('epic')) return 'tienda-epic';
    if (n.includes('gog')) return 'tienda-gog';
    if (n.includes('eneba') || n.includes('instant') || n.includes('key')) return 'tienda-key';
    if (n.includes('battle')) return 'tienda-battle';
    return 'tienda-otro';
  }
}
