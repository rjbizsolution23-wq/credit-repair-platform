#!/usr/bin/env python3
"""
Rick Jefferson Solutions - Client Portal Test Suite
Testing complete client portal functionality including authentication,
client management, dispute tracking, and portal features.
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List

class ClientPortalTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.test_user = None
        self.test_client_id = None
        self.test_dispute_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        result = {
            "test_name": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def setup_authentication(self):
        """Setup authentication for portal testing"""
        print("\n🔐 Setting up portal authentication...")
        
        # Register test user
        test_email = f"portal_test_{uuid.uuid4().hex[:8]}@rickjeffersonsolutions.com"
        user_data = {
            "email": test_email,
            "password": "SecurePortalTest123!",
            "first_name": "Portal",
            "last_name": "Tester",
            "role": "client"
        }
        
        try:
            # Register user
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/register",
                json=user_data
            )
            
            if response.status_code == 201:
                self.test_user = response.json()
                
                # Login to get token
                login_response = self.session.post(
                    f"{self.base_url}/api/v1/auth/login",
                    json={"email": test_email, "password": user_data["password"]}
                )
                
                if login_response.status_code == 200:
                    token_data = login_response.json()
                    self.auth_token = token_data["access_token"]
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    self.log_test("Portal Authentication Setup", True, f"User registered and authenticated: {test_email}")
                    return True
                else:
                    self.log_test("Portal Authentication Setup", False, f"Login failed: {login_response.status_code}")
                    return False
            else:
                self.log_test("Portal Authentication Setup", False, f"Registration failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Portal Authentication Setup", False, f"Exception: {str(e)}")
            return False
    
    def test_user_profile_management(self):
        """Test user profile management features"""
        print("\n👤 Testing user profile management...")
        
        try:
            # Get current user profile
            response = self.session.get(f"{self.base_url}/api/v1/auth/me")
            
            if response.status_code == 200:
                profile = response.json()
                required_fields = ["id", "email", "first_name", "last_name", "role"]
                
                if all(field in profile for field in required_fields):
                    self.log_test("User Profile Retrieval", True, f"Profile loaded for {profile['first_name']} {profile['last_name']}")
                    return True
                else:
                    missing_fields = [f for f in required_fields if f not in profile]
                    self.log_test("User Profile Retrieval", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("User Profile Retrieval", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Profile Retrieval", False, f"Exception: {str(e)}")
            return False
    
    def test_client_creation_and_management(self):
        """Test client creation and management"""
        print("\n👥 Testing client creation and management...")
        
        try:
            # Create a test client
            client_data = {
                "first_name": "John",
                "last_name": "Portal",
                "email": f"john.portal.{uuid.uuid4().hex[:6]}@example.com",
                "phone": "+1-555-0123",
                "credit_score": 580
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/clients",
                json=client_data
            )
            
            if response.status_code == 201:
                client = response.json()
                self.test_client_id = client["id"]
                
                # Verify client retrieval
                get_response = self.session.get(f"{self.base_url}/api/v1/clients/{self.test_client_id}")
                
                if get_response.status_code == 200:
                    retrieved_client = get_response.json()
                    self.log_test("Client Management", True, f"Created and retrieved client: {retrieved_client['first_name']} {retrieved_client['last_name']}")
                    return True
                else:
                    self.log_test("Client Management", False, f"Client retrieval failed: {get_response.status_code}")
                    return False
            else:
                self.log_test("Client Management", False, f"Client creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Client Management", False, f"Exception: {str(e)}")
            return False
    
    def test_dispute_tracking(self):
        """Test dispute creation and tracking"""
        print("\n⚖️ Testing dispute tracking...")
        
        if not self.test_client_id:
            self.log_test("Dispute Tracking", False, "No client ID available")
            return False
        
        try:
            # Create a test dispute
            dispute_data = {
                "client_id": self.test_client_id,
                "creditor_name": "Portal Test Bank",
                "account_number": "XXXX5678",
                "dispute_reason": "Account not mine - testing portal",
                "amount": 2500.00
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/disputes",
                json=dispute_data
            )
            
            if response.status_code == 201:
                dispute = response.json()
                self.test_dispute_id = dispute["id"]
                
                # Test client disputes retrieval
                client_disputes_response = self.session.get(
                    f"{self.base_url}/api/v1/clients/{self.test_client_id}/disputes"
                )
                
                if client_disputes_response.status_code == 200:
                    disputes = client_disputes_response.json()
                    dispute_count = len(disputes)
                    self.log_test("Dispute Tracking", True, f"Created dispute and retrieved {dispute_count} client disputes")
                    return True
                else:
                    self.log_test("Dispute Tracking", False, f"Client disputes retrieval failed: {client_disputes_response.status_code}")
                    return False
            else:
                self.log_test("Dispute Tracking", False, f"Dispute creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Dispute Tracking", False, f"Exception: {str(e)}")
            return False
    
    def test_enforcement_stages(self):
        """Test 10 Step Total Enforcement Chain™ information"""
        print("\n🔗 Testing 10 Step Total Enforcement Chain™...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/v1/enforcement-stages")
            
            if response.status_code == 200:
                stages = response.json()
                
                if len(stages) == 10:
                    required_fields = ["step", "name", "description"]
                    valid_stages = all(
                        all(field in stage for field in required_fields)
                        for stage in stages
                    )
                    
                    if valid_stages:
                        self.log_test("10 Step Enforcement Chain", True, f"Retrieved all {len(stages)} enforcement stages")
                        return True
                    else:
                        self.log_test("10 Step Enforcement Chain", False, "Invalid stage structure")
                        return False
                else:
                    self.log_test("10 Step Enforcement Chain", False, f"Expected 10 stages, got {len(stages)}")
                    return False
            else:
                self.log_test("10 Step Enforcement Chain", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("10 Step Enforcement Chain", False, f"Exception: {str(e)}")
            return False
    
    def test_platform_statistics(self):
        """Test platform statistics for portal dashboard"""
        print("\n📊 Testing platform statistics...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/v1/stats")
            
            if response.status_code == 200:
                stats = response.json()
                required_stats = [
                    "total_clients", "total_disputes", "lives_transformed",
                    "homeowners_created", "people_educated", "success_rate", "trusted_by"
                ]
                
                if all(stat in stats for stat in required_stats):
                    self.log_test("Platform Statistics", True, f"Retrieved all platform stats: {stats['lives_transformed']} lives transformed")
                    return True
                else:
                    missing_stats = [s for s in required_stats if s not in stats]
                    self.log_test("Platform Statistics", False, f"Missing stats: {missing_stats}")
                    return False
            else:
                self.log_test("Platform Statistics", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Platform Statistics", False, f"Exception: {str(e)}")
            return False
    
    def test_authentication_security(self):
        """Test authentication security features"""
        print("\n🔒 Testing authentication security...")
        
        try:
            # Test logout functionality
            logout_response = self.session.post(f"{self.base_url}/api/v1/auth/logout")
            
            if logout_response.status_code == 200:
                # Try to access protected endpoint after logout
                test_response = self.session.get(f"{self.base_url}/api/v1/auth/me")
                
                if test_response.status_code in [401, 403]:
                    self.log_test("Authentication Security", True, "Logout successful, token invalidated")
                    return True
                else:
                    self.log_test("Authentication Security", False, f"Token still valid after logout: {test_response.status_code}")
                    return False
            else:
                self.log_test("Authentication Security", False, f"Logout failed: {logout_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Security", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all client portal tests"""
        print("🚀 Rick Jefferson Solutions - Client Portal Test Suite")
        print("=" * 60)
        print(f"Testing API at: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        tests = [
            self.setup_authentication,
            self.test_user_profile_management,
            self.test_client_creation_and_management,
            self.test_dispute_tracking,
            self.test_enforcement_stages,
            self.test_platform_statistics,
            self.test_authentication_security
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
        
        # Generate summary
        success_rate = (passed_tests / total_tests) * 100
        
        print("\n📋 Client Portal Test Summary")
        print("=" * 40)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Save detailed results
        results_summary = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": total_tests - passed_tests,
                "success_rate": success_rate,
                "timestamp": datetime.now().isoformat()
            },
            "test_results": self.test_results
        }
        
        with open("client_portal_test_results.json", "w") as f:
            json.dump(results_summary, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: client_portal_test_results.json")
        
        if passed_tests == total_tests:
            print("\n🎉 All tests passed! Client portal is ready.")
        else:
            print("\n⚠️ Some issues found. Review failed tests.")
        
        return success_rate

if __name__ == "__main__":
    tester = ClientPortalTester()
    tester.run_all_tests()