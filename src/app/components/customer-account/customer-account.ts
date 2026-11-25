import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AddressService } from '../../services/address.service';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-customer-account',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-account.html',
  styleUrl: './customer-account.scss',
})
export class CustomerAccountComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly addressService = inject(AddressService);
  protected readonly auth = inject(AuthService);
  private readonly orderService = inject(OrderService);
  protected readonly message = signal('');
  protected readonly error = signal('');

  protected readonly currentUser = this.auth.currentUser;
  protected readonly addresses = computed(() => {
    const user = this.currentUser();
    return user ? this.addressService.forUser(user.id) : [];
  });
  protected readonly orders = computed(() => {
    const user = this.currentUser();
    return user ? this.orderService.getForCustomer(user.id, user.email) : [];
  });
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: [
      this.currentUser()?.fullName ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    phone: [this.currentUser()?.phone ?? ''],
  });
  protected readonly addressForm = this.formBuilder.nonNullable.group({
    label: ['Home', Validators.required],
    fullName: [this.currentUser()?.fullName ?? '', Validators.required],
    phone: [this.currentUser()?.phone ?? '', Validators.required],
    street: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    isDefault: [false],
  });
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  protected saveProfile(): void {
    this.message.set('');
    this.error.set('');
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.auth.updateProfile(this.profileForm.getRawValue());
    this.addressForm.controls.fullName.setValue(this.profileForm.controls.fullName.value);
    this.message.set('Your demo profile has been updated.');
  }

  protected saveAddress(): void {
    this.message.set('');
    this.error.set('');
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    const user = this.currentUser();
    if (!user) {
      return;
    }
    this.addressService.add(user.id, this.addressForm.getRawValue());
    this.addressForm.reset({
      label: 'Home',
      fullName: user.fullName,
      phone: user.phone ?? '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
    this.message.set('Address saved in this browser demo.');
  }

  protected removeAddress(addressId: string): void {
    const user = this.currentUser();
    if (user) {
      this.addressService.remove(user.id, addressId);
      this.message.set('Address removed.');
    }
  }

  protected changePasswordDemo(): void {
    this.message.set('');
    this.error.set('');
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('The new passwords do not match.');
      return;
    }
    this.passwordForm.reset();
    this.message.set('Demo password form complete. No password was stored or changed.');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
