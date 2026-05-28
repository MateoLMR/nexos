import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Juegos } from './pages/juegos/juegos';
import { Juego } from './pages/juego/juego';
import { Comparar } from './pages/comparar/comparar';
import { Valorant } from './pages/esports/valorant/valorant';
import { Dota } from './pages/esports/dota/dota';
import { League } from './pages/esports/league/league';
import { Esports } from './pages/esports/esports';
import { Counter } from './pages/esports/counter/counter';
import { ForoHomeComponent } from './pages/foro/foro-home/foro-home';
import { Perfil } from './pages/perfil/perfil/perfil';


export const routes: Routes = [
  // Home page
   { path: '',        component: Home },
  // Juegos page
  { path: 'juegos',  component: Juegos},
  // Juego page
  { path: 'juego/:id',   component: Juego },
  // Comparar page
  { path: 'comparar',component: Comparar },
  // Esports page
  { path: 'esports', component: Esports },
  // Counter esports page
  { path: 'esports/counter',   component: Counter},
  // Dota esports page
  { path: 'esports/dota',      component: Dota},
  // League esports page
  { path: 'esports/league',    component: League },
  // Valorant esports page
  { path: 'esports/valorant',  component: Valorant },
  // Foro page
  { path: 'foro',    component: ForoHomeComponent },
  // Perfil page
  { path: 'perfil',  component: Perfil}

];
