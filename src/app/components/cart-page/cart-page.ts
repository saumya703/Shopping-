import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartLineItem } from '../../models/product.model';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPageComponent {
  protected readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);

  protected selectionSummary(item: CartLineItem): string {
    const selectedOptions = item.selectedOptions ?? {};
    const entries = Object.entries(selectedOptions).map(([optionId, value]) => {
      const option = item.product.customizationOptions?.find((candidate) => candidate.id === optionId);
      return `${option?.label ?? optionId}: ${value}`;
    });
    return entries.length > 0 ? entries.join(' · ') : item.product.material;
  }

  protected moveToWishlist(item: CartLineItem): void {
    if (!this.wishlist.contains(item.productId)) {
      this.wishlist.toggle(item.productId);
    }
    this.cart.remove(item.productId, item.selectedOptions ?? {});
  }
}
