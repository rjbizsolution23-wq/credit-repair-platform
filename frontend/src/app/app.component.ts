import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeModeService } from './core/services/theme-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Rick Jefferson Solutions - Credit Repair Platform';

  constructor(private themeModeService: ThemeModeService) {}

}
