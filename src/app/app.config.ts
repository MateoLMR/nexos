import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

//Se Agregan estos imports para el funcionamiento de firebase (toco manual porque el angular esta en su ultima version y el firebase no lo soporta)
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

//config de nuestra firebase ¡¡NO TOCAR NADA!!
initializeApp(environment.firebase);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withHashLocation hace que las rutas usen #/ → compatible con GitHub Pages sin servidor
    provideRouter(routes, withHashLocation(),
    withInMemoryScrolling({ scrollPositionRestoration: 'top' })),

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ],
};
