import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CategoryFilter, SHOP_CATEGORY_NAMES } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { NewsletterSignupComponent } from '../newsletter-signup/newsletter-signup';
import { ShopByCategoryComponent } from '../shop-by-category/shop-by-category';
import { ShopWithConfidenceComponent } from '../shop-with-confidence/shop-with-confidence';
import { TrendingProductsComponent } from '../trending-products/trending-products';
import { FeaturedProductsComponent } from '../featured-products/featured-products';
import { ProductListComponent } from '../product-list/product-list';
import { RecentlyViewedComponent } from '../recently-viewed/recently-viewed';

interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  note: string;
  image: string;
  imageDescription: string;
}

@Component({
  selector: 'app-home-page',
  imports: [
    FeaturedProductsComponent,
    NewsletterSignupComponent,
    ProductListComponent,
    RecentlyViewedComponent,
    RouterLink,
    ShopByCategoryComponent,
    ShopWithConfidenceComponent,
    TrendingProductsComponent,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  protected readonly slides: HeroSlide[] = [
    {
      id: 'timeless-elegance',
      eyebrow: 'A little gold, a lot of meaning',
      title: 'Discover',
      highlight: 'Timeless Elegance',
      description: 'Jewellery crafted to make every moment special.',
      note: 'Designed with intention. Worn with love.',
      image:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2200&q=90',
      imageDescription: 'Elegant gold jewellery styled in warm natural light',
    },
    {
      id: 'everyday-heirlooms',
      eyebrow: 'Made for your every day',
      title: 'Find Your',
      highlight: 'Everyday Heirloom',
      description: 'Thoughtful pieces, made to become part of your story.',
      note: 'The little details make it yours.',
      image:
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=2200&q=90',
      imageDescription: 'A close-up of refined gold jewellery',
    },
    {
      id: 'meaningful-moments',
      eyebrow: 'For all the moments that matter',
      title: 'Celebrate',
      highlight: 'Meaningful Moments',
      description: 'Discover a keepsake for every chapter worth celebrating.',
      note: 'Give a little something that says a lot.',
      image:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=2200&q=90',
      imageDescription: 'A delicate ring presented in soft, natural light',
    },
  ];
  protected readonly currentIndex = signal(0);
  protected readonly currentSlide = computed(() => this.slides[this.currentIndex()]);
  private readonly queryParams = toSignal(this.route.queryParamMap.pipe(map((params) => params)), {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly searchTerm = computed(() => this.queryParams().get('q') ?? '');
  protected readonly selectedCategory = computed<CategoryFilter>(() => {
    const category = this.queryParams().get('category');
    const knownShopCategory = SHOP_CATEGORY_NAMES.some((name) => name === category);
    return category && (this.productService.categories.includes(category) || knownShopCategory)
      ? category
      : 'All';
  });
  protected readonly isLandingPage = computed(
    () => this.selectedCategory() === 'All' && this.searchTerm().trim().length === 0,
  );

  protected showPreviousSlide(): void {
    this.currentIndex.update((index) => (index - 1 + this.slides.length) % this.slides.length);
  }

  protected showNextSlide(): void {
    this.currentIndex.update((index) => (index + 1) % this.slides.length);
  }

  protected selectSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentIndex.set(index);
    }
  }
}
