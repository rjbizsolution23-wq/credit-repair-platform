import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { UspsService } from '../../services/usps.service';
import { MyfreescoreService } from '../../services/myfreescore.service';

interface MailTemplate {
  id: string;
  name: string;
  type: 'dispute' | 'verification' | 'follow-up' | 'validation' | 'goodwill' | 'welcome' | 'reminder' | 'update' | 'marketing' | 'legal';
  subject: string;
  content: string;
  isActive: boolean;
  usageCount: number;
  successRate: number;
  lastUsed: Date;
  variables?: string[];
  postageClass?: 'USPS_GROUND_ADVANTAGE' | 'PRIORITY_MAIL' | 'PRIORITY_MAIL_EXPRESS';
}

interface MailRecipient {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  type: 'creditor' | 'bureau' | 'collection' | 'attorney' | 'court';
  contactInfo?: {
    phone?: string;
    email?: string;
    fax?: string;
  };
  status?: 'active' | 'inactive' | 'bounced' | 'verified';
  preferences?: {
    email: boolean;
    postal: boolean;
    sms: boolean;
  };
}

interface MailItem {
  id: string;
  clientId: string;
  clientName: string;
  templateId: string;
  templateName: string;
  recipient: MailRecipient;
  status: 'draft' | 'queued' | 'sent' | 'delivered' | 'returned' | 'failed' | 'processing';
  mailType: 'certified' | 'priority' | 'express' | 'standard';
  trackingNumber?: string;
  sentDate?: Date;
  deliveredDate?: Date;
  cost: number;
  attachments: string[];
  notes?: string;
  uspsLabelId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  openedDate?: Date;
  clickedDate?: Date;
}

interface MailStats {
  totalSent: number;
  totalDelivered: number;
  totalReturned: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  monthlyCost: number;
  pendingMail: number;
}

@Component({
  selector: 'app-mailing',
  templateUrl: './mailing.component.html',
  styleUrls: ['./mailing.component.scss']
})
export class MailingComponent implements OnInit {
  activeTab: string = 'dashboard';
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  dateFilter: string = 'all';
  
  // Data properties
  mailItems: MailItem[] = [];
  filteredMailItems: MailItem[] = [];
  mailTemplates: MailTemplate[] = [];
  recipients: MailRecipient[] = [];
  stats: MailStats = {
    totalSent: 0,
    totalDelivered: 0,
    totalReturned: 0,
    deliveryRate: 0,
    avgDeliveryTime: 0,
    monthlyCost: 0,
    pendingMail: 0
  };
  
  // Chart data
  mailVolumeChart: any = {};
  deliveryRateChart: any = {};
  costAnalysisChart: any = {};
  
  // Form data
  newMailItem: Partial<MailItem> = {};
  selectedTemplate: MailTemplate | null = null;
  selectedRecipient: MailRecipient | null = null;
  
  // UI state
  isLoading: boolean = false;
  showNewMailModal: boolean = false;
  showTemplateModal: boolean = false;
  
  // USPS Integration properties
  uspsConnected: boolean = false;
  trackingResults: any[] = [];
  bulkOperationProgress: {
    inProgress: boolean;
    total: number;
    completed: number;
    results: any[];
  } = {
    inProgress: false,
    total: 0,
    completed: 0,
    results: []
  };
  showBulkModal: boolean = false;
  selectedMailItems: MailItem[] = [];
  
  constructor(
    private uspsService: UspsService,
    private creditService: MyfreescoreService
  ) { }

  ngOnInit(): void {
    this.loadMailData();
    this.loadTemplates();
    this.loadRecipients();
    this.calculateStats();
    this.initializeCharts();
    this.checkUspsConnection();
  }

  checkUspsConnection(): void {
    this.uspsConnected = this.uspsService.isAuthenticated();
  }

  async connectUsps(): Promise<void> {
    try {
      // In a real implementation, this would handle OAuth or API key setup
      await this.uspsService.setPaymentToken('demo-token');
      this.uspsConnected = true;
    } catch (error) {
      console.error('Failed to connect to USPS:', error);
    }
  }

  async createPostalMail(mailData: Partial<MailItem>): Promise<void> {
    if (!this.uspsConnected) {
      await this.connectUsps();
    }

    try {
      const recipient = this.recipients.find(r => r.id === mailData.recipient);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      const labelRequest = this.uspsService.createStandardLabelRequest(
        {
          streetAddress: '123 Business St',
          city: 'Business City',
          state: 'CA',
          zipCode: '90210'
        },
        recipient.address,
        {
          length: 8.5,
          width: 11,
          height: 0.25,
          weight: 1
        }
      );

      const labelResponse = await this.uspsService.createLabel(labelRequest);
      
      // Update mail item with USPS data
      const newMailItem: MailItem = {
        id: this.generateId(),
        subject: mailData.subject || '',
        recipient: recipient.name,
        recipientEmail: recipient.email,
        recipientAddress: recipient.address,
        template: mailData.template || '',
        status: 'processing',
        cost: labelResponse.totalPrice || 0,
        trackingNumber: labelResponse.trackingNumber,
        type: 'postal',
        uspsLabelId: labelResponse.labelId,
        priority: mailData.priority || 'medium',
        category: mailData.category || 'dispute',
        sentDate: new Date()
      };

      this.mailItems.push(newMailItem);
      this.filterMailItems();
      this.calculateStats();
    } catch (error) {
      console.error('Failed to create postal mail:', error);
    }
  }

  async trackMail(trackingNumber: string): Promise<void> {
    try {
      const trackingData = await this.uspsService.trackPackages([trackingNumber]);
      this.trackingResults = trackingData;
      
      // Update mail item status based on tracking
      const mailItem = this.mailItems.find(item => item.trackingNumber === trackingNumber);
      if (mailItem && trackingData.length > 0) {
        const status = trackingData[0].status;
        if (status === 'Delivered') {
          mailItem.status = 'delivered';
          mailItem.deliveredDate = new Date();
        } else if (status === 'In Transit') {
          mailItem.status = 'sent';
        }
      }
    } catch (error) {
      console.error('Failed to track mail:', error);
    }
  }

  async validateRecipientAddress(recipient: MailRecipient): Promise<boolean> {
    try {
      const isValid = await this.uspsService.validateAddress(recipient.address);
      if (isValid) {
        recipient.status = 'verified';
      }
      return isValid;
    } catch (error) {
      console.error('Failed to validate address:', error);
      return false;
    }
  }

  async bulkCreateLabels(): Promise<void> {
    if (this.selectedMailItems.length === 0) return;

    this.showBulkModal = true;
    this.bulkOperationProgress = 0;

    const labelRequests = this.selectedMailItems.map(itemId => {
      const mailItem = this.mailItems.find(item => item.id === itemId);
      const recipient = this.recipients.find(r => r.name === mailItem?.recipient);
      
      if (!recipient) return null;

      return this.uspsService.createStandardLabelRequest(
        {
          streetAddress: '123 Business St',
          city: 'Business City',
          state: 'CA',
          zipCode: '90210'
        },
        recipient.address,
        {
          length: 8.5,
          width: 11,
          height: 0.25,
          weight: 1
        }
      );
    }).filter(req => req !== null);

    try {
      const results = await this.uspsService.createBulkLabels(labelRequests);
      
      results.forEach((result, index) => {
        const mailItemId = this.selectedMailItems[index];
        const mailItem = this.mailItems.find(item => item.id === mailItemId);
        
        if (mailItem && result.success) {
          mailItem.trackingNumber = result.trackingNumber;
          mailItem.uspsLabelId = result.labelId;
          mailItem.status = 'sent';
          mailItem.cost = result.totalPrice || 0;
        }
        
        this.bulkOperationProgress = ((index + 1) / results.length) * 100;
      });

      this.selectedMailItems = [];
      this.calculateStats();
    } catch (error) {
      console.error('Bulk label creation failed:', error);
    } finally {
      setTimeout(() => {
        this.showBulkModal = false;
        this.bulkOperationProgress = 0;
      }, 2000);
    }
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  loadMailData(): void {
    this.isLoading = true;
    
    // Demo data - replace with actual API call
    setTimeout(() => {
      this.mailItems = [
        {
          id: 'mail-001',
          clientId: 'client-001',
          clientName: 'John Smith',
          templateId: 'template-001',
          templateName: 'Credit Bureau Dispute Letter',
          recipient: {
            id: 'recipient-001',
            name: 'Equifax Information Services',
            address: {
              street: 'P.O. Box 740241',
              city: 'Atlanta',
              state: 'GA',
              zipCode: '30374'
            },
            type: 'bureau'
          },
          status: 'delivered',
          mailType: 'certified',
          trackingNumber: '9405511206213123456789',
          sentDate: new Date('2024-01-15'),
          deliveredDate: new Date('2024-01-17'),
          cost: 8.95,
          attachments: ['dispute-documentation.pdf', 'identity-verification.pdf'],
          notes: 'Initial dispute for inaccurate account information',
          uspsLabelId: 'LBL001234567',
          priority: 'high',
          openedDate: new Date('2024-01-17')
        },
        {
          id: 'mail-002',
          clientId: 'client-002',
          clientName: 'Sarah Johnson',
          templateId: 'template-002',
          templateName: 'Debt Validation Request',
          recipient: {
            id: 'recipient-002',
            name: 'ABC Collections',
            address: {
              street: '123 Collection Ave',
              city: 'Phoenix',
              state: 'AZ',
              zipCode: '85001'
            },
            type: 'collection'
          },
          status: 'sent',
          mailType: 'certified',
          trackingNumber: '9405511206213123456790',
          sentDate: new Date('2024-01-20'),
          cost: 8.95,
          attachments: ['validation-request.pdf'],
          notes: 'Requesting validation of alleged debt',
          uspsLabelId: 'LBL001234568',
          priority: 'urgent'
        },
        {
          id: 'mail-003',
          clientId: 'client-003',
          clientName: 'Michael Brown',
          templateId: 'template-003',
          templateName: 'Goodwill Letter',
          recipient: {
            id: 'recipient-003',
            name: 'Capital One Bank',
            address: {
              street: 'P.O. Box 30285',
              city: 'Salt Lake City',
              state: 'UT',
              zipCode: '84130'
            },
            type: 'creditor'
          },
          status: 'processing',
          mailType: 'priority',
          cost: 6.95,
          attachments: ['payment-history.pdf'],
          notes: 'Requesting goodwill removal of late payment',
          uspsLabelId: 'LBL001234569',
          priority: 'medium'
        },
        {
          id: 'mail-004',
          clientId: 'client-004',
          clientName: 'Lisa Wilson',
          templateId: 'template-006',
          templateName: 'Welcome Package',
          recipient: {
            id: 'recipient-004',
            name: 'Lisa Wilson',
            address: {
              street: '456 Main St',
              city: 'Denver',
              state: 'CO',
              zipCode: '80202'
            },
            type: 'creditor'
          },
          status: 'delivered',
          mailType: 'priority',
          trackingNumber: '9405511206213123456791',
          sentDate: new Date('2024-01-19'),
          deliveredDate: new Date('2024-01-21'),
          cost: 15.50,
          attachments: ['welcome-packet.pdf', 'program-guide.pdf'],
          notes: 'New client onboarding materials',
          uspsLabelId: 'LBL001234570',
          priority: 'high',
          openedDate: new Date('2024-01-21')
        },
        {
          id: 'mail-005',
          clientId: 'client-005',
          clientName: 'David Martinez',
          templateId: 'template-007',
          templateName: 'Monthly Progress Report',
          recipient: {
            id: 'recipient-005',
            name: 'David Martinez',
            address: {
              street: '789 Oak Ave',
              city: 'Austin',
              state: 'TX',
              zipCode: '73301'
            },
            type: 'creditor'
          },
          status: 'sent',
          mailType: 'standard',
          trackingNumber: '9405511206213123456792',
          sentDate: new Date('2024-01-22'),
          cost: 6.75,
          attachments: ['progress-report.pdf'],
          notes: 'Monthly update showing 45-point score increase',
          uspsLabelId: 'LBL001234571',
          priority: 'medium'
        }
      ];
      
      this.filteredMailItems = [...this.mailItems];
      this.isLoading = false;
    }, 1000);
  }
  
  loadTemplates(): void {
    // Demo templates - replace with actual API call
    this.mailTemplates = [
      {
        id: 'template-001',
        name: 'Credit Bureau Dispute Letter',
        type: 'dispute',
        subject: 'Dispute of Inaccurate Information',
        content: 'Dear Credit Reporting Agency,\n\nI am writing to dispute the following information in my file...',
        isActive: true,
        usageCount: 45,
        successRate: 78,
        lastUsed: new Date('2024-01-15'),
        variables: ['client_name', 'account_number', 'dispute_reason'],
        postageClass: 'USPS_GROUND_ADVANTAGE'
      },
      {
        id: 'template-002',
        name: 'Debt Validation Request',
        type: 'validation',
        subject: 'Request for Debt Validation',
        content: 'Dear Debt Collector,\n\nI am requesting that you provide validation of this debt...',
        isActive: true,
        usageCount: 32,
        successRate: 85,
        lastUsed: new Date('2024-01-20'),
        variables: ['client_name', 'debt_amount', 'original_creditor'],
        postageClass: 'PRIORITY_MAIL'
      },
      {
        id: 'template-003',
        name: 'Goodwill Letter',
        type: 'goodwill',
        subject: 'Request for Goodwill Adjustment',
        content: 'Dear Credit Department,\n\nI am writing to request a goodwill adjustment...',
        isActive: true,
        usageCount: 28,
        successRate: 65,
        lastUsed: new Date('2024-01-18'),
        variables: ['client_name', 'creditor_name', 'payment_history'],
        postageClass: 'USPS_GROUND_ADVANTAGE'
      },
      {
        id: 'template-004',
        name: 'Follow-up Letter',
        type: 'follow-up',
        subject: 'Follow-up on Previous Correspondence',
        content: 'Dear Sir/Madam,\n\nI am following up on my previous correspondence dated...',
        isActive: true,
        usageCount: 19,
        successRate: 72,
        lastUsed: new Date('2024-01-12'),
        variables: ['client_name', 'previous_date', 'reference_number'],
        postageClass: 'USPS_GROUND_ADVANTAGE'
      },
      {
        id: 'template-005',
        name: 'Identity Verification Request',
        type: 'verification',
        subject: 'Request for Identity Verification',
        content: 'Dear Credit Bureau,\n\nI am requesting verification of my identity...',
        isActive: true,
        usageCount: 15,
        successRate: 92,
        lastUsed: new Date('2024-01-10'),
        variables: ['client_name', 'ssn_last_four', 'date_of_birth'],
        postageClass: 'PRIORITY_MAIL'
      },
      {
        id: 'template-006',
        name: 'Welcome Package',
        type: 'welcome',
        subject: 'Welcome to Rick Jefferson Solutions',
        content: 'Dear [Client Name],\n\nWelcome to our credit repair program...',
        isActive: true,
        usageCount: 156,
        successRate: 95,
        lastUsed: new Date('2024-01-20'),
        variables: ['client_name', 'program_details', 'next_steps'],
        postageClass: 'PRIORITY_MAIL'
      },
      {
        id: 'template-007',
        name: 'Monthly Progress Report',
        type: 'update',
        subject: 'Your Credit Repair Progress Report',
        content: 'Dear [Client Name],\n\nHere is your monthly progress update...',
        isActive: true,
        usageCount: 89,
        successRate: 88,
        lastUsed: new Date('2024-01-18'),
        variables: ['client_name', 'score_change', 'items_removed'],
        postageClass: 'USPS_GROUND_ADVANTAGE'
      },
      {
        id: 'template-008',
        name: 'Payment Reminder',
        type: 'reminder',
        subject: 'Payment Reminder - Credit Repair Services',
        content: 'Dear [Client Name],\n\nThis is a friendly reminder about your upcoming payment...',
        isActive: true,
        usageCount: 67,
        successRate: 82,
        lastUsed: new Date('2024-01-19'),
        variables: ['client_name', 'amount_due', 'due_date'],
        postageClass: 'USPS_GROUND_ADVANTAGE'
      }
    ];
  }
  
  loadRecipients(): void {
    // Demo recipients - replace with actual API call
    this.recipients = [
      {
        id: 'recipient-001',
        name: 'Equifax Information Services',
        address: {
          street: 'P.O. Box 740241',
          city: 'Atlanta',
          state: 'GA',
          zipCode: '30374',
          country: 'US'
        },
        type: 'bureau',
        contactInfo: {
          phone: '1-800-685-1111',
          email: 'disputes@equifax.com'
        },
        status: 'verified',
        preferences: {
          email: true,
          postal: true,
          sms: false
        }
      },
      {
        id: 'recipient-002',
        name: 'Experian',
        address: {
          street: 'P.O. Box 4500',
          city: 'Allen',
          state: 'TX',
          zipCode: '75013',
          country: 'US'
        },
        type: 'bureau',
        contactInfo: {
          phone: '1-888-397-3742',
          email: 'disputes@experian.com'
        },
        status: 'verified',
        preferences: {
          email: true,
          postal: true,
          sms: false
        }
      },
      {
        id: 'recipient-003',
        name: 'TransUnion',
        address: {
          street: 'P.O. Box 2000',
          city: 'Chester',
          state: 'PA',
          zipCode: '19016',
          country: 'US'
        },
        type: 'bureau',
        contactInfo: {
          phone: '1-800-916-8800',
          email: 'disputes@transunion.com'
        },
        status: 'verified',
        preferences: {
          email: true,
          postal: true,
          sms: false
        }
      },
      {
        id: 'recipient-004',
        name: 'Capital One Bank',
        address: {
          street: 'P.O. Box 30285',
          city: 'Salt Lake City',
          state: 'UT',
          zipCode: '84130',
          country: 'US'
        },
        type: 'creditor',
        contactInfo: {
          phone: '1-800-227-4825',
          email: 'customer.service@capitalone.com'
        },
        status: 'active',
        preferences: {
          email: true,
          postal: true,
          sms: false
        }
      },
      {
        id: 'recipient-005',
        name: 'ABC Collections',
        address: {
          street: '123 Collection Ave',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85001',
          country: 'US'
        },
        type: 'collection',
        contactInfo: {
          phone: '1-555-123-4567',
          email: 'validation@abccollections.com'
        },
        status: 'active',
        preferences: {
          email: true,
          postal: true,
          sms: false
        }
      }
    ];
  }
  
  calculateStats(): void {
    const totalSent = this.mailItems.filter(item => ['sent', 'delivered', 'returned'].includes(item.status)).length;
    const totalDelivered = this.mailItems.filter(item => item.status === 'delivered').length;
    const totalReturned = this.mailItems.filter(item => item.status === 'returned').length;
    const pendingMail = this.mailItems.filter(item => ['draft', 'queued', 'sent', 'processing'].includes(item.status)).length;
    
    // Calculate average delivery time
    const deliveredItems = this.mailItems.filter(item => item.status === 'delivered' && item.sentDate && item.deliveredDate);
    let avgDeliveryTime = 0;
    if (deliveredItems.length > 0) {
      const totalDeliveryTime = deliveredItems.reduce((sum, item) => {
        const sentTime = item.sentDate!.getTime();
        const deliveredTime = item.deliveredDate!.getTime();
        return sum + (deliveredTime - sentTime);
      }, 0);
      avgDeliveryTime = totalDeliveryTime / deliveredItems.length / (1000 * 60 * 60 * 24); // Convert to days
    }
    
    this.stats = {
      totalSent,
      totalDelivered,
      totalReturned,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10, // Round to 1 decimal place
      monthlyCost: this.mailItems.reduce((sum, item) => sum + item.cost, 0),
      pendingMail
    };
  }
  
  initializeCharts(): void {
    // Mail Volume Chart
    this.mailVolumeChart = {
      series: [{
        name: 'Mail Sent',
        data: [12, 19, 15, 27, 22, 18, 25, 31, 28, 24, 20, 16]
      }],
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: false }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      colors: ['#007bff']
    };
    
    // Delivery Rate Chart
    this.deliveryRateChart = {
      series: [85, 12, 3],
      chart: {
        type: 'donut',
        height: 300
      },
      labels: ['Delivered', 'In Transit', 'Returned'],
      colors: ['#28a745', '#ffc107', '#dc3545']
    };
    
    // Cost Analysis Chart
    this.costAnalysisChart = {
      series: [{
        name: 'Cost',
        data: [245, 312, 189, 278, 334, 298, 267, 389, 356, 298, 234, 198]
      }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      colors: ['#17a2b8']
    };
  }
  
  filterMail(): void {
    this.filteredMailItems = this.mailItems.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.clientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.templateName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.recipient.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || item.status === this.statusFilter;
      const matchesType = this.typeFilter === 'all' || item.mailType === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }
  
  createNewMail(): void {
    this.newMailItem = {
      status: 'draft',
      mailType: 'certified',
      cost: 8.95,
      attachments: []
    };
    this.showNewMailModal = true;
  }
  
  saveNewMail(): void {
    if (this.newMailItem && this.selectedTemplate && this.selectedRecipient) {
      const mailItem: MailItem = {
        id: 'mail-' + Date.now(),
        clientId: this.newMailItem.clientId || '',
        clientName: this.newMailItem.clientName || '',
        templateId: this.selectedTemplate.id,
        templateName: this.selectedTemplate.name,
        recipient: this.selectedRecipient,
        status: 'draft',
        mailType: this.newMailItem.mailType || 'certified',
        cost: this.newMailItem.cost || 8.95,
        attachments: this.newMailItem.attachments || [],
        notes: this.newMailItem.notes
      };
      
      this.mailItems.unshift(mailItem);
      this.filterMail();
      this.calculateStats();
      this.showNewMailModal = false;
    }
  }
  
  sendMail(mailId: string): void {
    const mailItem = this.mailItems.find(item => item.id === mailId);
    if (mailItem) {
      mailItem.status = 'sent';
      mailItem.sentDate = new Date();
      mailItem.trackingNumber = '9405511206213' + Date.now();
      this.calculateStats();
    }
  }
  
  trackMail(trackingNumber: string): void {
    // Integrate with postal service API for tracking
    console.log('Tracking mail:', trackingNumber);
  }
  
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'draft': 'badge bg-secondary',
      'queued': 'badge bg-info',
      'sent': 'badge bg-warning',
      'delivered': 'badge bg-success',
      'returned': 'badge bg-danger',
      'failed': 'badge bg-dark'
    };
    return statusClasses[status] || 'badge bg-secondary';
  }
  
  getTypeClass(type: string): string {
    const typeClasses: { [key: string]: string } = {
      'certified': 'badge bg-primary',
      'priority': 'badge bg-info',
      'express': 'badge bg-warning',
      'standard': 'badge bg-secondary'
    };
    return typeClasses[type] || 'badge bg-secondary';
  }
  
  exportMailData(): void {
    const data = {
      mailItems: this.mailItems,
      templates: this.mailTemplates,
      recipients: this.recipients,
      stats: this.stats,
      uspsIntegration: {
        connected: this.uspsConnected,
        trackingResults: this.trackingResults
      },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mailing-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateId(): string {
    return 'mail-' + Math.random().toString(36).substr(2, 9);
  }

  toggleMailSelection(mailId: string): void {
    const index = this.selectedMailItems.indexOf(mailId);
    if (index > -1) {
      this.selectedMailItems.splice(index, 1);
    } else {
      this.selectedMailItems.push(mailId);
    }
  }

  selectAllMail(): void {
    if (this.selectedMailItems.length === this.filteredMailItems.length) {
      this.selectedMailItems = [];
    } else {
      this.selectedMailItems = this.filteredMailItems.map(item => item.id);
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'draft': '#6c757d',
      'queued': '#ffc107',
      'sent': '#17a2b8',
      'delivered': '#28a745',
      'failed': '#dc3545',
      'returned': '#fd7e14',
      'processing': '#007bff'
    };
    return colors[status] || '#6c757d';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'low': '#28a745',
      'medium': '#ffc107',
      'high': '#fd7e14',
      'urgent': '#dc3545'
    };
    return colors[priority] || '#6c757d';
  }

  getTrackingStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-success';
      case 'in transit': return 'bg-primary';
      case 'out for delivery': return 'bg-info';
      case 'delayed': return 'bg-warning';
      case 'exception': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  refreshTracking(): void {
    if (this.trackingResults.length > 0) {
      const trackingNumbers = this.trackingResults.map(t => t.trackingNumber);
      this.trackMail(trackingNumbers[0]);
    }
  }

  openBulkModal(): void {
     if (this.selectedMailItems.length > 0) {
       this.showBulkModal = true;
       this.bulkOperationProgress = {
         inProgress: false,
         total: this.selectedMailItems.length,
         completed: 0,
         results: []
       };
     }
   }
  
  bulkSendMail(): void {
    const draftItems = this.mailItems.filter(item => item.status === 'draft');
    draftItems.forEach(item => {
      item.status = 'queued';
    });
    this.calculateStats();
  }
}