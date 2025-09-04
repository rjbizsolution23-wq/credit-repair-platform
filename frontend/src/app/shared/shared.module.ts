import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../core/feather-icon/feather-icon.directive';

// Components
import { DataTableComponent } from './components/data-table/data-table.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { FilterPanelComponent } from './components/filter-panel/filter-panel.component';
import { BulkActionsComponent } from './components/bulk-actions/bulk-actions.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { SearchBoxComponent } from './components/search-box/search-box.component';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { ChartWrapperComponent } from './components/chart-wrapper/chart-wrapper.component';
import { FormFieldComponent } from './components/form-field/form-field.component';
import { ActionButtonsComponent } from './components/action-buttons/action-buttons.component';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { AccordionComponent } from './components/accordion/accordion.component';

// Pipes
import { TruncatePipe } from './pipes/truncate.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { FormatCurrencyPipe } from './pipes/format-currency.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { HighlightPipe } from './pipes/highlight.pipe';
import { PhoneFormatPipe } from './pipes/phone-format.pipe';
import { CreditScoreColorPipe } from './pipes/credit-score-color.pipe';
import { TitleCasePipe } from './pipes/shared.pipes';

// Directives
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { AutofocusDirective } from './directives/autofocus.directive';
import { TooltipDirective } from './directives/tooltip.directive';
import { PermissionDirective } from './directives/permission.directive';

const COMPONENTS = [
  DataTableComponent,
  ConfirmModalComponent,
  LoadingSpinnerComponent,
  PageHeaderComponent,
  StatsCardComponent,
  FilterPanelComponent,
  BulkActionsComponent,
  StatusBadgeComponent,
  ProgressBarComponent,
  EmptyStateComponent,
  SearchBoxComponent,
  DateRangePickerComponent,
  FileUploadComponent,
  ChartWrapperComponent,
  FormFieldComponent,
  ActionButtonsComponent,
  NotificationToastComponent,
  PaginationComponent,
  TabsComponent,
  AccordionComponent
];

const PIPES = [
  TruncatePipe,
  SafeHtmlPipe,
  FormatCurrencyPipe,
  TimeAgoPipe,
  HighlightPipe,
  PhoneFormatPipe,
  CreditScoreColorPipe,
  TitleCasePipe
];

const DIRECTIVES = [
  ClickOutsideDirective,
  AutofocusDirective,
  TooltipDirective,
  PermissionDirective
];

@NgModule({
  declarations: [
    ...COMPONENTS,
    ...PIPES,
    ...DIRECTIVES
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    FeatherIconDirective
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    FeatherIconDirective,
    ...COMPONENTS,
    ...PIPES,
    ...DIRECTIVES
  ]
})
export class SharedModule { }

// Export all components, pipes, and directives for external use
export * from './components/data-table/data-table.component';
export * from './components/confirm-modal/confirm-modal.component';
export * from './components/loading-spinner/loading-spinner.component';
export * from './components/page-header/page-header.component';
export * from './components/stats-card/stats-card.component';
export * from './components/filter-panel/filter-panel.component';
export * from './components/bulk-actions/bulk-actions.component';
export * from './components/status-badge/status-badge.component';
export * from './components/progress-bar/progress-bar.component';
export * from './components/empty-state/empty-state.component';
export * from './components/search-box/search-box.component';
export * from './components/date-range-picker/date-range-picker.component';
export * from './components/file-upload/file-upload.component';
export * from './components/chart-wrapper/chart-wrapper.component';
export * from './components/form-field/form-field.component';
export * from './components/action-buttons/action-buttons.component';
export * from './components/notification-toast/notification-toast.component';
export * from './components/pagination/pagination.component';
export * from './components/tabs/tabs.component';
export * from './components/accordion/accordion.component';

export * from './pipes/truncate.pipe';
export * from './pipes/safe-html.pipe';
export * from './pipes/format-currency.pipe';
export * from './pipes/time-ago.pipe';
export * from './pipes/highlight.pipe';
export * from './pipes/phone-format.pipe';
export * from './pipes/credit-score-color.pipe';
export * from './pipes/shared.pipes';

export * from './directives/click-outside.directive';
export * from './directives/autofocus.directive';
export * from './directives/tooltip.directive';
export * from './directives/permission.directive';

export * from './models/shared.models';
export * from './services/shared.services';
export * from './utils/shared.utils';