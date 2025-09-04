import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Models
import {
  DisputeTemplate,
  DisputeType,
  DisputeLetter,
  DisputeReason,
  CreditBureau,
  DisputeStatus,
  getDisputeTypeLabel,
  getDisputeReasonLabel,
  getCreditBureauLabel,
  getDisputeStatusLabel,
  getDisputeTypeColor,
  getDisputeReasonColor,
  getCreditBureauColor,
  getDisputeStatusColor
} from '../disputes.model';

// Services
import { DisputesService } from '../disputes.service';
import { ClientsService } from '../../clients/clients.service';
import { NotificationService } from '../../../../shared/services/shared.services';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface CreditItem {
  id: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  status: string;
  bureau: CreditBureau;
  disputeReasons: DisputeReason[];
}

@Component({
  selector: 'app-dispute-generator',
  templateUrl: './dispute-generator.component.html',
  styleUrls: ['./dispute-generator.component.scss']
})
export class DisputeGeneratorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form
  disputeForm: FormGroup;
  
  // Data
  clients: Client[] = [];
  selectedClient: Client | null = null;
  creditItems: CreditItem[] = [];
  templates: DisputeTemplate[] = [];
  selectedTemplate: DisputeTemplate | null = null;
  
  // UI State
  loading = false;
  generating = false;
  step = 1;
  maxSteps = 4;
  
  // Generated Letters
  generatedLetters: DisputeLetter[] = [];
  previewLetter: DisputeLetter | null = null;
  
  // Enums for template
  DisputeType = DisputeType;
  DisputeReason = DisputeReason;
  CreditBureau = CreditBureau;
  DisputeStatus = DisputeStatus;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private disputesService: DisputesService,
    private clientsService: ClientsService,
    private notificationService: NotificationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private showError(message: string): void {
    // TODO: Implement error notification
    console.error(message);
  }

  private showSuccess(message: string): void {
    // TODO: Implement success notification
    console.log(message);
  }

  private initializeForm(): void {
    this.disputeForm = this.fb.group({
      clientId: ['', Validators.required],
      disputeType: [DisputeType.ACCOUNT_DISPUTE, Validators.required],
      templateId: ['', Validators.required],
      customInstructions: [''],
      includeDocumentation: [true],
      requestMethod: ['certified_mail'],
      selectedItems: this.fb.array([]),
      personalizations: this.fb.group({
        includeClientSignature: [true],
        includeDate: [true],
        includeAccountDetails: [true],
        customClosing: [''],
        additionalRequests: ['']
      })
    });
  }

  private loadInitialData(): void {
    this.loading = true;
    
    // Load clients
    this.clientsService.getAllClients()
       .pipe(takeUntil(this.destroy$))
       .subscribe({
         next: (response: any) => {
           this.clients = response.data || response;
         },
         error: (error: any) => {
           console.error('Error loading clients:', error);
           this.showError('Failed to load clients');
         }
       });
    
    // Load templates
    this.disputesService.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates: DisputeTemplate[]) => {
          this.templates = templates;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading templates:', error);
          this.notificationService.error('Failed to load templates');
          this.loading = false;
        }
      });
  }

  // Form getters
  get selectedItemsArray(): FormArray {
    return this.disputeForm.get('selectedItems') as FormArray;
  }

  get personalizations(): FormGroup {
    return this.disputeForm.get('personalizations') as FormGroup;
  }

  get canGenerateLetters(): boolean {
    return !!(this.disputeForm.get('clientId')?.valid &&
           this.disputeForm.get('templateId')?.valid &&
           this.selectedItemsArray.length > 0);
  }

  get canPreviewLetters(): boolean {
    return !!(this.disputeForm.get('templateId')?.valid);
  }

  // Step navigation
  nextStep(): void {
    if (this.step < this.maxSteps && this.isCurrentStepValid()) {
      this.step++;
      
      if (this.step === 2) {
        this.loadClientCreditItems();
      } else if (this.step === 4) {
        this.generatePreview();
      }
    }
  }

  previousStep(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.maxSteps) {
      this.step = step;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.step) {
      case 1:
        return !!(this.disputeForm.get('clientId')?.valid && 
               this.disputeForm.get('disputeType')?.valid);
      case 2:
        return this.selectedItemsArray.length > 0;
      case 3:
        return !!(this.disputeForm.get('templateId')?.valid);
      case 4:
        return true;
      default:
        return false;
    }
  }

  // Client selection
  onClientChange(): void {
    const clientId = this.disputeForm.get('clientId')?.value;
    this.selectedClient = this.clients.find(c => c.id === clientId) || null;
    
    // Clear selected items when client changes
    this.selectedItemsArray.clear();
    this.creditItems = [];
  }

  private loadClientCreditItems(): void {
    if (!this.selectedClient) return;
    
    this.loading = true;
    
    this.clientsService.getClientCreditReport(this.selectedClient.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (creditReport: any) => {
          this.creditItems = this.processCreditItems(creditReport);
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading credit items:', error);
          this.notificationService.error('Failed to load credit items');
          this.loading = false;
        }
      });
  }

  private processCreditItems(creditReport: any): CreditItem[] {
    // Process credit report data into dispute-ready items
    const items: CreditItem[] = [];
    
    // Process accounts
    if (creditReport.accounts) {
      creditReport.accounts.forEach((account: any) => {
        items.push({
          id: account.id,
          accountName: account.creditorName || account.accountName,
          accountNumber: account.accountNumber,
          balance: account.balance || 0,
          status: account.paymentStatus || account.status,
          bureau: account.bureau || CreditBureau.EXPERIAN,
          disputeReasons: this.getApplicableReasons(account)
        });
      });
    }
    
    // Process inquiries
    if (creditReport.inquiries) {
      creditReport.inquiries.forEach((inquiry: any) => {
        items.push({
          id: inquiry.id,
          accountName: `${inquiry.inquirerName} (Inquiry)`,
          accountNumber: inquiry.inquiryId || 'N/A',
          balance: 0,
          status: 'Inquiry',
          bureau: inquiry.bureau || CreditBureau.EXPERIAN,
          disputeReasons: [DisputeReason.NOT_MINE, DisputeReason.INCORRECT_DATES]
        });
      });
    }
    
    return items;
  }

  private getApplicableReasons(account: any): DisputeReason[] {
    const reasons: DisputeReason[] = [];
    
    // Add reasons based on account characteristics
    if (account.paymentHistory?.includes('late')) {
      reasons.push(DisputeReason.INCORRECT_PAYMENT_HISTORY);
    }
    
    if (account.balance !== account.originalBalance) {
      reasons.push(DisputeReason.INCORRECT_BALANCE);
    }
    
    if (account.status === 'closed' && account.reportedAsOpen) {
      reasons.push(DisputeReason.ACCOUNT_CLOSED);
    }
    
    // Always include these as options
    reasons.push(
      DisputeReason.NOT_MINE,
      DisputeReason.DUPLICATE,
      DisputeReason.INCORRECT_DATES
    );
    
    return [...new Set(reasons)]; // Remove duplicates
  }

  // Item selection
  onItemSelect(item: CreditItem, selected: boolean): void {
    if (selected) {
      this.selectedItemsArray.push(this.fb.group({
        itemId: [item.id],
        accountName: [item.accountName],
        accountNumber: [item.accountNumber],
        bureau: [item.bureau],
        selectedReasons: [[], Validators.required],
        customReason: [''],
        supportingDocuments: [[]]
      }));
    } else {
      const index = this.selectedItemsArray.controls.findIndex(
        control => control.get('itemId')?.value === item.id
      );
      if (index >= 0) {
        this.selectedItemsArray.removeAt(index);
      }
    }
  }

  isItemSelected(item: CreditItem): boolean {
    return this.selectedItemsArray.controls.some(
      control => control.get('itemId')?.value === item.id
    );
  }

  getSelectedItemControl(item: CreditItem): FormGroup | null {
    const control = this.selectedItemsArray.controls.find(
      control => control.get('itemId')?.value === item.id
    );
    return control as FormGroup || null;
  }

  // Reason selection
  onReasonChange(item: CreditItem, reason: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const itemControl = this.getSelectedItemControl(item);
    
    if (itemControl) {
      const selectedReasons = itemControl.get('selectedReasons')?.value || [];
      
      if (target.checked) {
        // Add reason if not already selected
        if (!selectedReasons.includes(reason)) {
          itemControl.patchValue({
            selectedReasons: [...selectedReasons, reason]
          });
        }
      } else {
        // Remove reason
        itemControl.patchValue({
          selectedReasons: selectedReasons.filter((r: string) => r !== reason)
        });
      }
    }
  }

  // Template selection
  onTemplateChange(): void {
    const templateId = this.disputeForm.get('templateId')?.value;
    this.selectedTemplate = this.templates.find(t => t.id === templateId) || null;
  }

  // Letter generation
  generatePreview(): void {
    if (!this.selectedClient || !this.selectedTemplate) return;
    
    this.generating = true;
    
    const disputeData = {
      client: this.selectedClient,
      template: this.selectedTemplate,
      selectedItems: this.selectedItemsArray.value,
      personalizations: this.personalizations.value,
      disputeType: this.disputeForm.get('disputeType')?.value,
      customInstructions: this.disputeForm.get('customInstructions')?.value
    };
    
    this.disputesService.generateDisputeLetters(disputeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters: any) => {
          this.generatedLetters = letters;
          this.previewLetter = letters[0] || null;
          this.generating = false;
        },
        error: (error: any) => {
          console.error('Error generating letters:', error);
          this.notificationService.error('Failed to generate dispute letters');
          this.generating = false;
        }
      });
  }

  // Letter actions
  showPreview(letter: DisputeLetter): void {
    this.previewLetter = letter;
  }

  editLetter(letter: DisputeLetter): void {
    // Open letter editor modal or navigate to editor
    this.router.navigate(['/disputes/letters', letter.id, 'edit']);
  }

  downloadLetter(letter: DisputeLetter): void {
    this.disputesService.downloadLetter(letter.dispute_id, letter.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${letter.subject}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error downloading letter:', error);
          this.notificationService.error('Failed to download letter');
        }
      });
  }

  downloadAllLetters(): void {
    if (this.generatedLetters.length === 0) return;
    
    this.disputesService.downloadMultipleLetters(this.generatedLetters.map(l => l.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `dispute-letters-${new Date().toISOString().split('T')[0]}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error downloading letters:', error);
          this.notificationService.error('Failed to download letters');
        }
      });
  }

  saveAndSendLetters(): void {
    if (this.generatedLetters.length === 0) return;
    
    this.generating = true;
    
    const saveData = {
      letters: this.generatedLetters,
      clientId: this.selectedClient?.id,
      sendMethod: this.disputeForm.get('requestMethod')?.value,
      includeDocumentation: this.disputeForm.get('includeDocumentation')?.value
    };
    
    this.disputesService.saveAndSendLetters(saveData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          this.notificationService.success('Dispute letters saved and sent successfully');
          this.router.navigate(['/disputes']);
        },
        error: (error: any) => {
          console.error('Error saving letters:', error);
          this.notificationService.error('Failed to save and send letters');
          this.generating = false;
        }
      });
  }

  // Utility methods
  getDisputeTypeLabel = getDisputeTypeLabel;
  getDisputeReasonLabel = getDisputeReasonLabel;
  getCreditBureauLabel = getCreditBureauLabel;
  getDisputeStatusLabel = getDisputeStatusLabel;
  getDisputeTypeColor = getDisputeTypeColor;
  getDisputeReasonColor = getDisputeReasonColor;
  getCreditBureauColor = getCreditBureauColor;
  getDisputeStatusColor = getDisputeStatusColor;
// Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getFormattedRequestMethod(): string {
    const method = this.disputeForm.get('requestMethod')?.value;
    if (!method) return '';
    return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  }

  getStepTitle(step: number): string {
    switch (step) {
      case 1: return 'Client & Dispute Type';
      case 2: return 'Select Items to Dispute';
      case 3: return 'Choose Template & Customize';
      case 4: return 'Review & Generate';
      default: return '';
    }
  }

  getStepDescription(step: number): string {
    switch (step) {
      case 1: return 'Select the client and type of dispute you want to create';
      case 2: return 'Choose which credit report items you want to dispute';
      case 3: return 'Select a letter template and customize the content';
      case 4: return 'Review the generated letters and send them out';
      default: return '';
    }
  }

  // Generate letters
  generateLetters(): void {
    if (!this.canProceed()) {
      this.notificationService.error('Please complete all required fields');
      return;
    }

    this.generating = true;
    
    const disputeData = {
      clientId: this.disputeForm.get('clientId')?.value,
      disputeType: this.disputeForm.get('disputeType')?.value,
      templateId: this.disputeForm.get('templateId')?.value,
      selectedItems: this.selectedItemsArray.value,
      customizations: this.disputeForm.get('customizations')?.value
    };

    this.disputesService.generateDisputeLetters(disputeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters: DisputeLetter[]) => {
          this.generatedLetters = letters;
          this.generating = false;
          this.notificationService.success('Letters generated successfully!');
        },
        error: (error: any) => {
          console.error('Error generating letters:', error);
          this.notificationService.error('Failed to generate letters');
          this.generating = false;
        }
      });
  }

  // Check if user can proceed to generate letters
  canProceed(): boolean {
    return this.disputeForm.valid && 
           this.selectedItemsArray.length > 0 && 
           !!this.selectedTemplate;
  }

  // Reset form
  resetForm(): void {
    this.disputeForm.reset();
    this.selectedClient = null;
    this.selectedTemplate = null;
    this.creditItems = [];
    this.generatedLetters = [];
    this.previewLetter = null;
    this.step = 1;
    this.selectedItemsArray.clear();
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/disputes']);
  }
}