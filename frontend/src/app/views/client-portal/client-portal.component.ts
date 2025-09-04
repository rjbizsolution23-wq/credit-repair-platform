import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  lastLogin: Date;
  creditScore: {
    current: number;
    previous: number;
    change: number;
  };
  disputes: {
    total: number;
    pending: number;
    resolved: number;
  };
  subscription: {
    plan: string;
    status: 'active' | 'cancelled' | 'suspended';
    nextBilling: Date;
    amount: number;
  };
  avatar?: string;
}

interface Message {
  id: string;
  clientId: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  type: 'inquiry' | 'complaint' | 'update' | 'dispute';
}

interface Document {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  category: 'identity' | 'income' | 'dispute' | 'legal' | 'other';
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-client-portal',
  templateUrl: './client-portal.component.html',
  styleUrls: ['./client-portal.component.scss']
})
export class ClientPortalComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedClient: Client | null = null;
  messages: Message[] = [];
  documents: Document[] = [];
  
  // Filters and search
  searchTerm: string = '';
  statusFilter: string = 'all';
  planFilter: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Loading states
  isLoading: boolean = false;
  isLoadingMessages: boolean = false;
  isLoadingDocuments: boolean = false;
  
  // Statistics
  stats = {
    totalClients: 0,
    activeClients: 0,
    pendingDisputes: 0,
    avgScoreImprovement: 0,
    monthlyRevenue: 0,
    unreadMessages: 0
  };
  
  // Chart data for client analytics
  clientGrowthChart = {
    series: [{
      name: 'New Clients',
      data: [12, 19, 15, 27, 22, 35, 28, 31, 25, 42, 38, 45]
    }],
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    colors: ['#6571ff']
  };
  
  scoreImprovementChart = {
    series: [{
      name: 'Score Improvement',
      data: [45, 52, 38, 65, 59, 72, 68, 81, 75, 89, 85, 92]
    }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    colors: ['#28a745']
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadMessages();
    this.loadDocuments();
    this.calculateStats();
  }

  loadClients(): void {
    this.isLoading = true;
    
    // Simulate API call with demo data
    setTimeout(() => {
      this.clients = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          status: 'active',
          joinDate: new Date('2024-01-15'),
          lastLogin: new Date('2024-12-20'),
          creditScore: { current: 720, previous: 650, change: 70 },
          disputes: { total: 8, pending: 2, resolved: 6 },
          subscription: {
            plan: 'Premium',
            status: 'active',
            nextBilling: new Date('2025-01-15'),
            amount: 99.99
          }
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 234-5678',
          status: 'active',
          joinDate: new Date('2024-02-20'),
          lastLogin: new Date('2024-12-19'),
          creditScore: { current: 680, previous: 590, change: 90 },
          disputes: { total: 12, pending: 4, resolved: 8 },
          subscription: {
            plan: 'Standard',
            status: 'active',
            nextBilling: new Date('2025-02-20'),
            amount: 69.99
          }
        },
        {
          id: '3',
          firstName: 'Michael',
          lastName: 'Davis',
          email: 'michael.davis@email.com',
          phone: '(555) 345-6789',
          status: 'pending',
          joinDate: new Date('2024-12-18'),
          lastLogin: new Date('2024-12-18'),
          creditScore: { current: 580, previous: 580, change: 0 },
          disputes: { total: 0, pending: 0, resolved: 0 },
          subscription: {
            plan: 'Basic',
            status: 'active',
            nextBilling: new Date('2025-01-18'),
            amount: 39.99
          }
        },
        {
          id: '4',
          firstName: 'Emily',
          lastName: 'Wilson',
          email: 'emily.wilson@email.com',
          phone: '(555) 456-7890',
          status: 'active',
          joinDate: new Date('2024-03-10'),
          lastLogin: new Date('2024-12-21'),
          creditScore: { current: 750, previous: 620, change: 130 },
          disputes: { total: 15, pending: 1, resolved: 14 },
          subscription: {
            plan: 'Premium',
            status: 'active',
            nextBilling: new Date('2025-03-10'),
            amount: 99.99
          }
        }
      ];
      
      this.filteredClients = [...this.clients];
      this.calculatePagination();
      this.isLoading = false;
    }, 1000);
  }

  loadMessages(): void {
    this.isLoadingMessages = true;
    
    setTimeout(() => {
      this.messages = [
        {
          id: '1',
          clientId: '1',
          subject: 'Question about dispute process',
          content: 'Hi, I wanted to ask about the timeline for my recent dispute submission...',
          timestamp: new Date('2024-12-21T10:30:00'),
          isRead: false,
          priority: 'medium',
          type: 'inquiry'
        },
        {
          id: '2',
          clientId: '2',
          subject: 'Credit score update',
          content: 'I noticed my score increased by 25 points this month. Thank you for your help!',
          timestamp: new Date('2024-12-20T15:45:00'),
          isRead: true,
          priority: 'low',
          type: 'update'
        },
        {
          id: '3',
          clientId: '4',
          subject: 'Urgent: Incorrect information on report',
          content: 'I found an error on my credit report that needs immediate attention...',
          timestamp: new Date('2024-12-21T09:15:00'),
          isRead: false,
          priority: 'high',
          type: 'dispute'
        }
      ];
      
      this.isLoadingMessages = false;
    }, 500);
  }

  loadDocuments(): void {
    this.isLoadingDocuments = true;
    
    setTimeout(() => {
      this.documents = [
        {
          id: '1',
          clientId: '1',
          name: 'Driver_License.pdf',
          type: 'application/pdf',
          size: 2048576,
          uploadDate: new Date('2024-12-20'),
          category: 'identity',
          status: 'approved'
        },
        {
          id: '2',
          clientId: '2',
          name: 'Pay_Stub_November.pdf',
          type: 'application/pdf',
          size: 1024768,
          uploadDate: new Date('2024-12-19'),
          category: 'income',
          status: 'pending'
        },
        {
          id: '3',
          clientId: '4',
          name: 'Dispute_Letter_Template.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 512384,
          uploadDate: new Date('2024-12-21'),
          category: 'dispute',
          status: 'approved'
        }
      ];
      
      this.isLoadingDocuments = false;
    }, 500);
  }

  calculateStats(): void {
    this.stats = {
      totalClients: this.clients.length,
      activeClients: this.clients.filter(c => c.status === 'active').length,
      pendingDisputes: this.clients.reduce((sum, c) => sum + c.disputes.pending, 0),
      avgScoreImprovement: Math.round(this.clients.reduce((sum, c) => sum + c.creditScore.change, 0) / this.clients.length),
      monthlyRevenue: this.clients.reduce((sum, c) => sum + c.subscription.amount, 0),
      unreadMessages: this.messages.filter(m => !m.isRead).length
    };
  }

  filterClients(): void {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm || 
        client.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || client.status === this.statusFilter;
      const matchesPlan = this.planFilter === 'all' || client.subscription.plan === this.planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
    
    this.calculatePagination();
    this.currentPage = 1;
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
  }

  getPaginatedClients(): Client[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredClients.slice(startIndex, endIndex);
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'badge bg-success';
      case 'inactive': return 'badge bg-secondary';
      case 'pending': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'badge bg-danger';
      case 'medium': return 'badge bg-warning';
      case 'low': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  getScoreChangeClass(change: number): string {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-danger';
    return 'text-muted';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  sendMessage(clientId: string): void {
    // Navigate to messaging component or open modal
    console.log('Send message to client:', clientId);
  }

  viewClientDetails(client: Client): void {
    this.router.navigate(['/client-details', client.id]);
  }

  createDispute(client: Client): void {
    this.router.navigate(['/disputes/create'], { queryParams: { clientId: client.id } });
  }

  exportClientData(): void {
    console.log('Exporting client data...');
    // Implement export functionality
  }

  refreshData(): void {
    this.loadClients();
    this.loadMessages();
    this.loadDocuments();
    this.calculateStats();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}