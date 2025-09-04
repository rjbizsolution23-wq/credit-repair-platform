#!/usr/bin/env python3
"""
Rick Jefferson Solutions - Production Health Monitoring System
Comprehensive health checks for credit repair platform

Author: Rick Jefferson Architect
Company: Rick Jefferson Solutions
Contact: info@rickjeffersonsolutions.com
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import aiohttp
import psutil
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('health_monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class HealthMonitor:
    """Production health monitoring for Rick Jefferson Solutions platform"""
    
    def __init__(self):
        self.base_url = os.getenv('API_BASE_URL', 'http://localhost:8000')
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:4200')
        self.alert_thresholds = {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'disk_percent': 90.0,
            'response_time_ms': 5000,
            'error_rate_percent': 5.0
        }
        self.results = []
        
    async def check_api_health(self) -> Dict[str, Any]:
        """Check main API health endpoint"""
        start_time = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/v1/health", timeout=10) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'service': 'API Health',
                            'status': 'healthy',
                            'response_time_ms': round(response_time, 2),
                            'details': data,
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                    else:
                        return {
                            'service': 'API Health',
                            'status': 'unhealthy',
                            'response_time_ms': round(response_time, 2),
                            'error': f'HTTP {response.status}',
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
        except Exception as e:
            return {
                'service': 'API Health',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def check_database_health(self) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        start_time = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/v1/health/database", timeout=15) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'service': 'Database',
                            'status': 'healthy',
                            'response_time_ms': round(response_time, 2),
                            'details': data,
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                    else:
                        return {
                            'service': 'Database',
                            'status': 'unhealthy',
                            'response_time_ms': round(response_time, 2),
                            'error': f'HTTP {response.status}',
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
        except Exception as e:
            return {
                'service': 'Database',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def check_stripe_integration(self) -> Dict[str, Any]:
        """Check Stripe payment processing health"""
        start_time = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/v1/stripe/health", timeout=10) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'service': 'Stripe Integration',
                            'status': 'healthy',
                            'response_time_ms': round(response_time, 2),
                            'details': data,
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                    else:
                        return {
                            'service': 'Stripe Integration',
                            'status': 'unhealthy',
                            'response_time_ms': round(response_time, 2),
                            'error': f'HTTP {response.status}',
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
        except Exception as e:
            return {
                'service': 'Stripe Integration',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def check_auth_system(self) -> Dict[str, Any]:
        """Check authentication system health"""
        start_time = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/v1/auth/health", timeout=10) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'service': 'Authentication System',
                            'status': 'healthy',
                            'response_time_ms': round(response_time, 2),
                            'details': data,
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                    else:
                        return {
                            'service': 'Authentication System',
                            'status': 'unhealthy',
                            'response_time_ms': round(response_time, 2),
                            'error': f'HTTP {response.status}',
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
        except Exception as e:
            return {
                'service': 'Authentication System',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def check_frontend_health(self) -> Dict[str, Any]:
        """Check Angular frontend availability"""
        start_time = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.frontend_url, timeout=10) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        return {
                            'service': 'Frontend (Angular)',
                            'status': 'healthy',
                            'response_time_ms': round(response_time, 2),
                            'details': {'url': self.frontend_url},
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                    else:
                        return {
                            'service': 'Frontend (Angular)',
                            'status': 'unhealthy',
                            'response_time_ms': round(response_time, 2),
                            'error': f'HTTP {response.status}',
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
        except Exception as e:
            return {
                'service': 'Frontend (Angular)',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource utilization"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Determine overall status
            status = 'healthy'
            alerts = []
            
            if cpu_percent > self.alert_thresholds['cpu_percent']:
                status = 'warning'
                alerts.append(f'High CPU usage: {cpu_percent}%')
            
            if memory.percent > self.alert_thresholds['memory_percent']:
                status = 'warning'
                alerts.append(f'High memory usage: {memory.percent}%')
            
            if disk.percent > self.alert_thresholds['disk_percent']:
                status = 'critical'
                alerts.append(f'High disk usage: {disk.percent}%')
            
            return {
                'service': 'System Resources',
                'status': status,
                'details': {
                    'cpu_percent': round(cpu_percent, 2),
                    'memory_percent': round(memory.percent, 2),
                    'memory_available_gb': round(memory.available / (1024**3), 2),
                    'disk_percent': round(disk.percent, 2),
                    'disk_free_gb': round(disk.free / (1024**3), 2)
                },
                'alerts': alerts,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                'service': 'System Resources',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks and compile results"""
        logger.info("Starting comprehensive health check for Rick Jefferson Solutions platform")
        
        # Run async checks concurrently
        async_checks = await asyncio.gather(
            self.check_api_health(),
            self.check_database_health(),
            self.check_stripe_integration(),
            self.check_auth_system(),
            self.check_frontend_health(),
            return_exceptions=True
        )
        
        # Run sync checks
        system_check = self.check_system_resources()
        
        # Compile all results
        all_checks = list(async_checks) + [system_check]
        
        # Calculate overall health
        healthy_count = sum(1 for check in all_checks if isinstance(check, dict) and check.get('status') == 'healthy')
        total_checks = len(all_checks)
        health_percentage = (healthy_count / total_checks) * 100
        
        # Determine overall status
        if health_percentage >= 90:
            overall_status = 'healthy'
        elif health_percentage >= 70:
            overall_status = 'degraded'
        else:
            overall_status = 'unhealthy'
        
        # Compile final report
        report = {
            'platform': 'Rick Jefferson Solutions Credit Repair Platform',
            'overall_status': overall_status,
            'health_percentage': round(health_percentage, 2),
            'checks_passed': healthy_count,
            'total_checks': total_checks,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'checks': all_checks,
            'summary': {
                'api_status': next((c.get('status') for c in all_checks if isinstance(c, dict) and c.get('service') == 'API Health'), 'unknown'),
                'database_status': next((c.get('status') for c in all_checks if isinstance(c, dict) and c.get('service') == 'Database'), 'unknown'),
                'frontend_status': next((c.get('status') for c in all_checks if isinstance(c, dict) and c.get('service') == 'Frontend (Angular)'), 'unknown'),
                'system_status': system_check.get('status', 'unknown')
            }
        }
        
        # Log results
        logger.info(f"Health check completed: {overall_status} ({health_percentage}% healthy)")
        
        return report
    
    def save_report(self, report: Dict[str, Any], filename: Optional[str] = None) -> str:
        """Save health check report to file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"health_report_{timestamp}.json"
        
        filepath = Path(filename)
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Health report saved to {filepath}")
        return str(filepath)

async def main():
    """Main execution function"""
    print("\n" + "="*60)
    print("RICK JEFFERSON SOLUTIONS - PRODUCTION HEALTH MONITOR")
    print("Credit Repair Platform Health Check System")
    print("Contact: info@rickjeffersonsolutions.com")
    print("="*60 + "\n")
    
    monitor = HealthMonitor()
    
    try:
        # Run comprehensive health check
        report = await monitor.run_all_checks()
        
        # Save report
        report_file = monitor.save_report(report)
        
        # Display summary
        print(f"Overall Platform Status: {report['overall_status'].upper()}")
        print(f"Health Percentage: {report['health_percentage']}%")
        print(f"Checks Passed: {report['checks_passed']}/{report['total_checks']}")
        print(f"\nDetailed report saved to: {report_file}")
        
        # Display individual service status
        print("\nService Status Summary:")
        print("-" * 40)
        for check in report['checks']:
            if isinstance(check, dict):
                service = check.get('service', 'Unknown')
                status = check.get('status', 'unknown').upper()
                response_time = check.get('response_time_ms')
                
                status_icon = {
                    'HEALTHY': '✅',
                    'UNHEALTHY': '❌',
                    'WARNING': '⚠️',
                    'ERROR': '🔥',
                    'DEGRADED': '⚠️'
                }.get(status, '❓')
                
                if response_time:
                    print(f"{status_icon} {service}: {status} ({response_time}ms)")
                else:
                    print(f"{status_icon} {service}: {status}")
        
        print("\n" + "="*60)
        print("Rick Jefferson Solutions - Your Credit Freedom Starts Here")
        print("Trusted by NFL & Dallas Cowboys")
        print("="*60)
        
        return report
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        print(f"❌ Health check failed: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(main())