#!/usr/bin/env python3
"""
Rick Jefferson Solutions - Production Monitoring System Test
Comprehensive test suite for monitoring and health check systems

Author: Rick Jefferson Architect
Company: Rick Jefferson Solutions
Contact: info@rickjeffersonsolutions.com
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any

# Add monitoring directory to path
sys.path.append(str(Path(__file__).parent / 'monitoring'))

try:
    from monitoring.health_checks import HealthMonitor
    from monitoring.dashboard import MonitoringDashboard
except ImportError:
    print("Warning: Monitoring modules not found. Testing basic functionality only.")
    HealthMonitor = None
    MonitoringDashboard = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MonitoringSystemTest:
    """Comprehensive test suite for monitoring system"""
    
    def __init__(self):
        self.test_results = []
        self.start_time = time.time()
        
    def log_test_result(self, test_name: str, success: bool, details: str = "", error: str = "") -> None:
        """Log test result"""
        result = {
            'test_name': test_name,
            'success': success,
            'details': details,
            'error': error,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} - {test_name}")
        if error:
            logger.error(f"Error: {error}")
    
    def test_monitoring_directory_structure(self) -> bool:
        """Test monitoring directory structure and files"""
        try:
            monitoring_dir = Path(__file__).parent / 'monitoring'
            required_files = [
                'health_checks.py',
                'dashboard.py',
                'requirements.txt',
                '.env.example'
            ]
            
            missing_files = []
            for file in required_files:
                file_path = monitoring_dir / file
                if not file_path.exists():
                    missing_files.append(file)
            
            if missing_files:
                self.log_test_result(
                    "Monitoring Directory Structure",
                    False,
                    error=f"Missing files: {', '.join(missing_files)}"
                )
                return False
            
            self.log_test_result(
                "Monitoring Directory Structure",
                True,
                f"All required files present: {', '.join(required_files)}"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Monitoring Directory Structure",
                False,
                error=str(e)
            )
            return False
    
    def test_environment_configuration(self) -> bool:
        """Test environment configuration"""
        try:
            env_example = Path(__file__).parent / 'monitoring' / '.env.example'
            
            if not env_example.exists():
                self.log_test_result(
                    "Environment Configuration",
                    False,
                    error=".env.example file not found"
                )
                return False
            
            # Read and validate environment variables
            with open(env_example, 'r') as f:
                env_content = f.read()
            
            required_vars = [
                'API_BASE_URL',
                'FRONTEND_URL',
                'ALERT_EMAIL_ENABLED',
                'SMTP_SERVER',
                'ALERT_RECIPIENTS'
            ]
            
            missing_vars = []
            for var in required_vars:
                if var not in env_content:
                    missing_vars.append(var)
            
            if missing_vars:
                self.log_test_result(
                    "Environment Configuration",
                    False,
                    error=f"Missing environment variables: {', '.join(missing_vars)}"
                )
                return False
            
            self.log_test_result(
                "Environment Configuration",
                True,
                f"All required environment variables present: {', '.join(required_vars)}"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Environment Configuration",
                False,
                error=str(e)
            )
            return False
    
    async def test_health_monitor_initialization(self) -> bool:
        """Test health monitor initialization"""
        try:
            if HealthMonitor is None:
                self.log_test_result(
                    "Health Monitor Initialization",
                    False,
                    error="HealthMonitor class not available"
                )
                return False
            
            monitor = HealthMonitor()
            
            # Check if monitor has required attributes
            required_attrs = ['base_url', 'frontend_url', 'alert_thresholds']
            missing_attrs = []
            
            for attr in required_attrs:
                if not hasattr(monitor, attr):
                    missing_attrs.append(attr)
            
            if missing_attrs:
                self.log_test_result(
                    "Health Monitor Initialization",
                    False,
                    error=f"Missing attributes: {', '.join(missing_attrs)}"
                )
                return False
            
            self.log_test_result(
                "Health Monitor Initialization",
                True,
                f"Monitor initialized with base_url: {monitor.base_url}"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Health Monitor Initialization",
                False,
                error=str(e)
            )
            return False
    
    async def test_health_checks_execution(self) -> bool:
        """Test health checks execution"""
        try:
            if HealthMonitor is None:
                self.log_test_result(
                    "Health Checks Execution",
                    False,
                    error="HealthMonitor class not available"
                )
                return False
            
            monitor = HealthMonitor()
            
            # Run health checks
            health_report = await monitor.run_all_checks()
            
            if not health_report:
                self.log_test_result(
                    "Health Checks Execution",
                    False,
                    error="Health check returned empty result"
                )
                return False
            
            # Validate health report structure
            required_fields = [
                'platform',
                'overall_status',
                'health_percentage',
                'checks_passed',
                'total_checks',
                'timestamp',
                'checks'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in health_report:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test_result(
                    "Health Checks Execution",
                    False,
                    error=f"Missing fields in health report: {', '.join(missing_fields)}"
                )
                return False
            
            self.log_test_result(
                "Health Checks Execution",
                True,
                f"Health checks completed - Status: {health_report['overall_status']}, "
                f"Health: {health_report['health_percentage']}%, "
                f"Checks: {health_report['checks_passed']}/{health_report['total_checks']}"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Health Checks Execution",
                False,
                error=str(e)
            )
            return False
    
    async def test_dashboard_generation(self) -> bool:
        """Test dashboard generation"""
        try:
            if MonitoringDashboard is None:
                self.log_test_result(
                    "Dashboard Generation",
                    False,
                    error="MonitoringDashboard class not available"
                )
                return False
            
            dashboard = MonitoringDashboard()
            
            # Create mock health report
            mock_health_report = {
                'platform': 'Rick Jefferson Solutions Credit Repair Platform',
                'overall_status': 'healthy',
                'health_percentage': 95.0,
                'checks_passed': 6,
                'total_checks': 6,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'checks': [
                    {
                        'service': 'API Health',
                        'status': 'healthy',
                        'response_time_ms': 150.5,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    },
                    {
                        'service': 'Database',
                        'status': 'healthy',
                        'response_time_ms': 75.2,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                ]
            }
            
            # Generate dashboard HTML
            html_content = dashboard.generate_dashboard_html(mock_health_report)
            
            if not html_content or len(html_content) < 1000:
                self.log_test_result(
                    "Dashboard Generation",
                    False,
                    error="Generated HTML content is too short or empty"
                )
                return False
            
            # Check for required HTML elements
            required_elements = [
                'RICK JEFFERSON SOLUTIONS',
                'Production Monitoring Dashboard',
                'Platform Health Score',
                'Your Credit Freedom Starts Here'
            ]
            
            missing_elements = []
            for element in required_elements:
                if element not in html_content:
                    missing_elements.append(element)
            
            if missing_elements:
                self.log_test_result(
                    "Dashboard Generation",
                    False,
                    error=f"Missing HTML elements: {', '.join(missing_elements)}"
                )
                return False
            
            # Save dashboard for testing
            dashboard_file = dashboard.save_dashboard(mock_health_report)
            
            self.log_test_result(
                "Dashboard Generation",
                True,
                f"Dashboard HTML generated successfully ({len(html_content)} chars), saved to {dashboard_file}"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Dashboard Generation",
                False,
                error=str(e)
            )
            return False
    
    def test_alert_configuration(self) -> bool:
        """Test alert configuration"""
        try:
            if MonitoringDashboard is None:
                self.log_test_result(
                    "Alert Configuration",
                    False,
                    error="MonitoringDashboard class not available"
                )
                return False
            
            dashboard = MonitoringDashboard()
            
            # Check alert configuration
            alert_config = dashboard.alert_config
            
            required_config = [
                'email_enabled',
                'smtp_server',
                'smtp_port',
                'alert_recipients',
                'alert_cooldown_minutes'
            ]
            
            missing_config = []
            for config in required_config:
                if config not in alert_config:
                    missing_config.append(config)
            
            if missing_config:
                self.log_test_result(
                    "Alert Configuration",
                    False,
                    error=f"Missing alert configuration: {', '.join(missing_config)}"
                )
                return False
            
            # Test alert cooldown logic
            service_name = "Test Service"
            status = "unhealthy"
            
            # First alert should be sent
            should_send_1 = dashboard.should_send_alert(service_name, status)
            
            # Second alert immediately should not be sent (cooldown)
            should_send_2 = dashboard.should_send_alert(service_name, status)
            
            if not should_send_1 or should_send_2:
                self.log_test_result(
                    "Alert Configuration",
                    False,
                    error=f"Alert cooldown logic failed: first={should_send_1}, second={should_send_2}"
                )
                return False
            
            self.log_test_result(
                "Alert Configuration",
                True,
                f"Alert configuration valid, cooldown logic working correctly"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Alert Configuration",
                False,
                error=str(e)
            )
            return False
    
    def test_report_generation(self) -> bool:
        """Test report generation and file operations"""
        try:
            if HealthMonitor is None:
                self.log_test_result(
                    "Report Generation",
                    False,
                    error="HealthMonitor class not available"
                )
                return False
            
            monitor = HealthMonitor()
            
            # Create mock report
            mock_report = {
                'platform': 'Rick Jefferson Solutions Credit Repair Platform',
                'overall_status': 'healthy',
                'health_percentage': 100.0,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'test': True
            }
            
            # Save report
            report_file = monitor.save_report(mock_report, 'test_monitoring_report.json')
            
            # Verify file was created
            report_path = Path(report_file)
            if not report_path.exists():
                self.log_test_result(
                    "Report Generation",
                    False,
                    error=f"Report file not created: {report_file}"
                )
                return False
            
            # Verify file content
            with open(report_path, 'r') as f:
                saved_report = json.load(f)
            
            if saved_report != mock_report:
                self.log_test_result(
                    "Report Generation",
                    False,
                    error="Saved report content doesn't match original"
                )
                return False
            
            # Clean up test file
            report_path.unlink()
            
            self.log_test_result(
                "Report Generation",
                True,
                f"Report generated and saved successfully to {report_file}"
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Report Generation",
                False,
                error=str(e)
            )
            return False
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all monitoring system tests"""
        logger.info("Starting comprehensive monitoring system tests")
        
        # Run all tests
        tests = [
            ('Directory Structure', self.test_monitoring_directory_structure),
            ('Environment Config', self.test_environment_configuration),
            ('Health Monitor Init', self.test_health_monitor_initialization),
            ('Health Checks', self.test_health_checks_execution),
            ('Dashboard Generation', self.test_dashboard_generation),
            ('Alert Configuration', self.test_alert_configuration),
            ('Report Generation', self.test_report_generation)
        ]
        
        for test_name, test_func in tests:
            try:
                if asyncio.iscoroutinefunction(test_func):
                    await test_func()
                else:
                    test_func()
            except Exception as e:
                self.log_test_result(test_name, False, error=str(e))
        
        # Calculate results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Compile final report
        test_report = {
            'test_suite': 'Rick Jefferson Solutions - Monitoring System Test',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'duration_seconds': round(time.time() - self.start_time, 2),
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': total_tests - passed_tests,
            'success_rate_percent': round(success_rate, 2),
            'overall_status': 'PASS' if success_rate >= 80 else 'FAIL',
            'test_results': self.test_results,
            'platform_info': {
                'python_version': sys.version,
                'operating_system': os.name,
                'working_directory': str(Path.cwd())
            }
        }
        
        # Save test report
        report_file = f"monitoring_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(test_report, f, indent=2)
        
        logger.info(f"Monitoring system tests completed: {success_rate}% success rate")
        logger.info(f"Test report saved to: {report_file}")
        
        return test_report

async def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("RICK JEFFERSON SOLUTIONS - MONITORING SYSTEM TEST")
    print("Comprehensive Test Suite for Production Monitoring")
    print("Contact: info@rickjeffersonsolutions.com")
    print("="*70 + "\n")
    
    tester = MonitoringSystemTest()
    
    try:
        # Run all tests
        test_report = await tester.run_all_tests()
        
        # Display results
        print(f"\n📊 TEST RESULTS SUMMARY")
        print("-" * 40)
        print(f"Total Tests: {test_report['total_tests']}")
        print(f"Passed: {test_report['passed_tests']}")
        print(f"Failed: {test_report['failed_tests']}")
        print(f"Success Rate: {test_report['success_rate_percent']}%")
        print(f"Overall Status: {test_report['overall_status']}")
        print(f"Duration: {test_report['duration_seconds']} seconds")
        
        # Display individual test results
        print(f"\n📋 INDIVIDUAL TEST RESULTS")
        print("-" * 40)
        for result in test_report['test_results']:
            status_icon = "✅" if result['success'] else "❌"
            print(f"{status_icon} {result['test_name']}")
            if result['error']:
                print(f"   Error: {result['error']}")
        
        print(f"\n📄 Detailed report saved to: monitoring_test_results_*.json")
        
        print("\n" + "="*70)
        print("Rick Jefferson Solutions - Your Credit Freedom Starts Here")
        print("Trusted by NFL & Dallas Cowboys")
        print("="*70)
        
        return test_report
        
    except Exception as e:
        logger.error(f"Test execution failed: {e}")
        print(f"❌ Test execution failed: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(main())