import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

const USERS_STORAGE_KEY = 'diya-demo-users';
const SESSION_STORAGE_KEY = 'diya-demo-session';
const DEMO_ADMIN_EMAIL = 'admin@diya-demo.local';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersState = signal<User[]>(this.restoreUsers());
  private readonly currentUserState = signal<User | null>(this.restoreSession());

  readonly users = this.usersState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);
  readonly isAdmin = computed(() => this.currentUserState()?.role === 'admin');

  signup(fullName: string, email: string): User {
    if (fullName.trim().length < 2) {
      throw new Error('Enter a full name of at least two characters.');
    }
    const normalizedEmail = email.trim().toLocaleLowerCase();
    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error('Enter a valid email address.');
    }
    if (this.usersState().some((user) => user.email === normalizedEmail)) {
      throw new Error('An account with this email already exists in this demo.');
    }

    const user: User = {
      id: this.createId('customer'),
      fullName: fullName.trim(),
      email: normalizedEmail,
      role: 'customer',
    };
    this.setUsers([...this.usersState(), user]);
    this.setCurrentUser(user);
    return user;
  }

  login(email: string): User {
    const normalizedEmail = email.trim().toLocaleLowerCase();
    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error('Enter a valid email address to start a demo session.');
    }
    if (normalizedEmail === DEMO_ADMIN_EMAIL) {
      throw new Error('Use the explicit admin demo option to open the admin workspace.');
    }

    const user =
      this.usersState().find(
        (candidate) => candidate.email === normalizedEmail && candidate.role === 'customer',
      ) ?? {
        id: this.createId('customer'),
        fullName: normalizedEmail.split('@')[0].replace(/[._-]/g, ' '),
        email: normalizedEmail,
        role: 'customer' as const,
      };

    if (!this.usersState().some((candidate) => candidate.id === user.id)) {
      this.setUsers([...this.usersState(), user]);
    }
    this.setCurrentUser(user);
    return user;
  }

  enterAdminDemo(): User {
    const admin: User = {
      id: 'diya-demo-admin',
      fullName: 'DIYA Demo Admin',
      email: DEMO_ADMIN_EMAIL,
      role: 'admin',
    };
    if (!this.usersState().some((user) => user.id === admin.id)) {
      this.setUsers([...this.usersState(), admin]);
    }
    this.setCurrentUser(admin);
    return admin;
  }

  updateProfile(profile: Pick<User, 'fullName'> & Partial<Pick<User, 'phone'>>): User {
    const currentUser = this.currentUserState();
    if (!currentUser || currentUser.role !== 'customer') {
      throw new Error('Sign in as a customer before editing a profile.');
    }

    const updatedUser: User = {
      ...currentUser,
      fullName: profile.fullName.trim(),
      phone: profile.phone?.trim() || undefined,
    };
    this.setUsers(
      this.usersState().map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
    this.setCurrentUser(updatedUser);
    return updatedUser;
  }

  logout(): void {
    this.currentUserState.set(null);
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Unable to clear the demo session from localStorage.', error);
    }
  }

  private setUsers(users: User[]): void {
    this.usersState.set(users);
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Unable to save demo customer profiles to localStorage.', error);
    }
  }

  private setCurrentUser(user: User): void {
    this.currentUserState.set(user);
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Unable to save the demo session to localStorage.', error);
    }
  }

  private restoreUsers(): User[] {
    const stored = this.readStorage(USERS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        throw new TypeError('Saved demo customer data must be an array.');
      }
      return parsed.filter((value): value is User => this.isUser(value));
    } catch (error) {
      console.error('Unable to restore demo customer profiles.', error);
      return [];
    }
  }

  private restoreSession(): User | null {
    const stored = this.readStorage(SESSION_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!this.isUser(parsed)) {
        throw new TypeError('Saved demo session data is invalid.');
      }
      return parsed;
    } catch (error) {
      console.error('Unable to restore the demo session.', error);
      return null;
    }
  }

  private readStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Unable to read ${key} from localStorage.`, error);
      return null;
    }
  }

  private isUser(value: unknown): value is User {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    return (
      'id' in value &&
      typeof value.id === 'string' &&
      'fullName' in value &&
      typeof value.fullName === 'string' &&
      'email' in value &&
      typeof value.email === 'string' &&
      'role' in value &&
      (value.role === 'customer' || value.role === 'admin')
    );
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
