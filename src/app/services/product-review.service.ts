import { inject, Injectable, signal } from '@angular/core';
import { ProductReview } from '../models/product.model';
import { ProductService } from './product.service';

const REVIEW_STORAGE_KEY = 'diya-demo-product-reviews';

export type NewProductReview = Pick<
  ProductReview,
  'productId' | 'displayName' | 'rating' | 'title' | 'body'
>;

@Injectable({ providedIn: 'root' })
export class ProductReviewService {
  private readonly productService = inject(ProductService);
  private readonly reviewItems = signal<ProductReview[]>(this.restoreReviews());

  readonly allReviews = this.reviewItems.asReadonly();

  reviewsFor(productId: string): ProductReview[] {
    return this.reviewItems().filter((review) => review.productId === productId);
  }

  averageRating(productId: string): number | null {
    const reviews = this.reviewsFor(productId);
    if (reviews.length === 0) {
      return null;
    }

    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }

  ratingBreakdown(productId: string): ReadonlyArray<{ rating: number; count: number }> {
    const reviews = this.reviewsFor(productId);
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }));
  }

  submit(review: NewProductReview): ProductReview {
    if (!this.productService.getById(review.productId)) {
      throw new Error('That product is no longer available for review.');
    }

    const displayName = review.displayName.trim();
    const title = review.title.trim();
    const body = review.body.trim();
    if (
      displayName.length < 2 ||
      !Number.isSafeInteger(review.rating) ||
      review.rating < 1 ||
      review.rating > 5 ||
      title.length < 3 ||
      body.length < 10
    ) {
      throw new Error('Complete every review field with valid information.');
    }

    const savedReview: ProductReview = {
      ...review,
      displayName,
      title,
      body,
      id: this.createId(),
      createdAt: new Date().toISOString(),
    };
    const next = [savedReview, ...this.reviewItems()];
    this.persistReviews(next);
    this.reviewItems.set(next);
    return savedReview;
  }

  private createId(): string {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    return `review-${Date.now()}-${this.reviewItems().length}`;
  }

  private restoreReviews(): ProductReview[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    let storedValue: string | null;
    try {
      storedValue = localStorage.getItem(REVIEW_STORAGE_KEY);
    } catch (error) {
      console.error('Unable to read product reviews from localStorage.', error);
      return [];
    }

    if (!storedValue) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(storedValue);
      if (!Array.isArray(parsed)) {
        throw new TypeError('Saved product reviews must be an array.');
      }

      const validReviews = parsed.filter((value): value is ProductReview => this.isReview(value));
      if (validReviews.length !== parsed.length) {
        console.error('Some invalid or unavailable product reviews were ignored.');
      }
      return validReviews;
    } catch (error) {
      console.error('Unable to restore product reviews from localStorage.', error);
      return [];
    }
  }

  private isReview(value: unknown): value is ProductReview {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      'productId' in value &&
      typeof value.productId === 'string' &&
      this.productService.getById(value.productId) !== undefined &&
      'displayName' in value &&
      typeof value.displayName === 'string' &&
      'rating' in value &&
      typeof value.rating === 'number' &&
      Number.isSafeInteger(value.rating) &&
      value.rating >= 1 &&
      value.rating <= 5 &&
      'title' in value &&
      typeof value.title === 'string' &&
      'body' in value &&
      typeof value.body === 'string' &&
      'createdAt' in value &&
      typeof value.createdAt === 'string' &&
      !Number.isNaN(Date.parse(value.createdAt)) &&
      (!('photoUrls' in value) ||
        (Array.isArray(value.photoUrls) &&
          value.photoUrls.every((url: unknown) => typeof url === 'string')))
    );
  }

  private persistReviews(reviews: ProductReview[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
    } catch (error) {
      console.error('Unable to save product reviews to localStorage.', error);
      throw new Error('Your review could not be saved in this browser. Check available storage and try again.');
    }
  }
}
