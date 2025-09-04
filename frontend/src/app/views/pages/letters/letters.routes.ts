import { Routes } from '@angular/router';

export default [
  {
    path: '',
    redirectTo: 'all',
    pathMatch: 'full'
  },
  {
    path: 'all',
    loadComponent: () => import('./all-letters/all-letters.component').then(c => c.AllLettersComponent),
    data: { title: 'All Letters' }
  },
  {
    path: 'create',
    loadComponent: () => import('./create-letter/create-letter.component').then(c => c.CreateLetterComponent),
    data: { title: 'Create Letter' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./view-letter/view-letter.component').then(c => c.ViewLetterComponent),
    data: { title: 'View Letter' }
  },
  {
    path: 'templates',
    loadComponent: () => import('./letter-templates/letter-templates.component').then(c => c.LetterTemplatesComponent),
    data: { title: 'Letter Templates' }
  }
  // Note: Other letter components (edit-letter, dispute-letters, validation-letters, etc.) 
  // are referenced in routes but don't exist in the file system yet
] as Routes;