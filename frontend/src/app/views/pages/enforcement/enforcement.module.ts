import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'angular-feather/icons';

// Routes
import { enforcementRoutes } from './enforcement.routes';

// Services
import { EnforcementService } from './enforcement.service';

// Components
import { EnforcementOverviewComponent } from './enforcement-overview/enforcement-overview.component';
import { ViolationsComponent } from './violations/violations.component';

// Select specific icons
const icons = {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Info
};

@NgModule({
  declarations: [
    EnforcementOverviewComponent,
    ViolationsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(enforcementRoutes),
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    FeatherModule.pick(icons)
  ],
  providers: [
    EnforcementService
  ]
})
export class EnforcementModule { }