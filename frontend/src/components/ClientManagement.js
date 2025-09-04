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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Menu,
  Fab
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiService = {
  async getClients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/clients?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  async createClient(clientData) {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });
    if (!response.ok) throw new Error('Failed to create client');
    return response.json();
  },

  async getClient(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch client');
    return response.json();
  },

  async getClientEnforcementStages(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/enforcement-stages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch enforcement stages');
    return response.json();
  },

  async advanceClientStage(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/advance-stage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to advance client stage');
    return response.json();
  },

  async getClientLetters(clientId) {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/letters`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch client letters');
    return response.json();
  }
};

// Add Client Dialog Component
function AddClientDialog({ open, onClose, onClientAdded }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    ssn_last_four: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    credit_score: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clientData = {
        ...formData,
        credit_score: formData.credit_score ? parseInt(formData.credit_score) : null,
        date_of_birth: formData.date_of_birth || null
      };
      
      await apiService.createClient(clientData);
      onClientAdded();
      onClose();
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        ssn_last_four: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        credit_score: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Add New Client
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange('date_of_birth')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SSN Last 4 Digits"
                value={formData.ssn_last_four}
                onChange={handleChange('ssn_last_four')}
                inputProps={{ maxLength: 4 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={handleChange('address')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleChange('city')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleChange('state')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.zip_code}
                onChange={handleChange('zip_code')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Score"
                type="number"
                value={formData.credit_score}
                onChange={handleChange('credit_score')}
                inputProps={{ min: 300, max: 850 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Add Client'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Client Details Dialog Component
function ClientDetailsDialog({ open, onClose, clientId }) {
  const [client, setClient] = useState(null);
  const [enforcementStages, setEnforcementStages] = useState([]);
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && clientId) {
      fetchClientDetails();
    }
  }, [open, clientId]);

  const fetchClientDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientData, stagesData, lettersData] = await Promise.all([
        apiService.getClient(clientId),
        apiService.getClientEnforcementStages(clientId),
        apiService.getClientLetters(clientId)
      ]);
      
      setClient(clientData);
      setEnforcementStages(stagesData);
      setLetters(lettersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStage = async () => {
    try {
      await apiService.advanceClientStage(clientId);
      fetchClientDetails(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  const getStageStatus = (stage) => {
    switch (stage.status) {
      case 'completed': return { color: 'success', label: 'Completed' };
      case 'in_progress': return { color: 'primary', label: 'In Progress' };
      case 'not_started': return { color: 'default', label: 'Not Started' };
      default: return { color: 'default', label: 'Unknown' };
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
            {client ? `${client.first_name} ${client.last_name}` : 'Client Details'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleAdvanceStage}
            disabled={!client}
          >
            Advance Stage
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {client && (
          <Box>
            {/* Client Info Header */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {client.first_name[0]}{client.last_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {client.first_name} {client.last_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Client ID: {client.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">{client.email}</Typography>
                      </Box>
                      {client.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">{client.phone}</Typography>
                        </Box>
                      )}
                      {client.address && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {client.address}, {client.city}, {client.state} {client.zip_code}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                      <Box>
                        <Typography variant="h4" color="primary">
                          {client.credit_score || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Credit Score
                        </Typography>
                      </Box>
                      <Box>
                        <Chip
                          label={client.current_enforcement_stage || 'Not Started'}
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Current Stage
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" color="success.main">
                          {client.status}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Status
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
                <Tab label="Enforcement Chain" />
                <Tab label="Generated Letters" />
                <Tab label="Activity Timeline" />
              </Tabs>
            </Box>
            
            {/* Tab Content */}
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Enforcement Chain Progress
                </Typography>
                <Stepper orientation="vertical">
                  {enforcementStages.map((stage, index) => {
                    const status = getStageStatus(stage);
                    return (
                      <Step key={stage.id} active={stage.status === 'in_progress'} completed={stage.status === 'completed'}>
                        <StepLabel
                          StepIconProps={{
                            style: {
                              color: status.color === 'success' ? '#4caf50' : 
                                     status.color === 'primary' ? '#1976d2' : '#9e9e9e'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Typography variant="subtitle1">
                              {stage.stage_name}
                            </Typography>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {stage.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Estimated Duration: {stage.estimated_duration_days} days
                          </Typography>
                          {stage.started_at && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Started: {format(new Date(stage.started_at), 'MMM dd, yyyy')}
                            </Typography>
                          )}
                          {stage.completed_at && (
                            <Typography variant="caption" display="block" color="success.main">
                              Completed: {format(new Date(stage.completed_at), 'MMM dd, yyyy')}
                            </Typography>
                          )}
                        </StepContent>
                      </Step>
                    );
                  })}
                </Stepper>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Generated Letters ({letters.length})
                </Typography>
                {letters.length === 0 ? (
                  <Alert severity="info">
                    No letters generated yet. Letters will be automatically generated as the client progresses through the enforcement chain.
                  </Alert>
                ) : (
                  <List>
                    {letters.map((letter, index) => (
                      <React.Fragment key={letter.id}>
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon color={letter.ai_enhanced ? 'primary' : 'default'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">
                                  {letter.letter_type.replace('_', ' ').toUpperCase()}
                                </Typography>
                                {letter.ai_enhanced && (
                                  <Chip label="AI Enhanced" color="primary" size="small" />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  To: {letter.recipient_name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Generated: {format(new Date(letter.created_at), 'MMM dd, yyyy HH:mm')}
                                </Typography>
                              </Box>
                            }
                          />
                          <IconButton>
                            <ViewIcon />
                          </IconButton>
                          <IconButton>
                            <DownloadIcon />
                          </IconButton>
                        </ListItem>
                        {index < letters.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Activity Timeline
                </Typography>
                <Alert severity="info">
                  Activity timeline feature coming soon. This will show all client interactions, stage progressions, and system actions.
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Client Management Component
function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getClients();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = () => {
    setAddDialogOpen(true);
  };

  const handleViewClient = (clientId) => {
    setSelectedClientId(clientId);
    setDetailsDialogOpen(true);
  };

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getCreditScoreColor = (score) => {
    if (!score) return 'textSecondary';
    if (score >= 740) return 'success.main';
    if (score >= 670) return 'warning.main';
    return 'error.main';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
            Client Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage clients and track enforcement chain progress
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClient}
          size="large"
        >
          Add Client
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button onClick={fetchClients} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchClients}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Credit Score</TableCell>
                <TableCell>Current Stage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {client.first_name[0]}{client.last_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {client.first_name} {client.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {client.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{client.email}</Typography>
                      {client.phone && (
                        <Typography variant="caption" color="textSecondary">
                          {client.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="h6"
                      sx={{ color: getCreditScoreColor(client.credit_score) }}
                    >
                      {client.credit_score || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.current_enforcement_stage || 'Not Started'}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.status}
                      color={getStatusColor(client.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(client.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleViewClient(client.id)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton onClick={(e) => handleMenuOpen(e, client)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredClients.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No clients found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first client'
              }
            </Typography>
            {!searchTerm && statusFilter === 'all' && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClient}>
                Add First Client
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
        <MenuItem onClick={() => { handleViewClient(selectedClient?.id); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} /> Edit Client
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EmailIcon sx={{ mr: 1 }} /> Send Email
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon sx={{ mr: 1 }} /> Export Data
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete Client
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <AddClientDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onClientAdded={fetchClients}
      />
      
      <ClientDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        clientId={selectedClientId}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add client"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddClient}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default ClientManagement;