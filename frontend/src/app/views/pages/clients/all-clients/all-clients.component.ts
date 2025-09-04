import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-all-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbModule, FeatherIconDirective],
  templateUrl: './all-clients.component.html',
  styleUrls: ['./all-clients.component.scss']
})
export class AllClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus = '';
  selectedStage = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'completed', label: 'Completed' }
  ];

  stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'initial_review', label: 'Initial Review' },
    { value: 'dispute_phase', label: 'Dispute Phase' },
    { value: 'verification', label: 'Verification' },
    { value: 'legal_action', label: 'Legal Action' },
    { value: 'completed', label: 'Completed' }
  ];

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.clientService.getAllClients().subscribe({
      next: (response) => {
        this.clients = response.data || [];
        this.totalItems = response.total || this.clients.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.clients];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.firstName?.toLowerCase().includes(term) ||
        client.lastName?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(client => client.status === this.selectedStatus);
    }

    // Stage filter
    if (this.selectedStage) {
      filtered = filtered.filter(client => client.currentStage === this.selectedStage);
    }

    this.filteredClients = filtered;
    this.totalItems = filtered.length;
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStageChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  getPaginatedClients(): Client[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredClients.slice(startIndex, endIndex);
  }

  deleteClient(clientId: string): void {
    if (confirm('Are you sure you want to delete this client?')) {
      this.clientService.deleteClient(clientId).subscribe({
        next: () => {
          this.loadClients();
        },
        error: (error) => {
          console.error('Error deleting client:', error);
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-secondary';
      case 'suspended': return 'badge-warning';
      case 'completed': return 'badge-info';
      default: return 'badge-light';
    }
  }

  getStageBadgeClass(stage: string): string {
    switch (stage) {
      case 'initial_review': return 'badge-primary';
      case 'dispute_phase': return 'badge-warning';
      case 'verification': return 'badge-info';
      case 'legal_action': return 'badge-danger';
      case 'completed': return 'badge-success';
      default: return 'badge-light';
    }
  }

  exportClients(): void {
    this.clientService.exportClients().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting clients:', error);
      }
    });
  }
}