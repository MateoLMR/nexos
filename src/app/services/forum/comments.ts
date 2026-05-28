import { Injectable } from '@angular/core';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from '@angular/fire/firestore';
//Aqui se importaron funciones de Firebase Auth

//El injectable sirve para poder usar este servicio en la app
@Injectable({
  providedIn: 'root'
})

export class CommentsService {

  //Conexion a la firestore
  constructor(
    private firestore: Firestore
  ) {}

  //Funcion de crear comentario
  async createComment(comment: any) {
    //Conexion a la coleccion de comments
    const commentsRef =
      collection(this.firestore, 'comments');

    //Guarda el comentario en la firebase (para la coleccion)
    return await addDoc(commentsRef, {
      //Guarda datos enviados
      ...comment,
      //Se guarda con fecha automatica
      createdAt: serverTimestamp()
    });

  }

  // Obtener los comentarios
  async getComments(postId: string) {

    //Conexion a la coleccion
    const commentsRef =
      collection(this.firestore, 'comments');

    //Busca comentarios del post
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      //Se ordenan por ascend en base a cuando se crearon
      orderBy('createdAt', 'asc')
    );

    //Obtiene los comentarios
    const snapshot = await getDocs(q);

    //Convierte los datos en array
    return snapshot.docs.map(doc => ({
      //se guarda el id
      id: doc.id,
      //Se guardan todos los datos del comentario
      ...doc.data()
    }));

  }

}
