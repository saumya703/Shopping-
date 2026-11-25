import { Component, computed, inject } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-featured-products',
  imports: [ProductCardComponent],
  templateUrl: './featured-products.html',
  styleUrl: './featured-products.scss',
})
export class FeaturedProductsComponent {
  private readonly productService = inject(ProductService);
  protected readonly products = computed(() =>
    this.productService.products.filter((product) => product.featured),
  );
}
