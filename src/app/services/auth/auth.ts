import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { ProfileService } from '../perfil/perfil';
//Aqui se importaron funciones de Firebase Auth
//El injectable sirve para poder usar este servicio en la app

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //Se conecta a la firebase para poder autentificar
  constructor(
    private auth: Auth,
    private ProfileService: ProfileService
  ) {}


  //Funcion para logearse con google usando un import de firebase
  async loginWithGoogle() {
  try {
    //Se crea el proveedor de Google
    const provider = new GoogleAuthProvider();
    //Se guarda la sesion del usuario en la pestaña para que no cambia
    await setPersistence(
      this.auth,
      browserLocalPersistence
    );
    //Se abre el pop up de google para iniciar sesion en este pop up y manda a verificar en el auth
    const result = await signInWithPopup(
      this.auth,
      provider
    );

    //Retorna los datos del usuario encontrado en la BD y los entrega a la pagina
    const user = result.user;
    //Crea (o actualiza) el perfil en la base de datos con los datos del token
    await this.ProfileService.createProfile();
    return user;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

  //Solicitud de funcion de cerrar sesion del usuario desde el auth
  logout() {
    return signOut(this.auth);
  }

  //Retorna el usuario
  getCurrentUser(callback: any) {
    onAuthStateChanged(this.auth, callback);
  }
}
