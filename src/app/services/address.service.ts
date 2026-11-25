import { Injectable, signal } from '@angular/core';
import { CustomerAddress } from '../models/address.model';

const ADDRESS_STORAGE_KEY = 'diya-demo-addresses';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly addressBook = signal<Record<string, CustomerAddress[]>>(this.restore());

  forUser(userId: string): CustomerAddress[] {
    return this.addressBook()[userId] ?? [];
  }

  add(userId: string, address: Omit<CustomerAddress, 'id'>): CustomerAddress {
    if (!userId.trim()) {
      throw new Error('A signed-in customer is required to save an address.');
    }

    const addresses = this.forUser(userId);
    const savedAddress: CustomerAddress = {
      ...address,
      id: `address-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      isDefault: addresses.length === 0 || address.isDefault,
    };
    const updated = address.isDefault
      ? [...addresses.map((item) => ({ ...item, isDefault: false })), savedAddress]
      : [...addresses, savedAddress];
    this.setForUser(userId, updated);
    return savedAddress;
  }

  remove(userId: string, addressId: string): void {
    const remaining = this.forUser(userId).filter((address) => address.id !== addressId);
    if (remaining.length > 0 && !remaining.some((address) => address.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    this.setForUser(userId, remaining);
  }

  private setForUser(userId: string, addresses: CustomerAddress[]): void {
    const updated = { ...this.addressBook(), [userId]: addresses };
    this.addressBook.set(updated);
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Unable to save demo addresses to localStorage.', error);
    }
  }

  private restore(): Record<string, CustomerAddress[]> {
    if (typeof localStorage === 'undefined') {
      return {};
    }
    try {
      const saved = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (!saved) {
        return {};
      }
      const parsed: unknown = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new TypeError('Saved demo addresses must be grouped by customer.');
      }
      return Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, CustomerAddress[]] =>
            typeof entry[0] === 'string' &&
            Array.isArray(entry[1]) &&
            entry[1].every((value) => this.isAddress(value)),
        ),
      );
    } catch (error) {
      console.error('Unable to restore demo addresses.', error);
      return {};
    }
  }

  private isAddress(value: unknown): value is CustomerAddress {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      'label' in value &&
      typeof value.label === 'string' &&
      'fullName' in value &&
      typeof value.fullName === 'string' &&
      'phone' in value &&
      typeof value.phone === 'string' &&
      'street' in value &&
      typeof value.street === 'string' &&
      'city' in value &&
      typeof value.city === 'string' &&
      'state' in value &&
      typeof value.state === 'string' &&
      'postalCode' in value &&
      typeof value.postalCode === 'string' &&
      'isDefault' in value &&
      typeof value.isDefault === 'boolean'
    );
  }
}
