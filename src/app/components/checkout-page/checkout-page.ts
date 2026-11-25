import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout-page',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: [this.auth.currentUser()?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
    email: [this.auth.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.auth.currentUser()?.phone ?? '', [Validators.required, Validators.pattern(/^[+()\d\s-]{7,20}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9 -]{3,12}$/)]],
  });

  protected placeOrder(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const items = this.cart.lines();
    if (items.length === 0) {
      return;
    }

    this.orderService.createDemoOrder(
      this.form.getRawValue(),
      items,
      this.cart.subtotal(),
      this.cart.shipping(),
      this.cart.total(),
      this.auth.currentUser()?.id,
    );
    this.cart.clear();
    void this.router.navigate(['/order-confirmation']);
  }
}
