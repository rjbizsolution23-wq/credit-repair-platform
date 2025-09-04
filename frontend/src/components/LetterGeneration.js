import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  Tabs,
  Tab,
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
  StepContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Avatar
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
  BookmarkBorder as BookmarkIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiService = {
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

  async getLetterTemplates() {
    const response = await fetch(`${API_BASE_URL}/api/letter-templates`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch letter templates');
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

  async getGeneratedLetters(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/generated-letters?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch generated letters');
    return response.json();
  },

  async saveLetter(letterData) {
    const response = await fetch(`${API_BASE_URL}/api/generated-letters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(letterData)
    });
    if (!response.ok) throw new Error('Failed to save letter');
    return response.json();
  },

  async getSecondaryBureaus() {
    const response = await fetch(`${API_BASE_URL}/api/secondary-bureaus`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch secondary bureaus');
    return response.json();
  }
};

// Letter Preview Dialog Component
function LetterPreviewDialog({ open, onClose, letterContent, letterType, clientName }) {
  const [showLegalCitations, setShowLegalCitations] = useState(true);

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([letterContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${letterType}_${clientName}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    // You could add a snackbar notification here
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${letterType} - ${clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${letterType.replace('_', ' ').toUpperCase()}</h2>
            <p>Generated for: ${clientName}</p>
            <p>Date: ${format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
          <div class="content">${letterContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Letter Preview - {letterType.replace('_', ' ').toUpperCase()}
          </Typography>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showLegalCitations}
                  onChange={(e) => setShowLegalCitations(e.target.checked)}
                />
              }
              label="Show Legal Citations"
            />
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            minHeight: '500px', 
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            backgroundColor: '#fafafa'
          }}
        >
          {letterContent}
        </Paper>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleCopy} startIcon={<CopyIcon />}>
          Copy
        </Button>
        <Button onClick={handlePrint} startIcon={<PrintIcon />}>
          Print
        </Button>
        <Button onClick={handleDownload} startIcon={<DownloadIcon />}>
          Download
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />}>
          Save Letter
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// AI Letter Generator Component
function AILetterGenerator({ onLetterGenerated }) {
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [secondaryBureaus, setSecondaryBureaus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    letter_type: '',
    recipient_type: '',
    recipient_name: '',
    recipient_address: '',
    account_details: {
      account_name: '',
      account_number: '',
      balance: '',
      date_opened: '',
      last_payment: ''
    },
    dispute_details: {
      dispute_reason: '',
      specific_violations: [],
      desired_outcome: '',
      supporting_facts: ''
    },
    legal_strategy: {
      primary_laws: [],
      escalation_level: 'initial',
      tone: 'professional',
      include_damages: false,
      include_attorney_threat: false
    },
    ai_enhancement: {
      enabled: true,
      optimization_level: 'aggressive',
      include_precedents: true,
      custom_instructions: ''
    }
  });

  const letterTypes = [
    { value: 'dispute', label: 'Credit Bureau Dispute', description: 'Challenge inaccurate information on credit reports' },
    { value: 'validation', label: 'Debt Validation', description: 'Request proof of debt from collectors' },
    { value: 'goodwill', label: 'Goodwill Letter', description: 'Request removal of accurate but negative items' },
    { value: 'cease_desist', label: 'Cease & Desist', description: 'Stop collection communications' },
    { value: 'opt_out', label: 'Opt-Out Request', description: 'Remove from secondary bureau databases' },
    { value: 'method_verification', label: 'Method of Verification', description: 'Request MOV from credit bureaus' },
    { value: 'intent_to_sue', label: 'Intent to Sue', description: 'Notice of potential legal action' },
    { value: 'lawsuit_demand', label: 'Lawsuit Demand', description: 'Final demand before litigation' }
  ];

  const recipientTypes = [
    { value: 'credit_bureau', label: 'Credit Bureau' },
    { value: 'debt_collector', label: 'Debt Collector' },
    { value: 'original_creditor', label: 'Original Creditor' },
    { value: 'secondary_bureau', label: 'Secondary Bureau' },
    { value: 'furnisher', label: 'Data Furnisher' },
    { value: 'attorney', label: 'Attorney' }
  ];

  const primaryLaws = [
    { value: 'fcra', label: 'Fair Credit Reporting Act (FCRA)', section: '15 USC §1681' },
    { value: 'fdcpa', label: 'Fair Debt Collection Practices Act (FDCPA)', section: '15 USC §1692' },
    { value: 'fcba', label: 'Fair Credit Billing Act (FCBA)', section: '15 USC §1666' },
    { value: 'tcpa', label: 'Telephone Consumer Protection Act (TCPA)', section: '47 USC §227' },
    { value: 'state_consumer', label: 'State Consumer Protection Laws', section: 'Varies by State' },
    { value: 'cfpb_regulations', label: 'CFPB Regulations', section: '12 CFR Part 1006' }
  ];

  const violationTypes = [
    'Failure to investigate dispute',
    'Reporting inaccurate information',
    'Failure to provide method of verification',
    'Continued reporting after dispute',
    'Failure to notify furnisher',
    'Mixing consumer files',
    'Reporting obsolete information',
    'Failure to follow reasonable procedures',
    'Willful non-compliance'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clientsData, templatesData, bureausData] = await Promise.all([
        apiService.getClients(),
        apiService.getLetterTemplates(),
        apiService.getSecondaryBureaus()
      ]);
      
      setClients(clientsData);
      setTemplates(templatesData);
      setSecondaryBureaus(bureausData);
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

  const handleChange = (section, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    if (section) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleArrayChange = (section, field, value, checked) => {
    const currentArray = formData[section][field];
    let newArray;
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: newArray
      }
    });
  };

  const generateLetter = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.generateAILetter(formData);
      setGeneratedLetter(response.content);
      setPreviewOpen(true);
      if (onLetterGenerated) {
        onLetterGenerated(response);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    'Client & Letter Type',
    'Recipient Details',
    'Account Information',
    'Legal Strategy',
    'AI Enhancement',
    'Review & Generate'
  ];

  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return formData.client_id && formData.letter_type;
      case 1:
        return formData.recipient_type && formData.recipient_name;
      case 2:
        return formData.account_details.account_name;
      case 3:
        return formData.legal_strategy.primary_laws.length > 0;
      case 4:
        return true; // AI enhancement is optional
      default:
        return true;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            AI-Powered Letter Generator
          </Typography>
        </Box>
        
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
        
        {/* Step 0: Client & Letter Type */}
        {step === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Client</InputLabel>
                <Select
                  value={formData.client_id}
                  onChange={handleChange(null, 'client_id')}
                  label="Select Client"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {client.first_name[0]}{client.last_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {client.first_name} {client.last_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {client.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Letter Type
              </Typography>
              <RadioGroup
                value={formData.letter_type}
                onChange={handleChange(null, 'letter_type')}
              >
                {letterTypes.map((type) => (
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
          </Grid>
        )}
        
        {/* Step 1: Recipient Details */}
        {step === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Recipient Type</InputLabel>
                <Select
                  value={formData.recipient_type}
                  onChange={handleChange(null, 'recipient_type')}
                  label="Recipient Type"
                >
                  {recipientTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient Name"
                value={formData.recipient_name}
                onChange={handleChange(null, 'recipient_name')}
                required
                placeholder="e.g., Experian, Capital One, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recipient Address"
                value={formData.recipient_address}
                onChange={handleChange(null, 'recipient_address')}
                multiline
                rows={3}
                placeholder="Complete mailing address for the recipient"
              />
            </Grid>
          </Grid>
        )}
        
        {/* Step 2: Account Information */}
        {step === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Name/Creditor"
                value={formData.account_details.account_name}
                onChange={handleChange('account_details', 'account_name')}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={formData.account_details.account_number}
                onChange={handleChange('account_details', 'account_number')}
                placeholder="Last 4 digits or partial number"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Balance"
                value={formData.account_details.balance}
                onChange={handleChange('account_details', 'balance')}
                placeholder="$0.00"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date Opened"
                type="date"
                value={formData.account_details.date_opened}
                onChange={handleChange('account_details', 'date_opened')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Last Payment Date"
                type="date"
                value={formData.account_details.last_payment}
                onChange={handleChange('account_details', 'last_payment')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dispute Reason"
                value={formData.dispute_details.dispute_reason}
                onChange={handleChange('dispute_details', 'dispute_reason')}
                multiline
                rows={2}
                placeholder="Specific reason for disputing this account"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Desired Outcome"
                value={formData.dispute_details.desired_outcome}
                onChange={handleChange('dispute_details', 'desired_outcome')}
                placeholder="e.g., Remove account, correct balance, update status"
              />
            </Grid>
          </Grid>
        )}
        
        {/* Step 3: Legal Strategy */}
        {step === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Primary Laws to Cite
              </Typography>
              {primaryLaws.map((law) => (
                <FormControlLabel
                  key={law.value}
                  control={
                    <Checkbox
                      checked={formData.legal_strategy.primary_laws.includes(law.value)}
                      onChange={(e) => handleArrayChange('legal_strategy', 'primary_laws', law.value, e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">{law.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {law.section}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Specific Violations (if applicable)
              </Typography>
              {violationTypes.map((violation) => (
                <FormControlLabel
                  key={violation}
                  control={
                    <Checkbox
                      checked={formData.dispute_details.specific_violations.includes(violation)}
                      onChange={(e) => handleArrayChange('dispute_details', 'specific_violations', violation, e.target.checked)}
                    />
                  }
                  label={violation}
                />
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Escalation Level</InputLabel>
                <Select
                  value={formData.legal_strategy.escalation_level}
                  onChange={handleChange('legal_strategy', 'escalation_level')}
                  label="Escalation Level"
                >
                  <MenuItem value="initial">Initial Request</MenuItem>
                  <MenuItem value="follow_up">Follow-up</MenuItem>
                  <MenuItem value="final_demand">Final Demand</MenuItem>
                  <MenuItem value="pre_litigation">Pre-Litigation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tone</InputLabel>
                <Select
                  value={formData.legal_strategy.tone}
                  onChange={handleChange('legal_strategy', 'tone')}
                  label="Tone"
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="firm">Firm</MenuItem>
                  <MenuItem value="aggressive">Aggressive</MenuItem>
                  <MenuItem value="diplomatic">Diplomatic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.legal_strategy.include_damages}
                    onChange={handleChange('legal_strategy', 'include_damages')}
                  />
                }
                label="Include Statutory Damages Reference"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.legal_strategy.include_attorney_threat}
                    onChange={handleChange('legal_strategy', 'include_attorney_threat')}
                  />
                }
                label="Include Attorney Consultation Threat"
              />
            </Grid>
          </Grid>
        )}
        
        {/* Step 4: AI Enhancement */}
        {step === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" icon={<AutoAwesomeIcon />}>
                <Typography variant="subtitle2">AI Enhancement Options</Typography>
                <Typography variant="body2">
                  Configure how AI will optimize your letter for maximum legal effectiveness.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.ai_enhancement.enabled}
                    onChange={handleChange('ai_enhancement', 'enabled')}
                  />
                }
                label="Enable AI Enhancement"
              />
            </Grid>
            
            {formData.ai_enhancement.enabled && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Optimization Level</InputLabel>
                    <Select
                      value={formData.ai_enhancement.optimization_level}
                      onChange={handleChange('ai_enhancement', 'optimization_level')}
                      label="Optimization Level"
                    >
                      <MenuItem value="conservative">Conservative - Basic optimization</MenuItem>
                      <MenuItem value="moderate">Moderate - Balanced approach</MenuItem>
                      <MenuItem value="aggressive">Aggressive - Maximum optimization</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.ai_enhancement.include_precedents}
                        onChange={handleChange('ai_enhancement', 'include_precedents')}
                      />
                    }
                    label="Include Legal Precedents"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Custom AI Instructions"
                    value={formData.ai_enhancement.custom_instructions}
                    onChange={handleChange('ai_enhancement', 'custom_instructions')}
                    multiline
                    rows={3}
                    placeholder="Provide specific instructions for AI optimization (optional)"
                  />
                </Grid>
              </>
            )}
          </Grid>
        )}
        
        {/* Step 5: Review & Generate */}
        {step === 5 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Letter Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Client & Letter Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Client:</strong> {clients.find(c => c.id === formData.client_id)?.first_name} {clients.find(c => c.id === formData.client_id)?.last_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Letter Type:</strong> {letterTypes.find(t => t.value === formData.letter_type)?.label}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Recipient:</strong> {formData.recipient_name} ({formData.recipient_type.replace('_', ' ')})
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Legal Strategy
                  </Typography>
                  <Typography variant="body2">
                    <strong>Primary Laws:</strong> {formData.legal_strategy.primary_laws.length} selected
                  </Typography>
                  <Typography variant="body2">
                    <strong>Escalation Level:</strong> {formData.legal_strategy.escalation_level.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tone:</strong> {formData.legal_strategy.tone}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    AI Enhancement
                  </Typography>
                  {formData.ai_enhancement.enabled ? (
                    <Box>
                      <Chip icon={<AutoAwesomeIcon />} label="AI Enhancement Enabled" color="primary" size="small" />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Optimization Level: {formData.ai_enhancement.optimization_level}
                      </Typography>
                      {formData.ai_enhancement.include_precedents && (
                        <Typography variant="body2">
                          Legal precedents will be included
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      AI enhancement disabled - standard template will be used
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            onClick={handleBack} 
            disabled={step === 0 || loading}
          >
            Back
          </Button>
          
          <Box>
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
                onClick={generateLetter} 
                variant="contained"
                disabled={loading || !isStepValid(step)}
                startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              >
                {loading ? 'Generating...' : 'Generate Letter'}
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Letter Preview Dialog */}
        <LetterPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          letterContent={generatedLetter}
          letterType={formData.letter_type}
          clientName={clients.find(c => c.id === formData.client_id)?.first_name + ' ' + clients.find(c => c.id === formData.client_id)?.last_name}
        />
      </CardContent>
    </Card>
  );
}

// Generated Letters History Component
function GeneratedLettersHistory() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getGeneratedLetters();
      setLetters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewLetter = (letter) => {
    setSelectedLetter(letter);
    setPreviewOpen(true);
  };

  const getLetterTypeColor = (type) => {
    switch (type) {
      case 'dispute': return 'primary';
      case 'validation': return 'secondary';
      case 'goodwill': return 'success';
      case 'cease_desist': return 'error';
      case 'opt_out': return 'warning';
      default: return 'default';
    }
  };

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = 
      letter.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || letter.letter_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Generated Letters History
          </Typography>
          <Button startIcon={<RefreshIcon />} onClick={fetchLetters}>
            Refresh
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search letters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Letter Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Letter Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="dispute">Dispute</MenuItem>
                <MenuItem value="validation">Validation</MenuItem>
                <MenuItem value="goodwill">Goodwill</MenuItem>
                <MenuItem value="cease_desist">Cease & Desist</MenuItem>
                <MenuItem value="opt_out">Opt-Out</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Letters Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Letter Type</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>AI Enhanced</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLetters.map((letter) => (
                <TableRow key={letter.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {letter.client_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={letter.letter_type.replace('_', ' ').toUpperCase()}
                      color={getLetterTypeColor(letter.letter_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {letter.recipient_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(letter.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {letter.ai_enhanced ? (
                      <Tooltip title="AI-Enhanced Letter">
                        <AutoAwesomeIcon color="primary" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Standard
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview">
                      <IconButton onClick={() => handlePreviewLetter(letter)}>
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton>
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredLetters.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No letters found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Generated letters will appear here'
              }
            </Typography>
          </Box>
        )}
        
        {/* Letter Preview Dialog */}
        {selectedLetter && (
          <LetterPreviewDialog
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            letterContent={selectedLetter.content}
            letterType={selectedLetter.letter_type}
            clientName={selectedLetter.client_name}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Main Letter Generation Component
function LetterGeneration() {
  const [tabValue, setTabValue] = useState(0);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleLetterGenerated = (letter) => {
    // Refresh the history when a new letter is generated
    setRefreshHistory(prev => prev + 1);
    // Switch to history tab to show the new letter
    setTabValue(1);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Letter Generation
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Generate AI-powered legal letters with citations and optimized language
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label="AI Letter Generator" 
            icon={<AutoAwesomeIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Generated Letters" 
            icon={<HistoryIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <AILetterGenerator onLetterGenerated={handleLetterGenerated} />
      )}
      
      {tabValue === 1 && (
        <GeneratedLettersHistory key={refreshHistory} />
      )}
    </Box>
  );
}

export default LetterGeneration;