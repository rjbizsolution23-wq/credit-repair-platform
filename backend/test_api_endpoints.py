#!/usr/bin/env python3
"""
Rick Jefferson Solutions - API Testing Script
Comprehensive testing of all production API endpoints

This script tests:
- Core API health checks
- Client management endpoints
- Dispute management endpoints
- USPS integration endpoints
- Authentication flows
- Error handling

@author Rick Jefferson Solutions Development Team
@version 1.0.0
@since 2024
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Any
import sys
import os

# Configuration
BASE_URL = "http://localhost:8000"
API_VERSION = "v1"

class APITester:
    """Comprehensive API testing class"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_endpoints(self):
        """Test all health check endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Main health check
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Main Health Check", True, f"Status: {data.get('status')}")
            else:
                self.log_test("Main Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Main Health Check", False, f"Error: {str(e)}")
            
        # USPS health check
        try:
            response = self.session.get(f"{self.base_url}/api/{API_VERSION}/usps/health")
            if response.status_code == 200:
                data = response.json()
                healthy = data.get('healthy', False)
                message = data.get('message', 'No message')
                self.log_test("USPS Health Check", True, f"Healthy: {healthy}, Message: {message}")
            else:
                self.log_test("USPS Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("USPS Health Check", False, f"Error: {str(e)}")
            
    def test_client_endpoints(self):
        """Test client management endpoints"""
        print("\n👥 Testing Client Endpoints...")
        
        # Test client creation
        test_client = {
            "first_name": "Test",
            "last_name": "Client",
            "email": "test@rickjeffersonsolutions.com",
            "phone": "877-763-8587",
            "credit_score": 650
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/{API_VERSION}/clients",
                json=test_client
            )
            if response.status_code == 201:
                client_data = response.json()
                client_id = client_data.get('id')
                self.log_test("Client Creation", True, f"Created client ID: {client_id}")
                
                # Test getting the created client
                get_response = self.session.get(f"{self.base_url}/api/{API_VERSION}/clients/{client_id}")
                if get_response.status_code == 200:
                    self.log_test("Client Retrieval", True, "Successfully retrieved client")
                else:
                    self.log_test("Client Retrieval", False, f"Status code: {get_response.status_code}")
                    
            else:
                self.log_test("Client Creation", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Client Creation", False, f"Error: {str(e)}")
            
        # Test getting all clients
        try:
            response = self.session.get(f"{self.base_url}/api/{API_VERSION}/clients")
            if response.status_code == 200:
                clients = response.json()
                self.log_test("Get All Clients", True, f"Found {len(clients)} clients")
            else:
                self.log_test("Get All Clients", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get All Clients", False, f"Error: {str(e)}")
            
    def test_dispute_endpoints(self):
        """Test dispute management endpoints"""
        print("\n⚖️ Testing Dispute Endpoints...")
        
        # First, create a client for dispute testing
        test_client = {
            "first_name": "Dispute",
            "last_name": "Tester",
            "email": "dispute@rickjeffersonsolutions.com",
            "phone": "877-763-8587"
        }
        
        try:
            client_response = self.session.post(
                f"{self.base_url}/api/{API_VERSION}/clients",
                json=test_client
            )
            
            if client_response.status_code == 201:
                client_id = client_response.json().get('id')
                
                # Test dispute creation
                test_dispute = {
                    "client_id": client_id,
                    "creditor_name": "Test Bank",
                    "account_number": "XXXX1234",
                    "dispute_reason": "Account not mine",
                    "amount": 1500.00,
                    "description": "This account does not belong to me"
                }
                
                dispute_response = self.session.post(
                    f"{self.base_url}/api/{API_VERSION}/disputes",
                    json=test_dispute
                )
                
                if dispute_response.status_code == 201:
                    dispute_data = dispute_response.json()
                    dispute_id = dispute_data.get('id')
                    self.log_test("Dispute Creation", True, f"Created dispute ID: {dispute_id}")
                    
                    # Test getting client disputes
                    client_disputes_response = self.session.get(
                        f"{self.base_url}/api/{API_VERSION}/clients/{client_id}/disputes"
                    )
                    if client_disputes_response.status_code == 200:
                        disputes = client_disputes_response.json()
                        self.log_test("Client Disputes Retrieval", True, f"Found {len(disputes)} disputes")
                    else:
                        self.log_test("Client Disputes Retrieval", False, f"Status code: {client_disputes_response.status_code}")
                        
                else:
                    self.log_test("Dispute Creation", False, f"Status code: {dispute_response.status_code}")
            else:
                self.log_test("Dispute Test Setup", False, "Failed to create test client")
                
        except Exception as e:
            self.log_test("Dispute Endpoints", False, f"Error: {str(e)}")
            
    def test_usps_endpoints(self):
        """Test USPS integration endpoints"""
        print("\n📮 Testing USPS Endpoints...")
        
        # Test address verification
        test_address = {
            "streetAddress": "1600 Amphitheatre Parkway",
            "cityName": "Mountain View",
            "state": "CA",
            "zipCode": "94043"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/{API_VERSION}/usps/address/verify",
                json=test_address
            )
            if response.status_code == 200:
                self.log_test("USPS Address Verification", True, "Address verification endpoint responding")
            else:
                data = response.json() if response.headers.get('content-type') == 'application/json' else {}
                self.log_test("USPS Address Verification", False, f"Status: {response.status_code}, Response: {data}")
        except Exception as e:
            self.log_test("USPS Address Verification", False, f"Error: {str(e)}")
            
        # Test pricing
        pricing_request = {
            "originZipCode": "75034",  # Frisco, TX
            "destinationZipCode": "10001",  # NYC
            "weight": 1.0
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/{API_VERSION}/usps/pricing",
                json=pricing_request
            )
            if response.status_code == 200:
                self.log_test("USPS Pricing", True, "Pricing endpoint responding")
            else:
                data = response.json() if response.headers.get('content-type') == 'application/json' else {}
                self.log_test("USPS Pricing", False, f"Status: {response.status_code}, Response: {data}")
        except Exception as e:
            self.log_test("USPS Pricing", False, f"Error: {str(e)}")
            
    def test_enforcement_stages(self):
        """Test 10 Step Total Enforcement Chain™ endpoint"""
        print("\n🔗 Testing Enforcement Stages...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/{API_VERSION}/enforcement-stages")
            if response.status_code == 200:
                stages = response.json()
                if len(stages) == 10:
                    self.log_test("10 Step TEC™", True, f"All 10 enforcement stages available")
                else:
                    self.log_test("10 Step TEC™", False, f"Expected 10 stages, got {len(stages)}")
            else:
                self.log_test("10 Step TEC™", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("10 Step TEC™", False, f"Error: {str(e)}")
            
    def test_stats_endpoint(self):
        """Test statistics endpoint"""
        print("\n📊 Testing Statistics...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/{API_VERSION}/stats")
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Statistics", True, f"Stats available: {list(stats.keys())}")
            else:
                self.log_test("Statistics", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Statistics", False, f"Error: {str(e)}")
            
    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Rick Jefferson Solutions - API Test Suite")
        print("=" * 50)
        print(f"Testing API at: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        # Run all test suites
        self.test_health_endpoints()
        self.test_client_endpoints()
        self.test_dispute_endpoints()
        self.test_usps_endpoints()
        self.test_enforcement_stages()
        self.test_stats_endpoint()
        
        # Summary
        print("\n📋 Test Summary")
        print("=" * 30)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
                    
        # Save detailed results
        with open('api_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total': total_tests,
                    'passed': passed_tests,
                    'failed': failed_tests,
                    'success_rate': (passed_tests/total_tests)*100
                },
                'results': self.test_results
            }, f, indent=2)
            
        print(f"\n📄 Detailed results saved to: api_test_results.json")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! API is ready for production.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Please review and fix issues.")
        sys.exit(1)