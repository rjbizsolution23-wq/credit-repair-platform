import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Menu,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiService = {
  async getDisputes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/disputes?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch disputes');
    return response.json();
  },

  async createDispute(disputeData) {
    const response = await fetch(`${API_BASE_URL}/api/disputes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(disputeData)
    });
    if (!response.ok) throw new Error('Failed to create dispute');
    return response.json();
  },

  async getClients() {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  async generateAILetter(letterData) {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-letter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(letterData)
    });
    if (!response.ok) throw new Error('Failed to generate AI letter');
    return response.json();
  },

  async getDisputeDetails(disputeId) {
    const response = await fetch(`${API_BASE_URL}/api/disputes/${disputeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dispute details');
    return response.json();
  },

  async updateDisputeStatus(disputeId, status) {
    const response = await fetch(`${API_BASE_URL}/api/disputes/${disputeId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update dispute status');
    return response.json();
  }
};

// Create Dispute Dialog Component
function CreateDisputeDialog({ open, onClose, onDisputeCreated }) {
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    bureau: '',
    account_name: '',
    account_number: '',
    dispute_type: '',
    dispute_reason: '',
    description: '',
    desired_outcome: '',
    supporting_documents: [],
    ai_enhanced: true,
    priority: 'medium'
  });

  const disputeTypes = [
    { value: 'factual', label: 'Factual Dispute', description: 'Information is incorrect or inaccurate' },
    { value: 'procedural', label: 'Procedural Dispute', description: 'Violation of FCRA procedures' },
    { value: 'identity_theft', label: 'Identity Theft', description: 'Account opened fraudulently' },
    { value: 'mixed_file', label: 'Mixed File', description: 'Information belongs to someone else' },
    { value: 'obsolete', label: 'Obsolete Information', description: 'Information is too old to report' },
    { value: 'duplicate', label: 'Duplicate Account', description: 'Same account reported multiple times' }
  ];

  const bureaus = [
    { value: 'experian', label: 'Experian' },
    { value: 'equifax', label: 'Equifax' },
    { value: 'transunion', label: 'TransUnion' },
    { value: 'innovis', label: 'Innovis' },
    { value: 'chexsystems', label: 'ChexSystems' },
    { value: 'lexisnexis', label: 'LexisNexis' }
  ];

  const disputeReasons = {
    factual: [
      'Account not mine',
      'Incorrect balance',
      'Incorrect payment history',
      'Incorrect dates',
      'Account closed by consumer',
      'Paid in full'
    ],
    procedural: [
      'No method of verification provided',
      'Reinvestigation not completed within 30 days',
      'Failed to notify furnisher',
      'Failed to provide results in writing',
      'Continued reporting after dispute'
    ],
    identity_theft: [
      'Account opened without authorization',
      'Fraudulent charges',
      'Identity theft victim'
    ],
    mixed_file: [
      'Information belongs to relative',
      'Information belongs to someone with similar name',
      'Wrong SSN associated'
    ],
    obsolete: [
      'Beyond 7-year reporting period',
      'Bankruptcy beyond 10 years',
      'Tax lien beyond 7 years'
    ],
    duplicate: [
      'Same account reported by multiple furnishers',
      'Account reported multiple times with different numbers'
    ]
  };

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      const data = await apiService.getClients();
      setClients(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiService.createDispute(formData);
      onDisputeCreated();
      onClose();
      setStep(0);
      setFormData({
        client_id: '',
        bureau: '',
        account_name: '',
        account_number: '',
        dispute_type: '',
        dispute_reason: '',
        description: '',
        desired_outcome: '',
        supporting_documents: [],
        ai_enhanced: true,
        priority: 'medium'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const steps = [
    'Client & Bureau',
    'Account Details',
    'Dispute Information',
    'Review & Submit'
  ];

  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return formData.client_id && formData.bureau;
      case 1:
        return formData.account_name && formData.account_number;
      case 2:
        return formData.dispute_type && formData.dispute_reason && formData.description;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon color="primary" />
          <Typography variant="h6">Create New Dispute</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={step} orientation="horizontal" sx={{ mb: 3 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step 0: Client & Bureau */}
        {step === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Client</InputLabel>
                <Select
                  value={formData.client_id}
                  onChange={handleChange('client_id')}
                  label="Select Client"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} - {client.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Credit Bureau</InputLabel>
                <Select
                  value={formData.bureau}
                  onChange={handleChange('bureau')}
                  label="Credit Bureau"
                >
                  {bureaus.map((bureau) => (
                    <MenuItem key={bureau.value} value={bureau.value}>
                      {bureau.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {/* Step 1: Account Details */}
        {step === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name/Creditor"
                value={formData.account_name}
                onChange={handleChange('account_name')}
                required
                placeholder="e.g., Capital One, Chase, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Number"
                value={formData.account_number}
                onChange={handleChange('account_number')}
                required
                placeholder="Last 4 digits or partial account number"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority Level</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  label="Priority Level"
                >
                  <MenuItem value="low">Low - Standard processing</MenuItem>
                  <MenuItem value="medium">Medium - Normal priority</MenuItem>
                  <MenuItem value="high">High - Urgent processing</MenuItem>
                  <MenuItem value="critical">Critical - Immediate attention</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {/* Step 2: Dispute Information */}
        {step === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dispute Type
              </Typography>
              <RadioGroup
                value={formData.dispute_type}
                onChange={handleChange('dispute_type')}
              >
                {disputeTypes.map((type) => (
                  <FormControlLabel
                    key={type.value}
                    value={type.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle2">{type.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {type.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </Grid>
            
            {formData.dispute_type && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Specific Reason</InputLabel>
                  <Select
                    value={formData.dispute_reason}
                    onChange={handleChange('dispute_reason')}
                    label="Specific Reason"
                  >
                    {disputeReasons[formData.dispute_type]?.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {reason}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Detailed Description"
                value={formData.description}
                onChange={handleChange('description')}
                required
                multiline
                rows={4}
                placeholder="Provide specific details about why this item should be removed or corrected..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Desired Outcome"
                value={formData.desired_outcome}
                onChange={handleChange('desired_outcome')}
                placeholder="e.g., Remove account entirely, Correct payment history, Update balance, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.ai_enhanced}
                    onChange={handleChange('ai_enhanced')}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon color="primary" fontSize="small" />
                    <Typography>Enable AI-Enhanced Letter Generation</Typography>
                  </Box>
                }
              />
              <Typography variant="caption" color="textSecondary" display="block">
                AI will generate a legally optimized dispute letter with relevant citations and enhanced language
              </Typography>
            </Grid>
          </Grid>
        )}
        
        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Dispute Details
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Client</Typography>
                    <Typography variant="body1">
                      {clients.find(c => c.id === formData.client_id)?.first_name} {clients.find(c => c.id === formData.client_id)?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Bureau</Typography>
                    <Typography variant="body1">
                      {bureaus.find(b => b.value === formData.bureau)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Account</Typography>
                    <Typography variant="body1">
                      {formData.account_name} - {formData.account_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
                    <Chip 
                      label={formData.priority.toUpperCase()} 
                      color={formData.priority === 'critical' ? 'error' : formData.priority === 'high' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Dispute Type</Typography>
                    <Typography variant="body1">
                      {disputeTypes.find(t => t.value === formData.dispute_type)?.label} - {formData.dispute_reason}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                    <Typography variant="body2">
                      {formData.description}
                    </Typography>
                  </Grid>
                  {formData.desired_outcome && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Desired Outcome</Typography>
                      <Typography variant="body2">
                        {formData.desired_outcome}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
            
            {formData.ai_enhanced && (
              <Alert severity="info" icon={<AutoAwesomeIcon />}>
                <Typography variant="subtitle2">AI Enhancement Enabled</Typography>
                <Typography variant="body2">
                  An AI-powered dispute letter will be automatically generated with legal citations and optimized language for maximum effectiveness.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {step > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={!isStepValid(step)}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading || !isStepValid(step)}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading ? 'Creating...' : 'Create Dispute'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Dispute Details Dialog Component
function DisputeDetailsDialog({ open, onClose, disputeId }) {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open && disputeId) {
      fetchDisputeDetails();
    }
  }, [open, disputeId]);

  const fetchDisputeDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getDisputeDetails(disputeId);
      setDispute(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ScheduleIcon />;
      case 'in_progress': return <PlayArrowIcon />;
      case 'resolved': return <CheckCircleIcon />;
      case 'rejected': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Dispute Details
          </Typography>
          {dispute && (
            <Chip
              icon={getStatusIcon(dispute.status)}
              label={dispute.status.toUpperCase()}
              color={getStatusColor(dispute.status)}
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {dispute && (
          <Box>
            {/* Dispute Info Header */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      {dispute.account_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Account: {dispute.account_number}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Bureau: {dispute.bureau.toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                      <Box>
                        <Typography variant="h6" color="primary">
                          {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Dispute Type
                        </Typography>
                      </Box>
                      <Box>
                        <Chip
                          label={dispute.priority.toUpperCase()}
                          color={dispute.priority === 'critical' ? 'error' : dispute.priority === 'high' ? 'warning' : 'default'}
                        />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Priority
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Details" />
                <Tab label="Timeline" />
                <Tab label="Documents" />
                <Tab label="AI Analysis" />
              </Tabs>
            </Box>
            
            {/* Tab Content */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Dispute Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Reason</Typography>
                    <Typography variant="body1">{dispute.dispute_reason}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                    <Typography variant="body2">{dispute.description}</Typography>
                  </Box>
                  {dispute.desired_outcome && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">Desired Outcome</Typography>
                      <Typography variant="body2">{dispute.desired_outcome}</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Client Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                    <Typography variant="body1">
                      {dispute.client?.first_name} {dispute.client?.last_name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                    <Typography variant="body1">{dispute.client?.email}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                    <Typography variant="body1">
                      {format(new Date(dispute.created_at), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Box>
                  {dispute.ai_enhanced && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <AutoAwesomeIcon color="primary" />
                      <Typography variant="body2" color="primary">
                        AI-Enhanced Dispute
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
            
            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Dispute Timeline
                </Typography>
                <Alert severity="info">
                  Timeline tracking feature coming soon. This will show all actions taken on this dispute.
                </Alert>
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Supporting Documents
                </Typography>
                <Alert severity="info">
                  Document management feature coming soon. This will allow uploading and managing supporting documents.
                </Alert>
              </Box>
            )}
            
            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  AI Analysis & Predictions
                </Typography>
                {dispute.ai_enhanced ? (
                  <Box>
                    <Alert severity="success" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
                      This dispute has been enhanced with AI-powered legal analysis and optimized dispute language.
                    </Alert>
                    <Typography variant="body2" color="textSecondary">
                      AI analysis includes legal citation recommendations, success probability assessment, and optimized dispute strategies based on similar cases.
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">
                    AI enhancement was not enabled for this dispute. Future disputes can benefit from AI-powered legal analysis and optimization.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {dispute && (
          <Button variant="contained" startIcon={<EmailIcon />}>
            Generate Letter
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Main Dispute Management Component
function DisputeManagement() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bureauFilter, setBureauFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDisputes();
      setDisputes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleCreateDispute = () => {
    setCreateDialogOpen(true);
  };

  const handleViewDispute = (disputeId) => {
    setSelectedDisputeId(disputeId);
    setDetailsDialogOpen(true);
  };

  const handleMenuOpen = (event, dispute) => {
    setAnchorEl(event.currentTarget);
    setSelectedDispute(dispute);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDispute(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.dispute_reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    const matchesBureau = bureauFilter === 'all' || dispute.bureau === bureauFilter;
    
    return matchesSearch && matchesStatus && matchesBureau;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dispute Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Create and track credit bureau disputes with AI-powered optimization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateDispute}
          size="large"
        >
          Create Dispute
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button onClick={fetchDisputes} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Bureau</InputLabel>
                <Select
                  value={bureauFilter}
                  onChange={(e) => setBureauFilter(e.target.value)}
                  label="Bureau"
                >
                  <MenuItem value="all">All Bureaus</MenuItem>
                  <MenuItem value="experian">Experian</MenuItem>
                  <MenuItem value="equifax">Equifax</MenuItem>
                  <MenuItem value="transunion">TransUnion</MenuItem>
                  <MenuItem value="innovis">Innovis</MenuItem>
                  <MenuItem value="chexsystems">ChexSystems</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDisputes}
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                color="primary"
              >
                AI Insights
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Bureau</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>AI Enhanced</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDisputes.map((dispute) => (
                <TableRow key={dispute.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {dispute.account_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dispute.account_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dispute.bureau.toUpperCase()}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {dispute.dispute_reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dispute.status.toUpperCase()}
                      color={getStatusColor(dispute.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dispute.priority.toUpperCase()}
                      color={getPriorityColor(dispute.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(dispute.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {dispute.ai_enhanced ? (
                      <Tooltip title="AI-Enhanced Dispute">
                        <AutoAwesomeIcon color="primary" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Standard
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleViewDispute(dispute.id)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton onClick={(e) => handleMenuOpen(e, dispute)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredDisputes.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <GavelIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No disputes found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {searchTerm || statusFilter !== 'all' || bureauFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first dispute'
              }
            </Typography>
            {!searchTerm && statusFilter === 'all' && bureauFilter === 'all' && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateDispute}>
                Create First Dispute
              </Button>
            )}
          </Box>
        )}
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleViewDispute(selectedDispute?.id); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} /> Edit Dispute
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EmailIcon sx={{ mr: 1 }} /> Generate Letter
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <AttachFileIcon sx={{ mr: 1 }} /> Add Documents
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete Dispute
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <CreateDisputeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onDisputeCreated={fetchDisputes}
      />
      
      <DisputeDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        disputeId={selectedDisputeId}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create dispute"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateDispute}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default DisputeManagement;