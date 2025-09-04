import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Routes
import { LettersRoutes } from './letters.routes';

// Components
import { AllLettersComponent } from './all-letters/all-letters.component';
import { CreateLetterComponent } from './create-letter/create-letter.component';
// import { LetterTemplatesComponent } from './letter-templates/letter-templates.component'; // Now standalone
import { ViewLetterComponent } from './view-letter/view-letter.component';

// Services
import { LetterService } from '../../../services/letter.service';

// Shared Modules (assuming these exist in your project)
// import { SharedModule } from '../../../shared/shared.module';
// import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  declarations: [
    AllLettersComponent,
    CreateLetterComponent
    // LetterTemplatesComponent - Now standalone
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(LettersRoutes)
    // SharedModule,
    // ComponentsModule
  ],
  providers: [
    LetterService
  ]
})
export class LettersModule { }

// Export components for potential external use
export {
  AllLettersComponent,
  CreateLetterComponent
  // LetterTemplatesComponent - Now standalone
};

// Export services
export { LetterService };

// Export models and types
export * from './letter.model';