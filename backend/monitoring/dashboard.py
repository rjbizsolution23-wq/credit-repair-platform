#!/usr/bin/env python3
"""
Rick Jefferson Solutions - Production Monitoring Dashboard
Real-time monitoring dashboard with alerting for credit repair platform

Author: Rick Jefferson Architect
Company: Rick Jefferson Solutions
Contact: info@rickjeffersonsolutions.com
"""

import asyncio
import json
import logging
import os
import smtplib
import time
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Any, Optional
import schedule
from pathlib import Path

# Import our health monitor
from health_checks import HealthMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monitoring_dashboard.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MonitoringDashboard:
    """Production monitoring dashboard with alerting"""
    
    def __init__(self):
        self.health_monitor = HealthMonitor()
        self.alert_config = {
            'email_enabled': os.getenv('ALERT_EMAIL_ENABLED', 'false').lower() == 'true',
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'smtp_username': os.getenv('SMTP_USERNAME', ''),
            'smtp_password': os.getenv('SMTP_PASSWORD', ''),
            'alert_recipients': os.getenv('ALERT_RECIPIENTS', 'info@rickjeffersonsolutions.com').split(','),
            'alert_cooldown_minutes': int(os.getenv('ALERT_COOLDOWN_MINUTES', '30'))
        }
        self.last_alerts = {}
        self.monitoring_data = []
        
    def should_send_alert(self, service: str, status: str) -> bool:
        """Check if alert should be sent based on cooldown period"""
        if status == 'healthy':
            return False
            
        alert_key = f"{service}_{status}"
        now = datetime.now(timezone.utc)
        
        if alert_key in self.last_alerts:
            last_alert_time = self.last_alerts[alert_key]
            cooldown_period = timedelta(minutes=self.alert_config['alert_cooldown_minutes'])
            
            if now - last_alert_time < cooldown_period:
                return False
        
        self.last_alerts[alert_key] = now
        return True
    
    def send_email_alert(self, subject: str, body: str) -> bool:
        """Send email alert to configured recipients"""
        if not self.alert_config['email_enabled']:
            logger.info("Email alerts disabled, skipping email notification")
            return False
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.alert_config['smtp_username']
            msg['Subject'] = f"[RJS Alert] {subject}"
            
            # Create HTML email body
            html_body = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: 'Open Sans', Arial, sans-serif; margin: 20px; }}
                    .header {{ background-color: #14B8A6; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f8f9fa; }}
                    .alert {{ background-color: #DC2626; color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                    .footer {{ background-color: #1E3A8A; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                    .logo {{ font-weight: bold; font-size: 18px; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">RICK JEFFERSON SOLUTIONS</div>
                    <div>Credit Repair Platform Alert</div>
                </div>
                <div class="content">
                    <div class="alert">
                        <strong>ALERT:</strong> {subject}
                    </div>
                    <pre>{body}</pre>
                    <p><strong>Timestamp:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                </div>
                <div class="footer">
                    <div><strong>Rick Jefferson Solutions</strong></div>
                    <div>Your Credit Freedom Starts Here</div>
                    <div>Contact: info@rickjeffersonsolutions.com | 877-763-8587</div>
                    <div>Trusted by NFL & Dallas Cowboys</div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send to all recipients
            with smtplib.SMTP(self.alert_config['smtp_server'], self.alert_config['smtp_port']) as server:
                server.starttls()
                server.login(self.alert_config['smtp_username'], self.alert_config['smtp_password'])
                
                for recipient in self.alert_config['alert_recipients']:
                    msg['To'] = recipient.strip()
                    server.send_message(msg)
                    del msg['To']
            
            logger.info(f"Alert email sent to {len(self.alert_config['alert_recipients'])} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False
    
    def process_alerts(self, health_report: Dict[str, Any]) -> None:
        """Process health report and send alerts if needed"""
        alerts_sent = []
        
        # Check overall platform health
        overall_status = health_report.get('overall_status', 'unknown')
        health_percentage = health_report.get('health_percentage', 0)
        
        if overall_status in ['unhealthy', 'degraded'] and self.should_send_alert('platform', overall_status):
            subject = f"Platform Status: {overall_status.upper()}"
            body = f"""
Rick Jefferson Solutions Credit Repair Platform Alert

Overall Status: {overall_status.upper()}
Health Percentage: {health_percentage}%
Checks Passed: {health_report.get('checks_passed', 0)}/{health_report.get('total_checks', 0)}

Service Status Summary:
"""
            
            for check in health_report.get('checks', []):
                if isinstance(check, dict):
                    service = check.get('service', 'Unknown')
                    status = check.get('status', 'unknown')
                    body += f"- {service}: {status.upper()}\n"
            
            body += f"\nTimestamp: {health_report.get('timestamp', 'Unknown')}\n"
            body += "\nPlease investigate immediately.\n"
            
            if self.send_email_alert(subject, body):
                alerts_sent.append(f"Platform {overall_status}")
        
        # Check individual services
        for check in health_report.get('checks', []):
            if isinstance(check, dict):
                service = check.get('service', 'Unknown')
                status = check.get('status', 'unknown')
                
                if status in ['unhealthy', 'error', 'warning'] and self.should_send_alert(service, status):
                    subject = f"{service} Status: {status.upper()}"
                    body = f"""
Rick Jefferson Solutions Service Alert

Service: {service}
Status: {status.upper()}
Response Time: {check.get('response_time_ms', 'N/A')}ms
Error: {check.get('error', 'None')}
Timestamp: {check.get('timestamp', 'Unknown')}

Details:
{json.dumps(check.get('details', {}), indent=2)}

Please investigate this service immediately.
"""
                    
                    if self.send_email_alert(subject, body):
                        alerts_sent.append(f"{service} {status}")
        
        if alerts_sent:
            logger.warning(f"Alerts sent for: {', '.join(alerts_sent)}")
        else:
            logger.info("No alerts triggered")
    
    def generate_dashboard_html(self, health_report: Dict[str, Any]) -> str:
        """Generate HTML dashboard for health monitoring"""
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        
        # Status colors
        status_colors = {
            'healthy': '#059669',
            'unhealthy': '#DC2626',
            'warning': '#D97706',
            'error': '#DC2626',
            'degraded': '#D97706'
        }
        
        overall_color = status_colors.get(health_report.get('overall_status', 'unknown'), '#6B7280')
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rick Jefferson Solutions - Production Monitoring Dashboard</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Open Sans', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }}
        
        .header {{
            background: linear-gradient(135deg, #14B8A6, #1E3A8A);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .header h1 {{
            font-family: 'Montserrat', Arial Black, sans-serif;
            font-size: 28px;
            margin-bottom: 5px;
        }}
        
        .header p {{
            font-size: 16px;
            opacity: 0.9;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        .status-overview {{
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        }}
        
        .status-badge {{
            display: inline-block;
            background-color: {overall_color};
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }}
        
        .health-percentage {{
            font-size: 48px;
            font-weight: bold;
            color: {overall_color};
            margin-bottom: 10px;
        }}
        
        .services-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .service-card {{
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 5px solid #14B8A6;
        }}
        
        .service-card.unhealthy {{
            border-left-color: #DC2626;
        }}
        
        .service-card.warning {{
            border-left-color: #D97706;
        }}
        
        .service-card.error {{
            border-left-color: #DC2626;
        }}
        
        .service-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        
        .service-name {{
            font-size: 18px;
            font-weight: bold;
            color: #1E3A8A;
        }}
        
        .service-status {{
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        
        .service-status.healthy {{
            background-color: #059669;
            color: white;
        }}
        
        .service-status.unhealthy {{
            background-color: #DC2626;
            color: white;
        }}
        
        .service-status.warning {{
            background-color: #D97706;
            color: white;
        }}
        
        .service-status.error {{
            background-color: #DC2626;
            color: white;
        }}
        
        .service-details {{
            font-size: 14px;
            color: #6B7280;
        }}
        
        .response-time {{
            font-weight: bold;
            color: #14B8A6;
        }}
        
        .footer {{
            background-color: #1E3A8A;
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
        }}
        
        .footer h3 {{
            margin-bottom: 10px;
        }}
        
        .last-updated {{
            background: white;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .refresh-btn {{
            background: linear-gradient(135deg, #14B8A6, #0F766E);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
        }}
        
        .refresh-btn:hover {{
            background: linear-gradient(135deg, #0F766E, #14B8A6);
        }}
    </style>
    <script>
        function refreshPage() {{
            location.reload();
        }}
        
        // Auto-refresh every 5 minutes
        setTimeout(function() {{
            location.reload();
        }}, 300000);
    </script>
</head>
<body>
    <div class="header">
        <h1>RICK JEFFERSON SOLUTIONS</h1>
        <p>Production Monitoring Dashboard - Credit Repair Platform</p>
    </div>
    
    <div class="container">
        <div class="last-updated">
            <strong>Last Updated:</strong> {timestamp}
            <button class="refresh-btn" onclick="refreshPage()">Refresh Now</button>
        </div>
        
        <div class="status-overview">
            <div class="status-badge">{health_report.get('overall_status', 'unknown').upper()}</div>
            <div class="health-percentage">{health_report.get('health_percentage', 0)}%</div>
            <p>Platform Health Score</p>
            <p><strong>{health_report.get('checks_passed', 0)}</strong> of <strong>{health_report.get('total_checks', 0)}</strong> services healthy</p>
        </div>
        
        <div class="services-grid">
"""
        
        # Add service cards
        for check in health_report.get('checks', []):
            if isinstance(check, dict):
                service = check.get('service', 'Unknown')
                status = check.get('status', 'unknown')
                response_time = check.get('response_time_ms')
                error = check.get('error', '')
                
                html += f"""
            <div class="service-card {status}">
                <div class="service-header">
                    <div class="service-name">{service}</div>
                    <div class="service-status {status}">{status}</div>
                </div>
                <div class="service-details">
"""
                
                if response_time:
                    html += f'<p>Response Time: <span class="response-time">{response_time}ms</span></p>'
                
                if error:
                    html += f'<p style="color: #DC2626;"><strong>Error:</strong> {error}</p>'
                
                if check.get('details'):
                    details = check['details']
                    if isinstance(details, dict):
                        for key, value in details.items():
                            if key not in ['url']:
                                html += f'<p><strong>{key.replace("_", " ").title()}:</strong> {value}</p>'
                
                html += """
                </div>
            </div>
"""
        
        html += f"""
        </div>
    </div>
    
    <div class="footer">
        <h3>Rick Jefferson Solutions</h3>
        <p>Your Credit Freedom Starts Here</p>
        <p>Contact: info@rickjeffersonsolutions.com | 877-763-8587</p>
        <p>Trusted by NFL & Dallas Cowboys</p>
    </div>
</body>
</html>
"""
        
        return html
    
    def save_dashboard(self, health_report: Dict[str, Any]) -> str:
        """Save dashboard HTML to file"""
        html_content = self.generate_dashboard_html(health_report)
        dashboard_path = Path('monitoring_dashboard.html')
        
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"Dashboard saved to {dashboard_path}")
        return str(dashboard_path)
    
    async def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Run a complete monitoring cycle"""
        logger.info("Starting monitoring cycle")
        
        try:
            # Run health checks
            health_report = await self.health_monitor.run_all_checks()
            
            # Store monitoring data
            self.monitoring_data.append({
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'health_percentage': health_report.get('health_percentage', 0),
                'overall_status': health_report.get('overall_status', 'unknown')
            })
            
            # Keep only last 24 hours of data
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
            self.monitoring_data = [
                data for data in self.monitoring_data 
                if datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00')) > cutoff_time
            ]
            
            # Process alerts
            self.process_alerts(health_report)
            
            # Save dashboard
            dashboard_file = self.save_dashboard(health_report)
            
            # Save health report
            report_file = self.health_monitor.save_report(health_report)
            
            logger.info(f"Monitoring cycle completed - Dashboard: {dashboard_file}, Report: {report_file}")
            
            return health_report
            
        except Exception as e:
            logger.error(f"Monitoring cycle failed: {e}")
            return None
    
    def start_continuous_monitoring(self, interval_minutes: int = 5) -> None:
        """Start continuous monitoring with specified interval"""
        logger.info(f"Starting continuous monitoring (every {interval_minutes} minutes)")
        
        # Schedule monitoring
        schedule.every(interval_minutes).minutes.do(
            lambda: asyncio.run(self.run_monitoring_cycle())
        )
        
        # Run initial check
        asyncio.run(self.run_monitoring_cycle())
        
        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(30)  # Check every 30 seconds

async def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("RICK JEFFERSON SOLUTIONS - PRODUCTION MONITORING DASHBOARD")
    print("Real-time Health Monitoring & Alerting System")
    print("Contact: info@rickjeffersonsolutions.com")
    print("="*70 + "\n")
    
    dashboard = MonitoringDashboard()
    
    # Run single monitoring cycle
    health_report = await dashboard.run_monitoring_cycle()
    
    if health_report:
        print(f"✅ Monitoring cycle completed successfully")
        print(f"📊 Platform Status: {health_report['overall_status'].upper()}")
        print(f"💚 Health Score: {health_report['health_percentage']}%")
        print(f"📈 Dashboard saved to: monitoring_dashboard.html")
        print("\n🔄 To start continuous monitoring, run with --continuous flag")
    else:
        print("❌ Monitoring cycle failed")
    
    print("\n" + "="*70)
    print("Rick Jefferson Solutions - Your Credit Freedom Starts Here")
    print("Trusted by NFL & Dallas Cowboys")
    print("="*70)

if __name__ == "__main__":
    import sys
    
    if '--continuous' in sys.argv:
        dashboard = MonitoringDashboard()
        dashboard.start_continuous_monitoring()
    else:
        asyncio.run(main())