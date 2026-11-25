import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const customerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (user?.role === 'customer') {
    return true;
  }
  if (user?.role === 'admin') {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) {
    return true;
  }
  return auth.currentUser()
    ? router.createUrlTree(['/account'])
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: '/admin' } });
};
