import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryFilter, Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card';

type SortOrder = 'recommended' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListComponent {
  readonly searchTerm = input('');
  readonly selectedCategory = input<CategoryFilter>('All');
  protected readonly categories = computed(() => {
    const available = this.productService.categories;
    const selected = this.selectedCategory();
    return selected !== 'All' && !available.includes(selected)
      ? [...available, selected]
      : available;
  });
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly inStockOnly = signal(false);
  protected readonly sortOrder = signal<SortOrder>('recommended');

  protected readonly products = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const category = this.selectedCategory();
    const maxPrice = this.maxPrice();

    const filtered = this.productService.products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesSearch = product.name.toLocaleLowerCase().includes(query);
      const matchesPrice = maxPrice === null || product.price <= maxPrice;
      const matchesAvailability = !this.inStockOnly() || product.availableQuantity > 0;
      return matchesCategory && matchesSearch && matchesPrice && matchesAvailability;
    });

    return filtered.sort((first, second) => {
      switch (this.sortOrder()) {
        case 'price-asc':
          return first.price - second.price;
        case 'price-desc':
          return second.price - first.price;
        default:
          return 0;
      }
    });
  });

  protected onPriceChange(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      const value = event.target.value;
      const maxPrice = Number(value);
      this.maxPrice.set(value && Number.isFinite(maxPrice) && maxPrice >= 0 ? maxPrice : null);
    }
  }

  protected onSortChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const value = event.target.value;
    if (value === 'recommended' || value === 'price-asc' || value === 'price-desc') {
      this.sortOrder.set(value);
    }
  }

  protected onAvailabilityChange(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.inStockOnly.set(event.target.checked);
    }
  }

  private readonly productService = inject(ProductService);
}
