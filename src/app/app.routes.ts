import { Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page';
import { CartPageComponent } from './components/cart-page/cart-page';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page';
import { OrderConfirmationComponent } from './components/order-confirmation/order-confirmation';
import { AiAssistantComponent } from './components/ai-assistant/ai-assistant';
import { NotFoundComponent } from './components/not-found/not-found';
import { WishlistPageComponent } from './components/wishlist-page/wishlist-page';
import { AuthPageComponent } from './components/auth-page/auth-page';
import { CustomerAccountComponent } from './components/customer-account/customer-account';
import { OrderDetailsComponent } from './components/order-details/order-details';
import { AdminPageComponent } from './components/admin-page/admin-page';
import { adminGuard } from './services/auth.guard';
import { customerGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'DIYA Jewellery | Timeless Elegance' },
  { path: 'cart', component: CartPageComponent, title: 'Shopping Bag | DIYA Jewellery' },
  { path: 'checkout', component: CheckoutPageComponent, title: 'Checkout | DIYA Jewellery' },
  { path: 'order-confirmation', component: OrderConfirmationComponent, title: 'Order Confirmation | DIYA Jewellery' },
  { path: 'assistant', component: AiAssistantComponent, title: 'Jewellery Assistant | DIYA Jewellery' },
  { path: 'wishlist', component: WishlistPageComponent, title: 'Your Wishlist | DIYA Jewellery' },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./components/product-detail/product-detail').then(
        (module) => module.ProductDetailComponent,
      ),
    title: 'Product Details | DIYA Jewellery',
  },
  { path: 'login', component: AuthPageComponent, data: { mode: 'login' }, title: 'Sign In | DIYA Jewellery' },
  { path: 'signup', component: AuthPageComponent, data: { mode: 'signup' }, title: 'Create Account | DIYA Jewellery' },
  { path: 'forgot-password', component: AuthPageComponent, data: { mode: 'forgot' }, title: 'Password Help | DIYA Jewellery' },
  { path: 'reset-password', component: AuthPageComponent, data: { mode: 'reset' }, title: 'Reset Password Demo | DIYA Jewellery' },
  { path: 'account', component: CustomerAccountComponent, canActivate: [customerGuard], title: 'My Account | DIYA Jewellery' },
  { path: 'account/orders/:id', component: OrderDetailsComponent, canActivate: [customerGuard], title: 'Order Details | DIYA Jewellery' },
  { path: 'admin', component: AdminPageComponent, canActivate: [adminGuard], title: 'Admin Demo | DIYA Jewellery' },
  { path: '**', component: NotFoundComponent, title: 'Page Not Found | DIYA Jewellery' },
];
