import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { ProfileService } from '../../../services/perfil/perfil';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil {
  auth = inject(Auth);
  profileService = inject(ProfileService);
  user = this.auth.currentUser;
  profileData: any = null;

  //Funcion al apenas iniciar para intentar mostrar el perfil y datos
  async ngOnInit() {
    if (!this.user) return;
    // intentar obtener perfil
    const data =
      await this.profileService
      .getProfile(this.user.uid);

    // si no existe, crear uno
    if (!data) {

      const defaultProfile = {

        displayName:
          this.user.displayName,

        photoURL:
          this.user.photoURL,

        bio:
          'Hardcore Gamer 🎮',

        favoriteGames: [
          'Valorant',
          'Elden Ring'
        ],

        banner:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e'

      };

      this.profileData =
        defaultProfile;

    } else {

      this.profileData = data;

    }

  }

}
