import { computed, Injectable, signal } from '@angular/core';
import { ProductService } from './product.service';

const MAX_RECENT_PRODUCTS = 4;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private readonly productIds = signal<string[]>([]);

  readonly products = computed(() =>
    this.productIds()
      .map((id) => this.productService.getById(id))
      .filter((product) => product !== undefined),
  );

  constructor(private readonly productService: ProductService) {}

  record(productId: string): void {
    if (!this.productService.getById(productId)) {
      throw new Error(`Cannot record unknown product "${productId}" as recently viewed.`);
    }

    this.productIds.update((ids) => [
      productId,
      ...ids.filter((id) => id !== productId),
    ].slice(0, MAX_RECENT_PRODUCTS));
  }
}
