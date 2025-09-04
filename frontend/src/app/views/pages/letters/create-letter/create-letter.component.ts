import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import {
  LetterTemplate,
  GeneratedLetter,
  LetterCategory,
  LetterType,
  LetterPriority,
  RecipientType,
  DeliveryMethod,
  TemplateVariable,
  VariableType,
  getLetterCategoryLabel
} from '../../../../models/letter.model';
import { LetterService } from '../../../../services/letter.service';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';
import { CreditReport } from '../../../../core/models/credit-report.model';
import { CreditReportService } from '../../../../core/services/credit-report.service';

@Component({
  selector: 'app-create-letter',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    FeatherIconDirective
  ],
  templateUrl: './create-letter.component.html',
  styleUrls: ['./create-letter.component.scss']
})
export class CreateLetterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Forms
  letterForm: FormGroup;
  
  // Data
  templates: LetterTemplate[] = [];
  clients: Client[] = [];
  creditReports: CreditReport[] = [];
  selectedTemplate: LetterTemplate | null = null;
  
  // Loading states
  loading = false;
  loadingTemplates = false;
  loadingClients = false;
  loadingReports = false;
  submitting = false;
  
  // UI states
  currentStep = 1;
  totalSteps = 4;
  showPreview = false;
  previewContent = '';
  
  // Enums for template
  LetterCategory = LetterCategory;
  LetterType = LetterType;
  LetterPriority = LetterPriority;
  RecipientType = RecipientType;
  DeliveryMethod = DeliveryMethod;
  VariableType = VariableType;
  
  // Template variables
  templateVariables: { [key: string]: any } = {};
  
  // Filters
  templateFilters = {
    category: '',
    search: ''
  };
  
  filteredTemplates: LetterTemplate[] = [];

  constructor(
    private letterService: LetterService,
    private clientService: ClientService,
    private creditReportService: CreditReportService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.loadClients();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.letterForm = this.fb.group({
      // Step 1: Template Selection
      templateId: ['', Validators.required],
      
      // Step 2: Client & Report Selection
      clientId: ['', Validators.required],
      creditReportId: [''],
      
      // Step 3: Letter Details
      recipientName: ['', Validators.required],
      recipientType: ['', Validators.required],
      recipientAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]]
      }),
      priority: [LetterPriority.MEDIUM, Validators.required],
      deliveryMethod: [DeliveryMethod.USPS_FIRST_CLASS, Validators.required],
      scheduledSendDate: [''],
      
      // Step 4: Customization
      customContent: [''],
      includeAttachments: [false],
      requestResponseBy: [''],
      notes: ['']
    });
    
    // Watch for client changes to load credit reports
    this.letterForm.get('clientId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(clientId => {
        if (clientId) {
          this.loadCreditReports(clientId);
        } else {
          this.creditReports = [];
        }
      });
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['clientId']) {
        this.letterForm.patchValue({ clientId: params['clientId'] });
      }
      if (params['templateId']) {
        this.letterForm.patchValue({ templateId: params['templateId'] });
        this.onTemplateSelect(params['templateId']);
      }
      if (params['category']) {
        this.templateFilters.category = params['category'];
        this.filterTemplates();
      }
    });
  }

  private loadTemplates(): void {
    this.loadingTemplates = true;
    this.letterService.getTemplates({ limit: 1000, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.templates = response.data;
          this.filteredTemplates = [...this.templates];
          this.loadingTemplates = false;
        },
        error: (error: any) => {
          console.error('Error loading templates:', error);
          this.loadingTemplates = false;
        }
      });
  }

  private loadClients(): void {
    this.loadingClients = true;
    this.clientService.getAllClients({ limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.clients = response.data;
          this.loadingClients = false;
        },
        error: (error: any) => {
          console.error('Error loading clients:', error);
          this.loadingClients = false;
        }
      });
  }

  private loadCreditReports(clientId: string): void {
    this.loadingReports = true;
    this.creditReportService.getReports({ clientId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.creditReports = response.data;
          this.loadingReports = false;
        },
        error: (error: any) => {
          console.error('Error loading credit reports:', error);
          this.loadingReports = false;
        }
      });
  }

  // Template Selection
  onTemplateSelect(templateId: string): void {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      this.selectedTemplate = template;
      this.letterForm.patchValue({ templateId });
      this.initializeTemplateVariables();
      
      // Auto-fill some fields based on template
      // Set default recipient type to CRA if not specified
      this.letterForm.patchValue({ recipientType: 'CRA' });
      // Set default priority
      this.letterForm.patchValue({ priority: 'MEDIUM' });
    }
  }

  private initializeTemplateVariables(): void {
    if (!this.selectedTemplate) return;
    
    this.templateVariables = {};
    this.selectedTemplate.variables.forEach(variable => {
      this.templateVariables[variable.name] = variable.defaultValue || '';
    });
  }

  filterTemplates(): void {
    let filtered = [...this.templates];
    
    if (this.templateFilters.category) {
      filtered = filtered.filter(t => t.category === this.templateFilters.category);
    }
    
    if (this.templateFilters.search) {
      const search = this.templateFilters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        (t.description && t.description.toLowerCase().includes(search))
      );
    }
    
    this.filteredTemplates = filtered;
  }

  clearTemplateFilters(): void {
    this.templateFilters = { category: '', search: '' };
    this.filteredTemplates = [...this.templates];
  }

  // Navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.letterForm.get('templateId')?.valid || false;
      case 2:
        return this.letterForm.get('clientId')?.valid || false;
      case 3:
        const recipientControls = ['recipientName', 'recipientType'];
        const addressControls = ['street', 'city', 'state', 'zipCode'];
        return recipientControls.every(control => this.letterForm.get(control)?.valid) &&
               addressControls.every(control => this.letterForm.get(['recipientAddress', control])?.valid);
      case 4:
        return true; // Customization step is optional
      default:
        return false;
    }
  }

  // Preview
  generatePreview(): void {
    if (!this.selectedTemplate || !this.letterForm.valid) return;
    
    this.loading = true;
    const formData = this.buildLetterData();
    
    this.letterService.previewLetter(formData.templateId, formData.variables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preview) => {
          this.previewContent = preview.content;
          this.showPreview = true;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error generating preview:', error);
          this.loading = false;
        }
      });
  }

  closePreview(): void {
    this.showPreview = false;
    this.previewContent = '';
  }

  // Form Submission
  onSubmit(): void {
    if (!this.letterForm.valid || !this.selectedTemplate) {
      this.markFormGroupTouched(this.letterForm);
      return;
    }
    
    this.submitting = true;
    const letterData = this.buildLetterData();
    
    this.letterService.generateLetter(letterData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letter: any) => {
          this.submitting = false;
          this.router.navigate(['/letters', letter.id]);
        },
        error: (error: any) => {
          console.error('Error creating letter:', error);
          this.submitting = false;
        }
      });
  }

  private buildLetterData(): any {
    const formValue = this.letterForm.value;
    
    return {
      templateId: formValue.templateId,
      clientId: formValue.clientId,
      disputeId: formValue.creditReportId || undefined,
      recipientType: formValue.recipientType,
      recipientId: formValue.recipientName || 'default-recipient',
      variables: this.templateVariables || {},
      deliveryMethod: formValue.deliveryMethod,
      scheduleDate: formValue.scheduledSendDate ? new Date(formValue.scheduledSendDate) : undefined
    };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Utility methods
  getCategoryLabel(category: LetterCategory): string {
    return getLetterCategoryLabel(category);
  }

  getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  }

  getTemplateCategoryIcon(category: LetterCategory): string {
    const icons: { [key in LetterCategory]: string } = {
      [LetterCategory.DISPUTE]: 'alert-triangle',
      [LetterCategory.VALIDATION]: 'check-circle',
      [LetterCategory.GOODWILL]: 'heart',
      [LetterCategory.CEASE_DESIST]: 'shield',
      [LetterCategory.METHOD_OF_VERIFICATION]: 'search',
      [LetterCategory.INTENT_TO_SUE]: 'file-text',
      [LetterCategory.FOLLOW_UP]: 'repeat',
      [LetterCategory.ESCALATION]: 'arrow-up',
      [LetterCategory.COMPLAINT]: 'flag',
      [LetterCategory.SETTLEMENT]: 'handshake',
      [LetterCategory.PAYMENT_PLAN]: 'credit-card'
    };
    return icons[category] || 'file-text';
  }

  getRecipientTypeIcon(type: RecipientType): string {
    const icons = {
      [RecipientType.CREDIT_BUREAU]: 'database',
      [RecipientType.CREDITOR]: 'credit-card',
      [RecipientType.COLLECTION_AGENCY]: 'phone',
      [RecipientType.DATA_FURNISHER]: 'server',
      [RecipientType.ATTORNEY_GENERAL]: 'shield',
      [RecipientType.CFPB]: 'shield',
      [RecipientType.FTC]: 'shield',
      [RecipientType.COURT]: 'home'
    };
    return icons[type] || 'user';
  }

  getDeliveryMethodIcon(method: DeliveryMethod): string {
    const icons = {
      [DeliveryMethod.EMAIL]: 'mail',
      [DeliveryMethod.USPS_FIRST_CLASS]: 'mail',
      [DeliveryMethod.USPS_CERTIFIED]: 'shield',
      [DeliveryMethod.USPS_PRIORITY]: 'zap',
      [DeliveryMethod.FEDEX]: 'truck',
      [DeliveryMethod.UPS]: 'truck',
      [DeliveryMethod.HAND_DELIVERY]: 'user',
      [DeliveryMethod.FAX]: 'printer'
    };
    return icons[method] || 'send';
  }

  getVariableTypeIcon(type: VariableType): string {
    const icons: { [key in VariableType]: string } = {
      [VariableType.TEXT]: 'type',
      [VariableType.NUMBER]: 'hash',
      [VariableType.DATE]: 'calendar',
      [VariableType.BOOLEAN]: 'toggle-left',
      [VariableType.SELECT]: 'list',
      [VariableType.MULTISELECT]: 'list',
      [VariableType.MULTILINE]: 'align-left',
      [VariableType.EMAIL]: 'mail',
      [VariableType.PHONE]: 'phone',
      [VariableType.ADDRESS]: 'map-pin',
      [VariableType.CURRENCY]: 'dollar-sign',
      [VariableType.PERCENTAGE]: 'percent'
    };
    return icons[type] || 'type';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.letterForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isAddressFieldInvalid(fieldName: string): boolean {
    const field = this.letterForm.get(['recipientAddress', fieldName]);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.letterForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
      if (field.errors['email']) return 'Invalid email format';
    }
    return '';
  }

  canProceedToNextStep(): boolean {
    return this.validateCurrentStep();
  }

  isStepCompleted(step: number): boolean {
    switch (step) {
      case 1:
        return !!this.letterForm.get('templateId')?.value;
      case 2:
        return !!this.letterForm.get('clientId')?.value;
      case 3:
        return this.validateCurrentStep();
      case 4:
        return true;
      default:
        return false;
    }
  }

  getStepIcon(step: number): string {
    const icons: { [key: number]: string } = {
      1: 'file-text',
      2: 'users',
      3: 'mail',
      4: 'edit-3'
    };
    return icons[step] || 'circle';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  // Template variable handling
  updateTemplateVariable(variableName: string, value: any): void {
    // Handle event objects from form inputs
    if (value && typeof value === 'object' && value.target) {
      const target = value.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      this.templateVariables[variableName] = target.value;
    } else {
      this.templateVariables[variableName] = value;
    }
  }

  // Event handlers for template variables
  onVariableInput(event: Event, variableName: string): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.templateVariables[variableName] = target.value;
  }

  onVariableChange(event: Event, variableName: string): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.type === 'checkbox') {
      this.templateVariables[variableName] = (target as HTMLInputElement).checked;
    } else {
      this.templateVariables[variableName] = target.value;
    }
  }

  getVariableValue(variableName: string): any {
    return this.templateVariables[variableName] || '';
  }

  isVariableRequired(variable: TemplateVariable): boolean {
    return variable.required || false;
  }
}