import { Injectable } from '@angular/core';

import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private firestore: Firestore) {}

  // 🔥 Crear perfil
  async createProfile(user: any) {

    const profileRef = doc(
      this.firestore,
      `profiles/${user.uid}`
    );

    const profileSnap = await getDoc(profileRef);

    // Evita duplicados
    if (profileSnap.exists()) return;

    await setDoc(profileRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: user.photoURL,
      bio: 'Jugador de Nexos 🎮',
      createdAt: new Date()
    });

  }

  // 📥 Obtener perfil
  async getProfile(uid: string) {

    const profileRef = doc(
      this.firestore,
      `profiles/${uid}`
    );

    const snapshot = await getDoc(profileRef);

    return snapshot.data();

  }

}
