import { Injectable } from '@angular/core';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc
} from '@angular/fire/firestore';
//Aqui se importaron funciones de Firebase Auth

//El injectable sirve para poder usar este servicio en la app
@Injectable({
  providedIn: 'root'
})
export class ForumService {

  //Conexion con la firestore
  constructor(private firestore: Firestore) {}

  //Crear publicación
  async createPost(post: any) {

    //Conexion a la coleccion posts
    const postsRef = collection(this.firestore, 'posts');

    //Guardar el post en firebase
    return await addDoc(postsRef, {
      //Guarda todos los datos necesarios que se piden en post (la coleccion)
      ...post,
      //Guarda con la fecha actual de la publicacion
      createdAt: serverTimestamp()
    });
  }

  //Obtener publicaciones
  async getPosts() {

    //Conexion a la coleccion posts
    const postsRef = collection(this.firestore, 'posts');
    //Obtiene el doc
    const snapshot = await getDocs(postsRef);

    //Convierte los tados en array
    return snapshot.docs.map(doc => ({
      //guarda el id del doc
      id: doc.id,
      //guarda los datos del post
      ...doc.data()
    }));
  }

  //Funcion para dar like a una publicacion
  async likePost(
    postId: string,
    userId: string
  ) {

    //Conexion al doc
    const postRef = doc(
      this.firestore,
      `posts/${postId}`
    );

    //Actualiza likes del post
    //Primero obtiene los datos del post
    const postSnap = await getDoc(postRef);
    //Si el post no existe en la BD se detiene la busqueda
    if (!postSnap.exists()) return;

    //Verificacion de que usuario (mediante el id) le dio like para no dar like duplicado
    const data: any = postSnap.data();
    const likedBy = data['likedBy'] || [];
    if (likedBy.includes(userId)) {
      return;
    }

    //Si el usuario no le habia dado like entonces hace dos acciones;
    // 1. da un like y 2. Se guarda en id del usuario en el arreglo de este doc para los likes registrando al usuario y verificando
    //que este ya le dio like a esta publi
    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: [...likedBy, userId]
    });
  }


}
