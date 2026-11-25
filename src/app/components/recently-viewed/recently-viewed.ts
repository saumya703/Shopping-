import { Component, inject } from '@angular/core';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-recently-viewed',
  imports: [ProductCardComponent],
  templateUrl: './recently-viewed.html',
  styleUrl: './recently-viewed.scss',
})
export class RecentlyViewedComponent {
  protected readonly recentlyViewed = inject(RecentlyViewedService);
}
