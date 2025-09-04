/**
 * Rick Jefferson Solutions - Admin Panel Component
 * CRO Management Dashboard with Client Oversight and Compliance Tracking
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { DisputesService } from '../pages/disputes/disputes.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  // Dashboard Statistics
  dashboardStats = {
    totalClients: 0,
    activeDisputes: 0,
    completedDisputes: 0,
    complianceScore: 0,
    monthlyRevenue: 0,
    averageScoreIncrease: 0,
    crosActive: 0,
    templatesAvailable: 0
  };

  // Client Management
  clients = [];
  filteredClients = [];
  clientSearchTerm = '';
  clientFilters = {
    status: 'all',
    cro: 'all',
    riskLevel: 'all'
  };

  // CRO Management
  cros = [];
  croPerformance = [];

  // Letter Templates
  letterTemplates = [];
  templateCategories = [];

  // Compliance Tracking
  complianceAlerts = [];
  auditTrail = [];

  // UI State
  activeTab = 'dashboard';
  loading = false;
  selectedClient = null;
  selectedCro = null;
  showClientModal = false;
  showCroModal = false;
  showTemplateModal = false;

  // Charts Data
  revenueChartData = [];
  disputeChartData = [];
  complianceChartData = [];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private disputesService: DisputesService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
    await this.loadClients();
    await this.loadCros();
    await this.loadLetterTemplates();
    await this.loadComplianceData();
  }

  /**
   * Load dashboard statistics
   */
  async loadDashboardData() {
    try {
      this.loading = true;
      const stats = await this.adminService.getDashboardStats();
      this.dashboardStats = {
        totalClients: stats.totalClients || 0,
        activeDisputes: stats.activeDisputes || 0,
        completedDisputes: stats.completedDisputes || 0,
        complianceScore: stats.complianceScore || 95,
        monthlyRevenue: stats.monthlyRevenue || 0,
        averageScoreIncrease: stats.averageScoreIncrease || 0,
        crosActive: stats.crosActive || 0,
        templatesAvailable: stats.templatesAvailable || 50
      };

      // Load chart data
      this.revenueChartData = stats.revenueChart || [];
      this.disputeChartData = stats.disputeChart || [];
      this.complianceChartData = stats.complianceChart || [];
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load all clients with filtering
   */
  async loadClients() {
    try {
      const response = await this.adminService.getAllClients({
        search: this.clientSearchTerm,
        status: this.clientFilters.status,
        cro: this.clientFilters.cro,
        riskLevel: this.clientFilters.riskLevel
      });
      this.clients = response.clients || [];
      this.filteredClients = this.clients;
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  /**
   * Load CRO data and performance metrics
   */
  async loadCros() {
    try {
      const response = await this.adminService.getAllCros();
      this.cros = response.cros || [];
      this.croPerformance = response.performance || [];
    } catch (error) {
      console.error('Error loading CROs:', error);
    }
  }

  /**
   * Load letter templates
   */
  async loadLetterTemplates() {
    try {
      const response = await this.disputesService.getLetterTemplates();
      this.letterTemplates = response.templates || [];
      this.templateCategories = response.categories || [];
    } catch (error) {
      console.error('Error loading letter templates:', error);
    }
  }

  /**
   * Load compliance data and alerts
   */
  async loadComplianceData() {
    try {
      const response = await this.adminService.getComplianceData();
      this.complianceAlerts = response.alerts || [];
      this.auditTrail = response.auditTrail || [];
    } catch (error) {
      console.error('Error loading compliance data:', error);
    }
  }

  /**
   * Filter clients based on search and filters
   */
  filterClients() {
    let filtered = this.clients;

    // Search filter
    if (this.clientSearchTerm) {
      filtered = filtered.filter(client => 
        client.firstName.toLowerCase().includes(this.clientSearchTerm.toLowerCase()) ||
        client.lastName.toLowerCase().includes(this.clientSearchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.clientSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (this.clientFilters.status !== 'all') {
      filtered = filtered.filter(client => client.status === this.clientFilters.status);
    }

    // CRO filter
    if (this.clientFilters.cro !== 'all') {
      filtered = filtered.filter(client => client.assignedCro === this.clientFilters.cro);
    }

    // Risk level filter
    if (this.clientFilters.riskLevel !== 'all') {
      filtered = filtered.filter(client => client.riskLevel === this.clientFilters.riskLevel);
    }

    this.filteredClients = filtered;
  }

  /**
   * View client details
   */
  viewClient(client: any) {
    this.selectedClient = client;
    this.router.navigate(['/admin/client', client.id]);
  }

  /**
   * Edit client information
   */
  editClient(client: any) {
    this.selectedClient = { ...client };
    this.showClientModal = true;
  }

  /**
   * Create new client
   */
  createClient() {
    this.selectedClient = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'active',
      assignedCro: '',
      riskLevel: 'low'
    };
    this.showClientModal = true;
  }

  /**
   * Save client changes
   */
  async saveClient() {
    try {
      if (this.selectedClient.id) {
        await this.adminService.updateClient(this.selectedClient.id, this.selectedClient);
      } else {
        await this.adminService.createClient(this.selectedClient);
      }
      this.showClientModal = false;
      await this.loadClients();
      await this.loadDashboardData();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  }

  /**
   * Delete client
   */
  async deleteClient(clientId: string) {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await this.adminService.deleteClient(clientId);
        await this.loadClients();
        await this.loadDashboardData();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  }

  /**
   * View CRO details
   */
  viewCro(cro: any) {
    this.selectedCro = cro;
    this.router.navigate(['/admin/cro', cro.id]);
  }

  /**
   * Edit CRO information
   */
  editCro(cro: any) {
    this.selectedCro = { ...cro };
    this.showCroModal = true;
  }

  /**
   * Create new CRO
   */
  createCro() {
    this.selectedCro = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'active',
      permissions: [],
      certifications: []
    };
    this.showCroModal = true;
  }

  /**
   * Save CRO changes
   */
  async saveCro() {
    try {
      if (this.selectedCro.id) {
        await this.adminService.updateCro(this.selectedCro.id, this.selectedCro);
      } else {
        await this.adminService.createCro(this.selectedCro);
      }
      this.showCroModal = false;
      await this.loadCros();
    } catch (error) {
      console.error('Error saving CRO:', error);
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport() {
    try {
      const report = await this.adminService.generateComplianceReport();
      // Download or display report
      this.downloadReport(report, 'compliance-report.pdf');
    } catch (error) {
      console.error('Error generating compliance report:', error);
    }
  }

  /**
   * Export client data
   */
  async exportClientData() {
    try {
      const data = await this.adminService.exportClientData();
      this.downloadReport(data, 'client-data.csv');
    } catch (error) {
      console.error('Error exporting client data:', error);
    }
  }

  /**
   * Download report file
   */
  downloadReport(data: any, filename: string) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Switch active tab
   */
  switchTab(tab: string) {
    this.activeTab = tab;
  }

  /**
   * Close modals
   */
  closeModal() {
    this.showClientModal = false;
    this.showCroModal = false;
    this.showTemplateModal = false;
    this.selectedClient = null;
    this.selectedCro = null;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'active': 'badge-success',
      'inactive': 'badge-secondary',
      'suspended': 'badge-warning',
      'terminated': 'badge-danger',
      'pending': 'badge-info'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  /**
   * Get risk level badge class
   */
  getRiskBadgeClass(riskLevel: string): string {
    const riskClasses = {
      'low': 'badge-success',
      'medium': 'badge-warning',
      'high': 'badge-danger'
    };
    return riskClasses[riskLevel] || 'badge-secondary';
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}