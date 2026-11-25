import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { ToastComponent } from './components/toast/toast';
import { AiHelpWidgetComponent } from './components/ai-help-widget/ai-help-widget';

@Component({
  selector: 'app-root',
  imports: [AiHelpWidgetComponent, HeaderComponent, RouterLink, RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
