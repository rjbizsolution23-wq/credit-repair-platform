import { Component, OnInit, OnDestroy } from '@angular/core';
import { TitleCasePipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { DisputesService } from '../disputes.service';
import { ClientsService } from '../../clients/clients.service';
import { ToastrService } from 'ngx-toastr';
import { Dispute, DisputeType } from '../disputes.model';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  selected?: boolean;
}

interface DisputeTemplate {
  id: string;
  name: string;
  type: DisputeType;
  bureau: any;
  subject: string;
  content: string;
  variables: any[];
  is_active: boolean;
  created_date: Date;
  updated_date: Date;
}

interface BulkDisputeItem {
  clientId: string;
  templateId: string;
  type: string;
  priority: string;
  creditBureaus: string[];
  reason: string;
  description: string;
  dueDate: Date;
  customizations?: {
    subject?: string;
    content?: string;
    variables?: { [key: string]: string };
  };
}

interface BulkCreateProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  errors: { client: string; error: string }[];
}

@Component({
  selector: 'app-bulk-create-disputes',
  templateUrl: './bulk-create-disputes.component.html',
  styleUrls: ['./bulk-create-disputes.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, TitleCasePipe],
  standalone: true
})
export class BulkCreateDisputesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form and data
  bulkForm: FormGroup;
  clients: Client[] = [];
  templates: DisputeTemplate[] = [];
  selectedClients: Client[] = [];
  selectedTemplate: DisputeTemplate | null = null;
  
  // UI state
  loading = false;
  error: string | null = null;
  currentStep = 1;
  totalSteps = 4;
  
  // Bulk creation
  isCreating = false;
  createProgress: BulkCreateProgress | null = null;
  showProgressModal = false;
  
  // Options
  disputeTypes = [
    { value: 'inaccurate_info', label: 'Inaccurate Information' },
    { value: 'identity_theft', label: 'Identity Theft' },
    { value: 'mixed_files', label: 'Mixed Files' },
    { value: 'outdated_info', label: 'Outdated Information' },
    { value: 'duplicate_accounts', label: 'Duplicate Accounts' },
    { value: 'unauthorized_inquiry', label: 'Unauthorized Inquiry' },
    { value: 'other', label: 'Other' }
  ];
  
  priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  creditBureauOptions = [
    { value: 'experian', label: 'Experian' },
    { value: 'equifax', label: 'Equifax' },
    { value: 'transunion', label: 'TransUnion' }
  ];
  
  // Filters
  clientFilters = {
    searchTerm: '',
    status: 'all'
  };
  
  templateFilters = {
    searchTerm: '',
    category: 'all',
    type: 'all'
  };
  
  filteredClients: Client[] = [];
  filteredTemplates: DisputeTemplate[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private disputesService: DisputesService,
    private clientsService: ClientsService,
    private toastr: ToastrService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.bulkForm = this.fb.group({
      // Step 1: Client Selection
      clientSelection: this.fb.group({
        selectAll: [false],
        selectedClientIds: [[], Validators.required]
      }),
      
      // Step 2: Template Selection
      templateSelection: this.fb.group({
        templateId: ['', Validators.required],
        useCustomizations: [false]
      }),
      
      // Step 3: Dispute Configuration
      disputeConfig: this.fb.group({
        type: ['', Validators.required],
        priority: ['medium', Validators.required],
        creditBureaus: [['experian', 'equifax', 'transunion'], Validators.required],
        reason: ['', [Validators.required, Validators.minLength(10)]],
        description: [''],
        dueDate: [this.getDefaultDueDate(), Validators.required],
        customSubject: [''],
        customContent: [''],
        variables: this.fb.array([])
      }),
      
      // Step 4: Review
      review: this.fb.group({
        confirmed: [false, Validators.requiredTrue]
      })
    });
  }

  public loadData(): void {
    this.loading = true;
    this.error = null;
    
    forkJoin({
      clients: this.clientsService.getAllClients(),
      templates: this.disputesService.getTemplates()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ clients, templates }) => {
        this.clients = clients.data.filter((client: any) => client.status === 'active');
        this.templates = templates.filter(template => template.is_active);
        this.applyClientFilters();
        this.applyTemplateFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load data. Please try again.';
        this.loading = false;
        console.error('Error loading data:', error);
      }
    });
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps && this.isCurrentStepValid()) {
      this.currentStep++;
      
      // Load template details when moving to step 3
      if (this.currentStep === 3 && this.selectedTemplate) {
        this.setupTemplateVariables();
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

  onCreditBureauChange(bureauValue: string, checked: boolean): void {
    const creditBureausControl = this.bulkForm.get('disputeConfig.creditBureaus');
    if (creditBureausControl) {
      const currentBureaus = creditBureausControl.value || [];
      if (checked) {
        if (!currentBureaus.includes(bureauValue)) {
          creditBureausControl.setValue([...currentBureaus, bureauValue]);
        }
      } else {
        creditBureausControl.setValue(currentBureaus.filter((b: string) => b !== bureauValue));
      }
    }
  }

  public isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.selectedClients.length > 0;
      case 2:
        return !!this.selectedTemplate;
      case 3:
        return this.bulkForm.get('disputeConfig')?.valid || false;
      case 4:
        return this.bulkForm.get('review')?.valid || false;
      default:
        return false;
    }
  }

  // Client Selection
  onClientSearch(searchTerm: string): void {
    this.clientFilters.searchTerm = searchTerm;
    this.applyClientFilters();
  }

  onClientStatusFilter(status: string): void {
    this.clientFilters.status = status;
    this.applyClientFilters();
  }

  private applyClientFilters(): void {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.clientFilters.searchTerm || 
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(this.clientFilters.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.clientFilters.searchTerm.toLowerCase());
      
      const matchesStatus = this.clientFilters.status === 'all' || client.status === this.clientFilters.status;
      
      return matchesSearch && matchesStatus;
    });
  }

  toggleClientSelection(client: Client): void {
    const index = this.selectedClients.findIndex(c => c.id === client.id);
    if (index > -1) {
      this.selectedClients.splice(index, 1);
    } else {
      this.selectedClients.push(client);
    }
    this.updateClientSelectionForm();
  }

  toggleAllClients(): void {
    const selectAll = this.bulkForm.get('clientSelection.selectAll')?.value;
    if (selectAll) {
      this.selectedClients = [...this.filteredClients];
    } else {
      this.selectedClients = [];
    }
    this.updateClientSelectionForm();
  }

  public updateClientSelectionForm(): void {
    const selectedIds = this.selectedClients.map(c => c.id);
    this.bulkForm.patchValue({
      clientSelection: {
        selectedClientIds: selectedIds,
        selectAll: selectedIds.length === this.filteredClients.length && this.filteredClients.length > 0
      }
    });
  }

  isClientSelected(client: Client): boolean {
    return this.selectedClients.some(c => c.id === client.id);
  }

  // Template Selection
  onTemplateSearch(searchTerm: string): void {
    this.templateFilters.searchTerm = searchTerm;
    this.applyTemplateFilters();
  }

  onTemplateFilter(filterType: string, value: string): void {
    if (filterType === 'category') {
      this.templateFilters.category = value;
    } else if (filterType === 'type') {
      this.templateFilters.type = value;
    }
    this.applyTemplateFilters();
  }

  private applyTemplateFilters(): void {
    this.filteredTemplates = this.templates.filter(template => {
      const matchesSearch = !this.templateFilters.searchTerm || 
        template.name.toLowerCase().includes(this.templateFilters.searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(this.templateFilters.searchTerm.toLowerCase());
      
      const matchesType = this.templateFilters.type === 'all' || template.type === this.templateFilters.type;
      
      return matchesSearch && matchesType;
    });
  }

  selectTemplate(template: DisputeTemplate): void {
    this.selectedTemplate = template;
    this.bulkForm.patchValue({
      templateSelection: {
        templateId: template.id
      }
    });
  }

  // Template Variables
  private setupTemplateVariables(): void {
    if (!this.selectedTemplate) return;
    
    const variablesArray = this.bulkForm.get('disputeConfig.variables') as FormArray;
    variablesArray.clear();
    
    // Extract variables from template content
    const variables = this.extractTemplateVariables(this.selectedTemplate.content);
    
    variables.forEach(variable => {
      variablesArray.push(this.fb.group({
        key: [variable],
        value: ['', Validators.required],
        description: [this.getVariableDescription(variable)]
      }));
    });
  }

  private extractTemplateVariables(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }

  private getVariableDescription(variable: string): string {
    const descriptions: { [key: string]: string } = {
      'client.firstName': 'Client\'s first name',
      'client.lastName': 'Client\'s last name',
      'client.fullName': 'Client\'s full name',
      'client.address': 'Client\'s address',
      'dispute.date': 'Dispute creation date',
      'dispute.reference': 'Dispute reference number',
      'account.number': 'Account number',
      'creditor.name': 'Creditor name',
      'amount': 'Disputed amount'
    };
    
    return descriptions[variable] || `Value for ${variable}`;
  }

  get variablesFormArray(): FormArray {
    return this.bulkForm.get('disputeConfig.variables') as FormArray;
  }

  // Utility Methods
  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  getStepTitle(step: number): string {
    const titles = {
      1: 'Select Clients',
      2: 'Choose Template',
      3: 'Configure Disputes',
      4: 'Review & Create'
    };
    return titles[step as keyof typeof titles] || '';
  }

  // Bulk Creation
  async createBulkDisputes(): Promise<void> {
    if (!this.isCurrentStepValid() || this.isCreating) return;
    
    this.isCreating = true;
    this.showProgressModal = true;
    
    const disputeConfig = this.bulkForm.get('disputeConfig')?.value;
    const variables = this.variablesFormArray.value.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    
    this.createProgress = {
      total: this.selectedClients.length,
      completed: 0,
      failed: 0,
      current: '',
      errors: []
    };
    
    try {
      for (const client of this.selectedClients) {
        this.createProgress.current = `${client.firstName} ${client.lastName}`;
        
        try {
          const disputeData: Partial<Dispute> = {
            client_id: client.id,
            template_id: this.selectedTemplate!.id,
            type: disputeConfig.type as DisputeType,
            priority: disputeConfig.priority as any,
            bureau: disputeConfig.creditBureaus[0] as any,
            reason: disputeConfig.reason as any,
            description: disputeConfig.description,
            due_date: disputeConfig.dueDate,
            letter_content: disputeConfig.customContent || this.selectedTemplate!.content,
            delivery_method: 'online' as any,
            created_date: new Date(),
            updated_date: new Date(),
            notes: '',
            dispute_items: [],
            attachments: [],
            created_by: 'system',
            updated_by: 'system'
          };
          
          await this.disputesService.createDispute(disputeData).toPromise();
          this.createProgress.completed++;
          
        } catch (error) {
          this.createProgress.failed++;
          this.createProgress.errors.push({
            client: `${client.firstName} ${client.lastName}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      this.createProgress.current = 'Completed';
      
      if (this.createProgress.failed === 0) {
        this.toastr.success(
          `Successfully created ${this.createProgress.completed} disputes`,
          'Bulk Creation Complete'
        );
      } else {
        this.toastr.warning(
          `Created ${this.createProgress.completed} disputes, ${this.createProgress.failed} failed`,
          'Bulk Creation Completed with Errors'
        );
      }
      
    } catch (error) {
      this.toastr.error('Failed to create disputes', 'Error');
      console.error('Bulk creation error:', error);
    } finally {
      this.isCreating = false;
    }
  }

  closeProgressModal(): void {
    this.showProgressModal = false;
    if (this.createProgress && this.createProgress.completed > 0) {
      this.router.navigate(['/disputes/active']);
    }
  }

  // Form Validation
  isFormValid(): boolean {
    return this.bulkForm.valid && this.selectedClients.length > 0 && !!this.selectedTemplate;
  }

  getFormErrors(): string[] {
    const errors: string[] = [];
    
    if (this.selectedClients.length === 0) {
      errors.push('Please select at least one client');
    }
    
    if (!this.selectedTemplate) {
      errors.push('Please select a dispute template');
    }
    
    const disputeConfig = this.bulkForm.get('disputeConfig');
    if (disputeConfig?.invalid) {
      if (disputeConfig.get('type')?.invalid) {
        errors.push('Please select a dispute type');
      }
      if (disputeConfig.get('reason')?.invalid) {
        errors.push('Please provide a dispute reason (minimum 10 characters)');
      }
      if (disputeConfig.get('dueDate')?.invalid) {
        errors.push('Please select a valid due date');
      }
    }
    
    return errors;
  }

  // Navigation
  cancel(): void {
    this.router.navigate(['/disputes']);
  }

  trackByClientId(index: number, client: Client): string {
    return client.id;
  }

  trackByTemplateId(index: number, template: DisputeTemplate): string {
    return template.id;
  }
}