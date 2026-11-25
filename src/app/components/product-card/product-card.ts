import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly cartActionLabel = input('Add to cart');
  readonly badgeLabel = input<string | null>(null);
  readonly showQuickView = input(false);
  readonly addedToCart = output<Product>();
  readonly quickView = output<Product>();
  protected readonly cart = inject(CartService);
  protected readonly wishlist = inject(WishlistService);
  private readonly productService = inject(ProductService);

  protected canAddToCart(): boolean {
    const product = this.product();
    return (
      this.cart.quantityFor(product.id) < product.availableQuantity &&
      this.productService.isValidSelection(product, {})
    );
  }

  protected requiresOptions(): boolean {
    const product = this.product();
    return !this.productService.isValidSelection(product, {});
  }

  protected optionsLinkLabel(): string {
    return this.product().customizationOptions?.some((option) => option.id === 'ring-size')
      ? 'Choose ring size'
      : 'Choose options';
  }

  protected addButtonLabel(): string {
    const product = this.product();
    if (product.availableQuantity === 0) {
      return 'Sold out';
    }
    if (!this.productService.isValidSelection(product, {})) {
      return 'Choose options on product page';
    }
    return this.canAddToCart() ? this.cartActionLabel() : 'Stock limit in bag';
  }

  protected addToCart(): void {
    const product = this.product();
    if (!this.canAddToCart()) {
      return;
    }

    this.cart.add(product.id);
    this.addedToCart.emit(product);
  }
}
