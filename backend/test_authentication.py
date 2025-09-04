#!/usr/bin/env python3
"""
Rick Jefferson Solutions - Authentication System Test Suite
Tests all authentication endpoints and flows
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any

class AuthenticationTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.access_token = None
        self.test_user_email = "test@rickjeffersonsolutions.com"
        self.test_user_password = "SecurePassword123!"
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_auth_health_check(self):
        """Test authentication system health"""
        try:
            response = self.session.get(f"{self.base_url}/api/v1/auth/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("healthy") is True:
                    self.log_test(
                        "Authentication Health Check", 
                        True, 
                        f"System healthy, {data.get('registered_users', 0)} users registered",
                        data
                    )
                else:
                    self.log_test("Authentication Health Check", False, "System reports unhealthy", data)
            else:
                self.log_test("Authentication Health Check", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Authentication Health Check", False, f"Exception: {str(e)}")
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            user_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "first_name": "Rick",
                "last_name": "Jefferson",
                "role": "admin"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/register",
                json=user_data
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("email") == self.test_user_email:
                    self.log_test(
                        "User Registration", 
                        True, 
                        f"User registered successfully with ID: {data.get('id')}",
                        data
                    )
                else:
                    self.log_test("User Registration", False, "Invalid response data", data)
            else:
                self.log_test("User Registration", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/login",
                json=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.log_test(
                        "User Login", 
                        True, 
                        f"Login successful, token expires in {data.get('expires_in')} seconds",
                        {"user": data["user"], "token_type": data["token_type"]}
                    )
                else:
                    self.log_test("User Login", False, "Missing token or user data", data)
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
    
    def test_protected_route_access(self):
        """Test accessing protected route with valid token"""
        try:
            if not self.access_token:
                self.log_test("Protected Route Access", False, "No access token available")
                return
                
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(
                f"{self.base_url}/api/v1/auth/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("email") == self.test_user_email:
                    self.log_test(
                        "Protected Route Access", 
                        True, 
                        f"Successfully accessed user profile for {data.get('email')}",
                        data
                    )
                else:
                    self.log_test("Protected Route Access", False, "Invalid user data returned", data)
            else:
                self.log_test("Protected Route Access", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Protected Route Access", False, f"Exception: {str(e)}")
    
    def test_unauthorized_access(self):
        """Test accessing protected route without token"""
        try:
            response = self.session.get(f"{self.base_url}/api/v1/auth/me")
            
            if response.status_code == 401:
                self.log_test(
                    "Unauthorized Access Protection", 
                    True, 
                    "Correctly blocked unauthorized access",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
            else:
                self.log_test("Unauthorized Access Protection", False, f"Expected 401, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Unauthorized Access Protection", False, f"Exception: {str(e)}")
    
    def test_invalid_token_access(self):
        """Test accessing protected route with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_12345"}
            response = self.session.get(
                f"{self.base_url}/api/v1/auth/me",
                headers=headers
            )
            
            if response.status_code == 401:
                self.log_test(
                    "Invalid Token Protection", 
                    True, 
                    "Correctly rejected invalid token",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
            else:
                self.log_test("Invalid Token Protection", False, f"Expected 401, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Invalid Token Protection", False, f"Exception: {str(e)}")
    
    def test_user_logout(self):
        """Test user logout endpoint"""
        try:
            if not self.access_token:
                self.log_test("User Logout", False, "No access token available")
                return
                
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/logout",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "User Logout", 
                    True, 
                    "Successfully logged out",
                    data
                )
            else:
                self.log_test("User Logout", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("User Logout", False, f"Exception: {str(e)}")
    
    def test_blacklisted_token_access(self):
        """Test accessing protected route with blacklisted token"""
        try:
            if not self.access_token:
                self.log_test("Blacklisted Token Protection", False, "No access token available")
                return
                
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = self.session.get(
                f"{self.base_url}/api/v1/auth/me",
                headers=headers
            )
            
            if response.status_code == 401:
                self.log_test(
                    "Blacklisted Token Protection", 
                    True, 
                    "Correctly rejected blacklisted token",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
            else:
                self.log_test("Blacklisted Token Protection", False, f"Expected 401, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Blacklisted Token Protection", False, f"Exception: {str(e)}")
    
    def test_duplicate_registration(self):
        """Test duplicate user registration"""
        try:
            user_data = {
                "email": self.test_user_email,
                "password": "AnotherPassword123!",
                "first_name": "Test",
                "last_name": "User",
                "role": "client"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/register",
                json=user_data
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Duplicate Registration Protection", 
                    True, 
                    "Correctly prevented duplicate email registration",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
            else:
                self.log_test("Duplicate Registration Protection", False, f"Expected 400, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Duplicate Registration Protection", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("\n🔐 Rick Jefferson Solutions - Authentication System Test Suite")
        print("=" * 70)
        print(f"Testing against: {self.base_url}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Test sequence
        self.test_auth_health_check()
        self.test_unauthorized_access()
        self.test_invalid_token_access()
        self.test_user_registration()
        self.test_duplicate_registration()
        self.test_user_login()
        self.test_protected_route_access()
        self.test_user_logout()
        self.test_blacklisted_token_access()
        
        # Summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Save detailed results
        with open("authentication_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "failed_tests": failed_tests,
                    "success_rate": success_rate,
                    "test_timestamp": datetime.now().isoformat()
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: authentication_test_results.json")
        
        return success_rate >= 80  # Consider 80%+ success rate as passing

if __name__ == "__main__":
    tester = AuthenticationTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)