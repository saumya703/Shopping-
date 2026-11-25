import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly wishlist = inject(WishlistService);
  private readonly products = inject(ProductService);
  protected readonly categories = computed(() => this.products.categories.filter((name) => name !== 'Collections'));
  protected readonly primaryCategories = computed(() => this.categories().slice(0, 4));
  protected readonly additionalCategories = computed(() => this.categories().slice(4));
  protected readonly searchOpen = signal(false);
  protected readonly searchText = signal('');
  protected readonly menuOpen = signal(false);

  protected toggleSearch(): void {
    this.menuOpen.set(false);
    this.searchOpen.update((open) => !open);
  }

  protected toggleMenu(): void {
    this.searchOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected closeMoreMenu(menu: HTMLDetailsElement): void {
    menu.open = false;
    this.closeMenu();
  }

  protected onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchText.set(event.target.value);
    }
  }

  protected submitSearch(event: SubmitEvent): void {
    event.preventDefault();
    const query = this.searchText().trim();
    void this.router.navigate(['/'], {
      queryParams: { q: query || null, category: null },
      fragment: 'collection',
    });
    this.searchOpen.set(false);
    this.menuOpen.set(false);
  }
}
