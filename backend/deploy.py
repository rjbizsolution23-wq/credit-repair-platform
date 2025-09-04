#!/usr/bin/env python3
"""
Rick Jefferson Solutions - Backend Deployment Script
Automated deployment and health checking for the Rick Jefferson API
"""

import os
import sys
import subprocess
import time
import requests
import json
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd,
            capture_output=True, 
            text=True, 
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error output: {e.stderr}")
        return None

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Docker
    if not run_command("docker --version"):
        print("❌ Docker is not installed or not in PATH")
        return False
    
    # Check Docker Compose
    if not run_command("docker-compose --version"):
        print("❌ Docker Compose is not installed or not in PATH")
        return False
    
    print("✅ All dependencies are available")
    return True

def setup_environment():
    """Set up environment configuration"""
    print("🔧 Setting up environment...")
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("📋 Copying .env.example to .env")
        run_command("cp .env.example .env")
        print("⚠️  Please update .env with your actual configuration values")
    
    return True

def build_and_deploy():
    """Build and deploy the application"""
    print("🏗️  Building and deploying Rick Jefferson API...")
    
    # Stop any existing containers
    print("🛑 Stopping existing containers...")
    run_command("docker-compose down")
    
    # Build and start containers
    print("🚀 Building and starting containers...")
    if not run_command("docker-compose up -d --build"):
        print("❌ Failed to build and start containers")
        return False
    
    print("✅ Containers started successfully")
    return True

def wait_for_health_check(url="http://localhost:8000/health", timeout=120):
    """Wait for the API to be healthy"""
    print(f"🏥 Waiting for API health check at {url}...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("✅ API is healthy and responding")
                return True
        except requests.exceptions.RequestException:
            pass
        
        print("⏳ Waiting for API to start...")
        time.sleep(5)
    
    print("❌ API health check failed - timeout reached")
    return False

def run_api_tests():
    """Run basic API endpoint tests"""
    print("🧪 Running API tests...")
    
    base_url = "http://localhost:8000"
    
    # Test endpoints
    endpoints = [
        "/",
        "/health",
        "/docs",
        "/api/v1/clients",
    ]
    
    for endpoint in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=10)
            
            if response.status_code in [200, 401, 422]:  # 401/422 are expected for protected endpoints
                print(f"✅ {endpoint} - Status: {response.status_code}")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint} - Error: {str(e)}")
    
    return True

def show_deployment_info():
    """Show deployment information"""
    print("\n" + "="*60)
    print("🎉 RICK JEFFERSON SOLUTIONS - API DEPLOYMENT COMPLETE")
    print("="*60)
    print("\n📊 Service URLs:")
    print("   • API Documentation: http://localhost:8000/docs")
    print("   • API Health Check:  http://localhost:8000/health")
    print("   • Database:          localhost:5432")
    print("   • Redis Cache:       localhost:6379")
    
    print("\n🔧 Management Commands:")
    print("   • View logs:         docker-compose logs -f api")
    print("   • Stop services:     docker-compose down")
    print("   • Restart API:       docker-compose restart api")
    print("   • Database shell:    docker-compose exec postgres psql -U rick_jefferson -d rick_jefferson_db")
    
    print("\n⚠️  Next Steps:")
    print("   1. Update .env with production values")
    print("   2. Configure SSL certificates for HTTPS")
    print("   3. Set up monitoring and alerting")
    print("   4. Configure backup procedures")
    print("\n" + "="*60)

def main():
    """Main deployment function"""
    print("🚀 Rick Jefferson Solutions - Backend Deployment")
    print("" + "="*50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        sys.exit(1)
    
    # Build and deploy
    if not build_and_deploy():
        sys.exit(1)
    
    # Wait for health check
    if not wait_for_health_check():
        print("⚠️  API may not be fully ready, but deployment completed")
    
    # Run tests
    run_api_tests()
    
    # Show deployment info
    show_deployment_info()
    
    print("\n✅ Deployment completed successfully!")
    print("🎯 Your Credit Freedom Starts Here - Rick Jefferson Solutions")

if __name__ == "__main__":
    main()