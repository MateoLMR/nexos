import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ActivatedRouteSnapshot, provideRouter, ViewTransitionInfo, withHashLocation, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

//Se Agregan estos imports para el funcionamiento de firebase (toco manual porque el angular esta en su ultima version y el firebase no lo soporta)
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { environment } from '../environments/environment';

//config de nuestra firebase ¡¡NO TOCAR NADA!!
initializeApp(environment.firebase);

// Ruta sin parámetros de una navegación (p. ej. "juego/ck3"), para saber si cambió de página
function rutaDe(s: ActivatedRouteSnapshot | null): string {
  const partes: string[] = [];
  for (let r = s; r; r = r.firstChild) partes.push(...r.url.map((u) => u.path));
  return partes.join('/');
}

// Al cambiar de página se empieza arriba. La transición y ScrollTrigger pueden devolver la posición
// anterior, así que se sube cuando el DOM nuevo está listo y otra vez al terminar la transición.
// Cambiar solo los parámetros (Comparar ?a=…) no cuenta como cambio de página.
function subirAlCambiarDePagina({ transition, from, to }: ViewTransitionInfo) {
  if (rutaDe(from) === rutaDe(to)) return;
  const subir = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  transition.updateCallbackDone.then(subir, () => {});
  transition.finished.then(subir, subir);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withHashLocation hace que las rutas usen #/ → compatible con GitHub Pages sin servidor
    // withViewTransitions anima el cambio de página (y el "viaje" de la portada del catálogo al detalle)
    provideRouter(routes, withHashLocation(),
    withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: subirAlCambiarDePagina })),

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Firebase se usa solo para el login con Google; los datos van a la API (Neon)
    provideAuth(() => getAuth()),
    // HttpClient con el interceptor que agrega el token de Firebase a las peticiones de la API
    provideHttpClient(withInterceptors([tokenInterceptor])),
  ],
};
