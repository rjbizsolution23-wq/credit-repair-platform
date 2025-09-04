import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { TableColumn, TableConfig, SortDirection, TableAction } from '../../models/shared.models';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() config: TableConfig = {
    sortable: true,
    filterable: true,
    paginated: true,
    selectable: false,
    searchable: true,
    exportable: false,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100]
  };
  @Input() loading: boolean = false;
  @Input() actions: TableAction[] = [];
  @Input() bulkActions: TableAction[] = [];
  @Input() emptyMessage: string = 'No data available';
  @Input() searchPlaceholder: string = 'Search...';

  @Output() sortChange = new EventEmitter<{ column: string; direction: SortDirection }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();
  @Output() bulkActionClick = new EventEmitter<{ action: string; rows: any[] }>();
  @Output() exportData = new EventEmitter<{ format: string; data: any[] }>();

  // Internal state
  filteredData: any[] = [];
  paginatedData: any[] = [];
  selectedRows: any[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: SortDirection = 'asc';
  selectAll: boolean = false;

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['config']) {
      this.processData();
    }
  }

  private processData(): void {
    this.filteredData = this.filterData(this.data);
    this.sortData();
    this.paginateData();
    this.updateSelectAll();
  }

  private filterData(data: any[]): any[] {
    if (!this.searchTerm || !this.config.searchable) {
      return data;
    }

    const searchLower = this.searchTerm.toLowerCase();
    return data.filter(row => {
      return this.columns.some(column => {
        const value = this.getCellValue(row, column.key);
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });
  }

  private sortData(): void {
    if (!this.sortColumn || !this.config.sortable) {
      return;
    }

    this.filteredData.sort((a, b) => {
      const aValue = this.getCellValue(a, this.sortColumn);
      const bValue = this.getCellValue(b, this.sortColumn);

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      return this.sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  }

  private paginateData(): void {
    if (!this.config.paginated) {
      this.paginatedData = this.filteredData;
      return;
    }

    const pageSize = this.config.pageSize || 10;
    this.totalPages = Math.ceil(this.filteredData.length / pageSize);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    const startIndex = (this.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], row);
  }

  onSort(column: TableColumn): void {
    if (!column.sortable || !this.config.sortable) {
      return;
    }

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
    this.processData();
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.currentPage = 1;
    this.searchChange.emit(this.searchTerm);
    this.processData();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
      this.paginateData();
    }
  }

  onPageSizeChange(event: any): void {
    const newPageSize = parseInt(event.target.value);
    if (this.config.pageSize !== newPageSize) {
      this.config.pageSize = newPageSize;
      this.currentPage = 1;
      this.pageSizeChange.emit(newPageSize);
      this.processData();
    }
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onRowSelect(row: any, event: any): void {
    if (!this.config.selectable) return;

    if (event.target.checked) {
      this.selectedRows.push(row);
    } else {
      const index = this.selectedRows.findIndex(r => r === row);
      if (index > -1) {
        this.selectedRows.splice(index, 1);
      }
    }

    this.updateSelectAll();
    this.rowSelect.emit(this.selectedRows);
  }

  onSelectAll(event: any): void {
    if (!this.config.selectable) return;

    if (event.target.checked) {
      this.selectedRows = [...this.paginatedData];
    } else {
      this.selectedRows = [];
    }

    this.selectAll = event.target.checked;
    this.rowSelect.emit(this.selectedRows);
  }

  private updateSelectAll(): void {
    if (!this.config.selectable || this.paginatedData.length === 0) {
      this.selectAll = false;
      return;
    }

    this.selectAll = this.paginatedData.every(row => 
      this.selectedRows.some(selected => selected === row)
    );
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.some(selected => selected === row);
  }

  onActionClick(action: TableAction, row: any): void {
    this.actionClick.emit({ action: action.key, row });
  }

  onBulkActionClick(action: TableAction): void {
    if (this.selectedRows.length === 0) {
      return;
    }
    this.bulkActionClick.emit({ action: action.key, rows: this.selectedRows });
  }

  onExport(format: string): void {
    this.exportData.emit({ format, data: this.filteredData });
  }

  getSortIcon(column: TableColumn): string {
    if (!column.sortable || this.sortColumn !== column.key) {
      return 'sort';
    }
    return this.sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getDisplayRange(): string {
    if (this.filteredData.length === 0) {
      return '0 of 0';
    }

    const pageSize = this.config.pageSize || 10;
    const start = (this.currentPage - 1) * pageSize + 1;
    const end = Math.min(this.currentPage * pageSize, this.filteredData.length);
    
    return `${start}-${end} of ${this.filteredData.length}`;
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}