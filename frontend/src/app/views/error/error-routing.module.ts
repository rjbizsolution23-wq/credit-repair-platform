import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { ServerErrorComponent } from './server-error/server-error.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '404',
    pathMatch: 'full'
  },
  {
    path: '404',
    component: NotFoundComponent,
    data: {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist'
    }
  },
  {
    path: '500',
    component: ServerErrorComponent,
    data: {
      title: 'Server Error',
      description: 'An internal server error occurred'
    }
  },
  {
    path: '403',
    component: UnauthorizedComponent,
    data: {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource'
    }
  },
  {
    path: 'unauthorized',
    redirectTo: '403'
  },
  {
    path: 'not-found',
    redirectTo: '404'
  },
  {
    path: 'server-error',
    redirectTo: '500'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ErrorRoutingModule { }