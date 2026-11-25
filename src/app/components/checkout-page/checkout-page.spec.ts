import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CheckoutPageComponent } from './checkout-page';
import { OrderConfirmationComponent } from '../order-confirmation/order-confirmation';

describe('CheckoutPageComponent', () => {
  beforeEach(async () => {
    const storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => storedValues.set(key, value),
        removeItem: (key: string) => storedValues.delete(key),
      },
    });

    await TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideRouter([
          { path: 'order-confirmation', component: OrderConfirmationComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('validates delivery details and creates a demo order without payment data', async () => {
    const cart = TestBed.inject(CartService);
    const orders = TestBed.inject(OrderService);
    cart.add('mini-hoops');

    const fixture = TestBed.createComponent(CheckoutPageComponent);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const submitButton = fixture.nativeElement.querySelector(
      '.place-order-button',
    ) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[autocomplete="cc-number"]')).toBeNull();

    const values: Record<string, string> = {
      fullName: 'Ava Stone',
      email: 'ava@example.com',
      phone: '+14155550123',
      address: '42 Garden Avenue',
      city: 'Denver',
      state: 'Colorado',
      postalCode: '80202',
    };

    for (const [controlName, value] of Object.entries(values)) {
      const input = fixture.nativeElement.querySelector(
        `[formControlName="${controlName}"]`,
      ) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    fixture.detectChanges();
    expect(submitButton.disabled).toBe(false);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(orders.latestOrder()?.customer.email).toBe('ava@example.com');
    expect(orders.latestOrder()?.items).toHaveLength(1);
    expect(cart.itemCount()).toBe(0);
  });
});
