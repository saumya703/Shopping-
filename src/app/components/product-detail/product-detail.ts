import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Product, ProductOption, ProductSelection } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductReviewService } from '../../services/product-review.service';
import { ProductService } from '../../services/product.service';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import { WishlistService } from '../../services/wishlist.service';
import { ProductCardComponent } from '../product-card/product-card';
import { ProductGalleryComponent } from '../product-gallery/product-gallery';
import { ProductReviewsComponent } from '../product-reviews/product-reviews';
import { RecentlyViewedComponent } from '../recently-viewed/recently-viewed';

@Component({
  selector: 'app-product-detail',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ProductCardComponent,
    ProductGalleryComponent,
    ProductReviewsComponent,
    ReactiveFormsModule,
    RecentlyViewedComponent,
    RouterLink,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  protected readonly cart = inject(CartService);
  private readonly reviewService = inject(ProductReviewService);
  private readonly recentlyViewedService = inject(RecentlyViewedService);
  protected readonly wishlist = inject(WishlistService);

  private readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  protected readonly product = computed(() => this.productService.getById(this.productId()));
  protected readonly quantity = signal(1);
  protected readonly selectedOptions = signal<Record<string, string>>({});
  protected readonly actionError = signal('');
  protected readonly deliveryMessage = signal('');
  protected readonly deliveryZip = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{5}(?:-\d{4})?$/)],
  });
  protected readonly remainingQuantity = computed(() => {
    const product = this.product();
    return product ? Math.max(0, product.availableQuantity - this.cart.quantityFor(product.id)) : 0;
  });
  protected readonly selectedPrice = computed(() => {
    const product = this.product();
    const selection = this.selectedOptions();
    return product && this.productService.isValidSelection(product, selection)
      ? this.productService.priceFor(product, selection)
      : (product?.price ?? 0);
  });
  protected readonly selectionIsValid = computed(() => {
    const product = this.product();
    return (
      product !== undefined && this.productService.isValidSelection(product, this.selectedOptions())
    );
  });
  protected readonly canPurchase = computed(
    () =>
      this.remainingQuantity() > 0 &&
      this.quantity() <= this.remainingQuantity() &&
      this.selectionIsValid(),
  );
  protected readonly discountPercentage = computed(() => {
    const product = this.product();
    return product?.originalPrice && product.originalPrice > this.selectedPrice()
      ? Math.round((1 - this.selectedPrice() / product.originalPrice) * 100)
      : null;
  });
  protected readonly displayRating = computed(() => {
    const product = this.product();
    return product?.rating ?? (product ? this.reviewService.averageRating(product.id) : null);
  });
  protected readonly displayReviewCount = computed(() => {
    const product = this.product();
    return product?.reviewCount ?? (product ? this.reviewService.reviewsFor(product.id).length : 0);
  });
  protected readonly similarProducts = computed(() => {
    const product = this.product();
    return product
      ? this.productService
          .getRelatedProducts(product.id, 8)
          .filter((candidate) => candidate.category === product.category)
          .slice(0, 3)
      : [];
  });
  protected readonly completeTheLookProducts = computed(() => {
    const product = this.product();
    return product
      ? this.productService
          .getRelatedProducts(product.id, 8)
          .filter((candidate) => candidate.category !== product.category)
          .slice(0, 3)
      : [];
  });
  protected readonly specifications = computed(() => {
    const product = this.product();
    if (!product) {
      return [];
    }

    return [
      { label: 'Category', value: product.category },
      { label: 'Product code', value: this.skuFor(product) },
      ...Object.entries(product.specifications ?? {}).map(([label, value]) => ({ label, value })),
    ];
  });

  private readonly resetProductState = effect(() => {
    const product = this.product();
    this.quantity.set(1);
    this.actionError.set('');
    this.deliveryMessage.set('');
    this.selectedOptions.set(this.defaultSelection(product));
  });
  private readonly recordRecentlyViewedProduct = effect(() => {
    const productId = this.productId();
    if (this.productService.getById(productId)) {
      untracked(() => this.recentlyViewedService.record(productId));
    }
  });

  protected decreaseQuantity(): void {
    this.quantity.update((quantity) => Math.max(1, quantity - 1));
  }

  protected increaseQuantity(): void {
    this.quantity.update((quantity) => Math.min(this.remainingQuantity(), quantity + 1));
  }

  protected selectOption(option: ProductOption, event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const selectedValue = event.target.value;
    if (!selectedValue && !option.required) {
      this.selectedOptions.update((selection) => {
        const remaining = { ...selection };
        delete remaining[option.id];
        return remaining;
      });
      this.actionError.set('');
      return;
    }
    if (!option.values.some((value) => value.value === selectedValue)) {
      return;
    }

    this.selectedOptions.update((selection) => ({ ...selection, [option.id]: selectedValue }));
    this.actionError.set('');
  }

  protected selectedOptionValue(optionId: string): string {
    return this.selectedOptions()[optionId] ?? '';
  }

  protected addToCart(product: Product): void {
    if (!this.addCurrentSelectionToCart(product)) {
      return;
    }
  }

  protected async buyNow(product: Product): Promise<void> {
    if (this.addCurrentSelectionToCart(product)) {
      await this.router.navigateByUrl('/cart');
    }
  }

  protected checkDelivery(): void {
    this.deliveryMessage.set('');
    if (this.deliveryZip.invalid) {
      this.deliveryZip.markAsTouched();
      return;
    }
    this.deliveryMessage.set(
      'ZIP code format is valid. Live delivery availability is not connected in this demo.',
    );
  }

  protected skuFor(product: Product): string {
    return product.sku ?? `DIYA-${product.id.toLocaleUpperCase()}`;
  }

  protected ratingStars(rating: number): string {
    const rounded = Math.round(rating);
    return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
  }

  protected originalPriceFor(product: Product): number | null {
    return product.originalPrice && product.originalPrice > this.selectedPrice()
      ? product.originalPrice
      : null;
  }

  protected materialInformation(product: Product): string {
    return product.detailContent?.metalInformation ?? product.material;
  }

  protected diamondInformation(product: Product): string {
    if (product.detailContent?.diamondDetails) {
      return product.detailContent.diamondDetails;
    }
    return /diamond|sapphire|pearl|gem|stone/i.test(product.material)
      ? product.material
      : 'Gemstone specifications are not provided for this piece.';
  }

  protected returnsInformation(product: Product): string {
    return (
      product.detailContent?.returnsExchanges ??
      'Return and exchange terms are not configured in this browser demo. Please confirm the policy with DIYA before ordering.'
    );
  }

  protected certificationInformation(product: Product): string {
    return (
      product.detailContent?.certification ??
      'No certification document is listed for this sample product.'
    );
  }

  protected careInformation(product: Product): string {
    return (
      product.detailContent?.careInstructions ??
      'Store separately and avoid direct contact with perfumes, lotions and household chemicals. Clean gently with a soft, dry cloth.'
    );
  }

  private addCurrentSelectionToCart(product: Product): boolean {
    this.actionError.set('');
    if (!this.canPurchase()) {
      this.actionError.set('Choose available options and quantity before adding this piece.');
      return false;
    }

    try {
      this.cart.add(product.id, this.quantity(), this.selectedOptions());
      return true;
    } catch (error) {
      this.actionError.set(
        error instanceof Error ? error.message : 'Unable to add this piece to your bag.',
      );
      return false;
    }
  }

  private defaultSelection(product: Product | undefined): Record<string, string> {
    if (!product) {
      return {};
    }
    return Object.fromEntries(
      (product.customizationOptions ?? [])
        .filter(
          (option) => option.required && option.id !== 'ring-size' && option.values.length > 0,
        )
        .map((option) => [option.id, option.values[0].value]),
    );
  }
}
