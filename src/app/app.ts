import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { BitTendero } from './shared/ui/mascotas/bit-tendero';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Navbar,Footer,BitTendero],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}

