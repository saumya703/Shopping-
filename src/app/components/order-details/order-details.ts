import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-details',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly orderId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );
  protected readonly error = signal('');
  protected readonly order = computed(() => {
    const order = this.orderService.getById(this.orderId() ?? '');
    const user = this.auth.currentUser();
    if (!order || !user) {
      return undefined;
    }
    const belongsToUser = order.userId
      ? order.userId === user.id
      : order.customer.email.toLocaleLowerCase() === user.email.toLocaleLowerCase();
    return user.role === 'admin' || belongsToUser ? order : undefined;
  });

  protected cancelOrder(): void {
    const order = this.order();
    if (!order) {
      return;
    }
    this.error.set('');
    try {
      this.orderService.cancelOrder(order.id);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to cancel this demo order.');
    }
  }
}
