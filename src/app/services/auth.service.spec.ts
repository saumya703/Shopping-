import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let storedValues: Map<string, string>;
  let auth: AuthService;

  beforeEach(() => {
    storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => storedValues.set(key, value),
        removeItem: (key: string) => storedValues.delete(key),
      },
    });
    TestBed.resetTestingModule();
    auth = TestBed.inject(AuthService);
  });

  it('creates a demo profile and session without accepting or persisting a password', () => {
    const user = auth.signup('Ava Stone', 'ava@example.com');

    expect(user.role).toBe('customer');
    expect(auth.currentUser()?.email).toBe('ava@example.com');
    expect(auth.isAuthenticated()).toBe(true);
    expect(JSON.stringify([...storedValues.values()])).not.toContain('secret');
  });

  it('restores a customer session and removes it on logout', () => {
    auth.signup('Ava Stone', 'ava@example.com');
    TestBed.resetTestingModule();
    auth = TestBed.inject(AuthService);

    expect(auth.currentUser()?.fullName).toBe('Ava Stone');

    auth.logout();
    expect(auth.currentUser()).toBeNull();
    expect(storedValues.has('diya-demo-session')).toBe(false);
  });

  it('provides an explicitly selected admin demo role', () => {
    auth.enterAdminDemo();

    expect(auth.isAdmin()).toBe(true);
    expect(auth.currentUser()?.role).toBe('admin');
  });
});
