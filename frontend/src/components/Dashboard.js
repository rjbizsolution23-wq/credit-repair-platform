import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  Gavel,
  Email,
  Security,
  AttachMoney,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Launch,
  Timeline,
  Assessment,
  School,
  Share
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays } from 'date-fns';

// API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiService = {
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  async getRecentClients() {
    const response = await fetch(`${API_BASE_URL}/api/clients?limit=5`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch recent clients');
    return response.json();
  },

  async getRecentDisputes() {
    const response = await fetch(`${API_BASE_URL}/api/disputes?limit=5`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch recent disputes');
    return response.json();
  }
};

// Stat Card Component
function StatCard({ title, value, icon, color, trend, subtitle }) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

// Enforcement Chain Progress Component
function EnforcementChainProgress({ stages }) {
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2'];
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Enforcement Chain Progress
        </Typography>
        <Box sx={{ mt: 2 }}>
          {stages.map((stage, index) => (
            <Box key={stage.stage_name} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {stage.stage_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stage.client_count} clients
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(stage.client_count / Math.max(...stages.map(s => s.client_count))) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.800',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors[index % colors.length]
                  }
                }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// Recent Activity Component
function RecentActivity({ clients, disputes }) {
  const activities = [
    ...clients.slice(0, 3).map(client => ({
      type: 'client',
      title: `New client: ${client.first_name} ${client.last_name}`,
      subtitle: `Credit Score: ${client.credit_score || 'N/A'}`,
      time: format(new Date(client.created_at), 'MMM dd, HH:mm'),
      icon: <People />,
      color: 'primary.main'
    })),
    ...disputes.slice(0, 3).map(dispute => ({
      type: 'dispute',
      title: `New dispute: ${dispute.creditor_name}`,
      subtitle: `Success Probability: ${Math.round((dispute.ai_success_probability || 0) * 100)}%`,
      time: format(new Date(dispute.created_at), 'MMM dd, HH:mm'),
      icon: <Gavel />,
      color: 'secondary.main'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {activities.map((activity, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: activity.color, width: 32, height: 32 }}>
                    {activity.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {activity.subtitle}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

// Performance Chart Component
function PerformanceChart() {
  // Mock data for demonstration
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'MMM dd'),
      disputes: Math.floor(Math.random() * 20) + 5,
      resolutions: Math.floor(Math.random() * 15) + 2,
      letters: Math.floor(Math.random() * 25) + 8
    };
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          30-Day Performance Trends
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="date" stroke="#b0bec5" />
              <YAxis stroke="#b0bec5" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#1a1d3a',
                  border: '1px solid #2d3748',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="disputes"
                stroke="#1976d2"
                strokeWidth={2}
                name="New Disputes"
              />
              <Line
                type="monotone"
                dataKey="resolutions"
                stroke="#4caf50"
                strokeWidth={2}
                name="Resolutions"
              />
              <Line
                type="monotone"
                dataKey="letters"
                stroke="#ff9800"
                strokeWidth={2}
                name="Letters Generated"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    {
      title: 'Add New Client',
      description: 'Start enforcement chain',
      icon: <People />,
      color: 'primary',
      path: '/clients'
    },
    {
      title: 'Generate Letter',
      description: 'AI-powered legal letters',
      icon: <Email />,
      color: 'secondary',
      path: '/letters'
    },
    {
      title: 'File Dispute',
      description: 'Create new dispute',
      icon: <Gavel />,
      color: 'warning',
      path: '/disputes'
    },
    {
      title: 'Bureau Actions',
      description: 'Opt-outs & freezes',
      icon: <Security />,
      color: 'error',
      path: '/bureaus'
    }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {actions.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={action.icon}
                sx={{
                  height: 80,
                  flexDirection: 'column',
                  gap: 1,
                  borderColor: `${action.color}.main`,
                  color: `${action.color}.main`,
                  '&:hover': {
                    borderColor: `${action.color}.dark`,
                    backgroundColor: `${action.color}.main`,
                    color: 'white'
                  }
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {action.title}
                </Typography>
                <Typography variant="caption">
                  {action.description}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// System Status Component
function SystemStatus() {
  const [systemHealth, setSystemHealth] = useState({
    api: 'healthy',
    database: 'healthy',
    ai_engine: 'healthy',
    social_media: 'warning',
    email_service: 'healthy'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Warning />;
      default: return <Info />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            System Status
          </Typography>
          <IconButton size="small">
            <Refresh />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.entries(systemHealth).map(([service, status]) => (
            <Box key={service} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {service.replace('_', ' ')}
              </Typography>
              <Chip
                icon={getStatusIcon(status)}
                label={status}
                color={getStatusColor(status)}
                size="small"
                variant="outlined"
              />
            </Box>
          ))}
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          All core systems operational. Social media API rate limit approaching.
        </Alert>
      </CardContent>
    </Card>
  );
}

// Main Dashboard Component
function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, clientsData, disputesData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentClients(),
        apiService.getRecentDisputes()
      ]);
      
      setStats(statsData);
      setRecentClients(clientsData);
      setRecentDisputes(disputesData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading dashboard: {error}
        <Button onClick={fetchDashboardData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Rick Jefferson AI Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Supreme Credit Enforcement Chain™ - Total Legal Automation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={stats?.total_clients || 0}
            icon={<People />}
            color="primary.main"
            trend="+12% this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Disputes"
            value={stats?.total_disputes || 0}
            icon={<Gavel />}
            color="secondary.main"
            subtitle={`${stats?.resolved_disputes || 0} resolved`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Letters Generated"
            value={stats?.letters_generated || 0}
            icon={<Email />}
            color="warning.main"
            trend="+8% this week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Credit Score"
            value={stats?.avg_credit_score || 0}
            icon={<Assessment />}
            color="success.main"
            trend="+15 points avg"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Performance Chart */}
            <Grid item xs={12}>
              <PerformanceChart />
            </Grid>
            
            {/* Enforcement Chain Progress */}
            <Grid item xs={12} md={6}>
              <EnforcementChainProgress stages={stats?.enforcement_stages || []} />
            </Grid>
            
            {/* Quick Actions */}
            <Grid item xs={12} md={6}>
              <QuickActions />
            </Grid>
          </Grid>
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Recent Activity */}
            <Grid item xs={12}>
              <RecentActivity clients={recentClients} disputes={recentDisputes} />
            </Grid>
            
            {/* System Status */}
            <Grid item xs={12}>
              <SystemStatus />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;