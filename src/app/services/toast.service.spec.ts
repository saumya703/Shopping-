import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('shows and dismisses a cart confirmation message', () => {
    const toast = TestBed.inject(ToastService);
    toast.showProductAdded('Luna Pendant Necklace');

    expect(toast.message()).toBe('Luna Pendant Necklace added to your bag.');

    toast.dismiss();
    expect(toast.message()).toBeNull();
  });
});
