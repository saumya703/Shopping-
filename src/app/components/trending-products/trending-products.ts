import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-trending-products',
  imports: [CurrencyPipe, ProductCardComponent, RouterLink],
  templateUrl: './trending-products.html',
  styleUrl: './trending-products.scss',
})
export class TrendingProductsComponent {
  private readonly productService = inject(ProductService);
  protected readonly cart = inject(CartService);
  protected readonly products = computed(() =>
    this.productService.products.filter((product) => product.availableQuantity > 0).slice(0, 4),
  );
  protected readonly quickViewProduct = signal<Product | null>(null);

  protected openQuickView(product: Product): void {
    this.quickViewProduct.set(product);
  }

  protected closeQuickView(): void {
    this.quickViewProduct.set(null);
  }

  protected canQuickAdd(product: Product): boolean {
    return (
      this.cart.quantityFor(product.id) < product.availableQuantity &&
      this.productService.isValidSelection(product, {})
    );
  }

  protected quickAddLabel(product: Product): string {
    if (!this.productService.isValidSelection(product, {})) {
      return 'Choose options on product page';
    }
    return this.canQuickAdd(product) ? 'Add to bag' : 'Stock limit in bag';
  }

  protected addQuickViewProduct(product: Product): void {
    if (!this.canQuickAdd(product)) {
      return;
    }

    this.cart.add(product.id);
    this.closeQuickView();
  }
}
