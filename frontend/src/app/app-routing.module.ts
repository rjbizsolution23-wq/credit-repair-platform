import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { RoleGuard } from './core/guards/role.guard';
import { CustomPreloadingStrategy } from './core/services/performance.service';

const routes: Routes = [
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Authentication routes (guest only)
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () => import('./views/auth/auth.module').then(m => m.AuthModule)
  },

  // Main application routes (authenticated users only)
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./views/layout/layout.module').then(m => m.LayoutModule)
  },

  // Error pages
  {
    path: 'error',
    loadChildren: () => import('./views/error/error.module').then(m => m.ErrorModule)
  },

  // Catch-all route - must be last
  {
    path: '**',
    redirectTo: '/error/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Set to true for debugging
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 64], // Offset for fixed header
    onSameUrlNavigation: 'reload',
    preloadingStrategy: CustomPreloadingStrategy,
    initialNavigation: 'enabledBlocking'
  })],
  exports: [RouterModule],
  providers: [CustomPreloadingStrategy]
})
export class AppRoutingModule { }