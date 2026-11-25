import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly currentMessage = signal<string | null>(null);

  readonly message = this.currentMessage.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  showProductAdded(productName: string): void {
    this.currentMessage.set(`${productName} added to your bag.`);
    this.clearTimer();
    this.timer = setTimeout(() => this.dismiss(), 3500);
  }

  dismiss(): void {
    this.clearTimer();
    this.currentMessage.set(null);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
