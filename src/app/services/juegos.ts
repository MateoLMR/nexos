import { Injectable } from '@angular/core';

export interface Juego {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  tipo: string;
}

@Injectable({ providedIn: 'root' })
export class JuegosService {
  readonly juegos: Juego[] = [
    {
      id: 'ck3',
      titulo: 'Crusader Kings III',
      descripcion: 'Estrategia dinástica medieval. Gestiona tu linaje, forma alianzas y conquista reinos a través de generaciones.',
      imagen: '/Imagenes-juegos/Crusadersking3/Imagen-juego-1.png',
      tipo: 'Estrategia',
    },
    {
      id: 'cv1',
      titulo: 'Civilization 1991',
      descripcion: 'Estrategia 4X que fundó el género. Lidera una civilización desde la prehistoria hasta el espacio.',
      imagen: '/Imagenes/civilization1991.png',
      tipo: 'RPG',
    },
    {
      id: 'wt2',
      titulo: 'Warcraft II: Tides of Darkness',
      descripcion: 'Solidificó el RTS con fantasía épica. Orcos contra Humanos en batallas en tiempo real.',
      imagen: '/Imagenes/warcraft2.png',
      tipo: 'RPG',
    },
    {
      id: 'hm3',
      titulo: 'Heroes of Might and Magic III',
      descripcion: 'Estrategia por turnos y combate táctico de fantasía. Construye tu castillo y lidera héroes.',
      imagen: '/Imagenes/heroes of magic.png',
      tipo: 'RPG',
    },
    {
      id: 'ag4',
      titulo: 'Age of Empires IV',
      descripcion: 'Estrategia en tiempo real histórica. Lidera civilizaciones a través de eras épicas.',
      imagen: '/Imagenes/ag.png',
      tipo: 'Estrategia',
    },
    {
      id: 'tw3',
      titulo: 'Total War: Warhammer III',
      descripcion: 'Estrategia masiva por turnos con batallas tácticas colosales en tiempo real.',
      imagen: '/Imagenes/tw.png',
      tipo: 'Estrategia',
    },
    {
      id: 'stB',
      titulo: 'Starcraft: Brood War',
      descripcion: 'El RTS competitivo por excelencia. Construye tu ejército y domina las microtácticas de batalla.',
      imagen: '/Imagenes/st.png',
      tipo: 'RPG',
    },
    {
      id: 'mnl',
      titulo: 'Manor Lords',
      descripcion: 'Constructor de ciudades medievales con batallas tácticas masivas y economía realista.',
      imagen: '/Imagenes/mnl.png',
      tipo: 'Estrategia',
    },
    {
      id: 'xc2',
      titulo: 'Xcom 2',
      descripcion: 'Líder del género táctico por turnos. Combate alienígena por escuadrones.',
      imagen: '/Imagenes/xc2.png',
      tipo: 'RPG',
    },
  ];

  getJuegos(): Juego[] {
    return this.juegos;
  }

  getJuegoPorId(id: string): Juego | undefined {
    return this.juegos.find((j) => j.id === id);
  }

  getJuegoDestacado(): Juego | undefined {
    return this.getJuegoPorId('ag4');
  }

  filtrar(tipo: string, busqueda: string): Juego[] {
    return this.juegos.filter((j) => {
      const pasaTipo = tipo === 'todos' || j.tipo === tipo;
      const term = busqueda.toLowerCase().trim();
      const pasaBusqueda = !term || j.titulo.toLowerCase().includes(term);
      return pasaTipo && pasaBusqueda;
    });
  }
}
