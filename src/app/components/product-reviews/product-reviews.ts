import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductReviewService } from '../../services/product-review.service';

@Component({
  selector: 'app-product-reviews',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './product-reviews.html',
  styleUrl: './product-reviews.scss',
})
export class ProductReviewsComponent {
  readonly product = input.required<Product>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly reviewService = inject(ProductReviewService);
  protected readonly reviews = computed(() => this.reviewService.reviewsFor(this.product().id));
  protected readonly averageRating = computed(() => {
    const product = this.product();
    return product.rating ?? this.reviewService.averageRating(product.id);
  });
  protected readonly reviewCount = computed(
    () => this.product().reviewCount ?? this.reviews().length,
  );
  protected readonly breakdown = computed(() =>
    this.reviewService.ratingBreakdown(this.product().id),
  );
  protected readonly confirmation = signal('');
  protected readonly submissionError = signal('');
  protected readonly reviewForm = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected submitReview(): void {
    this.confirmation.set('');
    this.submissionError.set('');
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    try {
      this.reviewService.submit({
        productId: this.product().id,
        ...this.reviewForm.getRawValue(),
      });
      this.reviewForm.reset({ displayName: '', rating: 0, title: '', body: '' });
      this.confirmation.set(
        'Thank you. Your review is saved only in this browser demo and is not published.',
      );
    } catch (error) {
      this.submissionError.set(
        error instanceof Error ? error.message : 'Unable to save your review.',
      );
    }
  }

  protected starLabel(rating: number): string {
    return `${rating} out of 5 stars`;
  }

  protected starCharacters(rating: number): string {
    const rounded = Math.round(rating);
    return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
  }

  protected barWidth(count: number): string {
    const total = this.reviews().length;
    return `${total === 0 ? 0 : (count / total) * 100}%`;
  }
}
