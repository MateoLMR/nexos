import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

//Se Agregan estos imports para el funcionamiento de firebase (toco manual porque el angular esta en su ultima version y el firebase no lo soporta)
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { tokenInterceptor } from './services/auth/token.interceptor';
import { environment } from '../environments/environment';

//config de nuestra firebase ¡¡NO TOCAR NADA!!
initializeApp(environment.firebase);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withHashLocation hace que las rutas usen #/ → compatible con GitHub Pages sin servidor
    // withViewTransitions anima el cambio de página (y el "viaje" de la portada del catálogo al detalle)
    provideRouter(routes, withHashLocation(),
    withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    withViewTransitions({ skipInitialTransition: true })),

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Firebase se usa solo para el login con Google; los datos van a la API (Neon)
    provideAuth(() => getAuth()),
    // HttpClient con el interceptor que agrega el token de Firebase a las peticiones de la API
    provideHttpClient(withInterceptors([tokenInterceptor])),
  ],
};
