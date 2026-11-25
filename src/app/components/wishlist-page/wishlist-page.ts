import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-wishlist-page',
  imports: [ProductCardComponent, RouterLink],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.scss',
})
export class WishlistPageComponent {
  private readonly productService = inject(ProductService);
  private readonly wishlist = inject(WishlistService);

  protected readonly products = computed(() => {
    const savedIds = this.wishlist.ids();
    return this.productService.products.filter((product) => savedIds.has(product.id));
  });

  protected removeFromWishlistAfterAdd(product: Product): void {
    this.wishlist.remove(product.id);
  }
}
