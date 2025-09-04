#!/usr/bin/env python3
"""
Rick Jefferson Solutions - USPS Integration Service (Python)
Production USPS API integration for address verification, pricing, and mailing
Used by client portal and dispute-mail automation

Features:
- Address verification and standardization
- Shipping price calculations
- Service standards lookup
- Label generation and printing
- Package tracking
- Location finder

@author Rick Jefferson Solutions Development Team
@version 1.0.0
@since 2024
"""

import os
import httpx
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import logging
from uuid import uuid4
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class USPSAddress(BaseModel):
    """USPS Address model"""
    streetAddress: str
    secondaryAddress: Optional[str] = None
    cityName: str
    state: str
    zipCode: str
    zipPlus4: Optional[str] = None

class USPSPricingRequest(BaseModel):
    """USPS Pricing request model"""
    originZipCode: str
    destinationZipCode: str
    weight: float  # in ounces
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    mailClass: Optional[str] = "USPS_GROUND_ADVANTAGE"

class USPSLabelRequest(BaseModel):
    """USPS Label creation request model"""
    fromAddress: USPSAddress
    toAddress: USPSAddress
    weight: float
    mailClass: str = "USPS_GROUND_ADVANTAGE"
    specialServices: Optional[List[str]] = None
    customerReference: Optional[str] = None

class USPSDisputeMailRequest(BaseModel):
    """USPS Dispute letter mailing request model"""
    clientId: str
    disputeId: str
    recipientAddress: USPSAddress
    letterType: str
    specialServices: Optional[List[str]] = None

class USPSService:
    """USPS API Integration Service"""
    
    def __init__(self):
        self.consumer_key = os.getenv('USPS_CONSUMER_KEY')
        self.consumer_secret = os.getenv('USPS_CONSUMER_SECRET')
        self.callback_url = os.getenv('USPS_CALLBACK_URL')
        self.base_url = os.getenv('USPS_BASE_URL', 'https://api.usps.com')
        self.environment = os.getenv('USPS_ENVIRONMENT', 'production')
        self.enabled = os.getenv('USPS_ENABLED', 'true').lower() == 'true'
        
        # Token management
        self.access_token = None
        self.token_expires_at = None
        
        if not all([self.consumer_key, self.consumer_secret]):
            logger.warning("USPS credentials not configured. Service will be disabled.")
            self.enabled = False
    
    async def get_access_token(self) -> str:
        """Get or refresh OAuth 2.0 access token"""
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/oauth2/v3/token",
                    data={
                        'grant_type': 'client_credentials',
                        'client_id': self.consumer_key,
                        'client_secret': self.consumer_secret,
                        'scope': 'addresses prices service-standards locations labels tracking'
                    },
                    headers={
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data['access_token']
                    expires_in = token_data.get('expires_in', 3600)
                    self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)  # 5 min buffer
                    
                    logger.info("USPS access token obtained successfully")
                    return self.access_token
                else:
                    logger.error(f"Failed to obtain USPS access token: {response.status_code} - {response.text}")
                    raise Exception(f"USPS authentication failed: {response.status_code}")
                    
        except Exception as error:
            logger.error(f"Error obtaining USPS access token: {str(error)}")
            raise Exception(f"USPS authentication error: {str(error)}")
    
    async def make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict:
        """Make authenticated request to USPS API"""
        if not self.enabled:
            raise Exception("USPS service is disabled")
        
        try:
            token = await self.get_access_token()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-User-Agent': 'Rick Jefferson Solutions Credit Repair Platform'
            }
            
            async with httpx.AsyncClient() as client:
                if method.upper() == 'GET':
                    response = await client.get(f"{self.base_url}{endpoint}", headers=headers)
                elif method.upper() == 'POST':
                    response = await client.post(
                        f"{self.base_url}{endpoint}", 
                        headers=headers, 
                        json=data
                    )
                else:
                    raise Exception(f"Unsupported HTTP method: {method}")
                
                if response.status_code in [200, 201]:
                    return response.json()
                else:
                    logger.error(f"USPS API request failed: {response.status_code} - {response.text}")
                    raise Exception(f"USPS API request failed: {response.status_code}")
                    
        except Exception as error:
            logger.error(f"USPS API request failed: {str(error)}")
            raise Exception(f"USPS API request failed: {str(error)}")
    
    async def verify_address(self, address: USPSAddress) -> Dict:
        """Verify and standardize an address"""
        try:
            address_data = {
                "streetAddress": address.streetAddress,
                "cityName": address.cityName,
                "state": address.state,
                "zipCode": address.zipCode
            }
            
            if address.secondaryAddress:
                address_data["secondaryAddress"] = address.secondaryAddress
            
            result = await self.make_request('/addresses/v3/address', 'POST', address_data)
            
            logger.info(f"Address verification completed for {address.cityName}, {address.state}")
            
            return {
                'success': True,
                'verified': True,
                'standardizedAddress': result.get('address', {}),
                'deliverable': result.get('deliverable', True),
                'suggestions': result.get('suggestions', [])
            }
            
        except Exception as error:
            logger.error(f"Error verifying address: {str(error)}")
            return {
                'success': False,
                'verified': False,
                'error': str(error)
            }
    
    async def get_pricing(self, pricing_request: USPSPricingRequest) -> Dict:
        """Get shipping pricing for different service types"""
        try:
            pricing_data = {
                "originZipCode": pricing_request.originZipCode,
                "destinationZipCode": pricing_request.destinationZipCode,
                "weight": pricing_request.weight,
                "mailClass": pricing_request.mailClass
            }
            
            if pricing_request.length:
                pricing_data["length"] = pricing_request.length
            if pricing_request.width:
                pricing_data["width"] = pricing_request.width
            if pricing_request.height:
                pricing_data["height"] = pricing_request.height
            
            result = await self.make_request('/prices/v3/base-rates/search', 'POST', pricing_data)
            
            logger.info(f"Pricing calculated for {pricing_request.originZipCode} to {pricing_request.destinationZipCode}")
            
            return {
                'success': True,
                'pricing': result.get('rates', []),
                'currency': 'USD'
            }
            
        except Exception as error:
            logger.error(f"Error getting pricing: {str(error)}")
            return {
                'success': False,
                'error': str(error)
            }
    
    async def get_service_standards(self, origin_zip: str, destination_zip: str, mail_class: str = 'USPS_GROUND_ADVANTAGE') -> Dict:
        """Get service standards and delivery timeframes"""
        try:
            standards_data = {
                "originZipCode": origin_zip,
                "destinationZipCode": destination_zip,
                "mailClass": mail_class
            }
            
            result = await self.make_request('/service-standards/v3/estimates', 'POST', standards_data)
            
            logger.info(f"Service standards retrieved for {origin_zip} to {destination_zip}")
            
            return {
                'success': True,
                'serviceStandards': result.get('serviceStandards', {}),
                'deliveryDays': result.get('deliveryDays', 'Unknown')
            }
            
        except Exception as error:
            logger.error(f"Error getting service standards: {str(error)}")
            return {
                'success': False,
                'error': str(error)
            }
    
    async def find_locations(self, zip_code: str, radius: int = 10) -> Dict:
        """Find USPS locations near a ZIP code"""
        try:
            result = await self.make_request(f'/locations/v3/post-offices?zipCode={zip_code}&radius={radius}')
            
            logger.info(f"Locations found near {zip_code}")
            
            return {
                'success': True,
                'locations': result.get('locations', []),
                'searchRadius': radius
            }
            
        except Exception as error:
            logger.error(f"Error finding locations: {str(error)}")
            return {
                'success': False,
                'error': str(error)
            }
    
    async def create_label(self, label_request: USPSLabelRequest) -> Dict:
        """Create shipping label with tracking"""
        try:
            label_data = {
                "fromAddress": label_request.fromAddress.dict(),
                "toAddress": label_request.toAddress.dict(),
                "weight": label_request.weight,
                "mailClass": label_request.mailClass,
                "processingCategory": "MACHINABLE",
                "rateIndicator": "SP",
                "destinationEntryFacilityType": "NONE",
                "labelFormat": "PDF"
            }
            
            if label_request.specialServices:
                label_data["specialServices"] = label_request.specialServices
            
            if label_request.customerReference:
                label_data["customerReference"] = label_request.customerReference
            
            result = await self.make_request('/labels/v3/label', 'POST', label_data)
            
            tracking_number = result.get('trackingNumber')
            logger.info(f"Shipping label created with tracking number: {tracking_number}")
            
            return {
                'success': True,
                'trackingNumber': tracking_number,
                'labelUrl': result.get('labelUrl'),
                'labelFormat': 'PDF',
                'postage': result.get('postage'),
                'customerReference': label_request.customerReference
            }
            
        except Exception as error:
            logger.error(f"Error creating shipping label: {str(error)}")
            return {
                'success': False,
                'error': str(error),
                'trackingNumber': None
            }
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a package using tracking number"""
        try:
            result = await self.make_request(f'/tracking/v3/tracking/{tracking_number}')
            
            logger.info(f"Package tracking retrieved for {tracking_number}")
            
            return {
                'success': True,
                'trackingNumber': tracking_number,
                'status': result.get('status'),
                'trackingEvents': result.get('trackingEvents', []),
                'deliveryDate': result.get('deliveryDate'),
                'lastUpdate': datetime.now().isoformat()
            }
            
        except Exception as error:
            logger.error(f"Error tracking package: {str(error)}")
            return {
                'success': False,
                'error': str(error)
            }
    
    async def send_dispute_letter(self, dispute_request: USPSDisputeMailRequest) -> Dict:
        """Send dispute letter via USPS with tracking"""
        try:
            # Rick Jefferson Solutions HQ address
            from_address = USPSAddress(
                streetAddress="5700 W Plano Pkwy",
                secondaryAddress="Suite 3600",
                cityName="Frisco",
                state="TX",
                zipCode="75093"
            )
            
            # Create label request
            label_request = USPSLabelRequest(
                fromAddress=from_address,
                toAddress=dispute_request.recipientAddress,
                weight=1.0,  # Standard letter weight
                mailClass="FIRST_CLASS_MAIL",
                specialServices=dispute_request.specialServices or ["CERTIFIED_MAIL", "RETURN_RECEIPT"],
                customerReference=f"RJS-{dispute_request.clientId}-{dispute_request.disputeId}"
            )
            
            # Create the shipping label
            label_result = await self.create_label(label_request)
            
            if label_result['success']:
                # Log the dispute mailing
                logger.info(f"Dispute letter mailed for client {dispute_request.clientId}, dispute {dispute_request.disputeId}")
                
                return {
                    'success': True,
                    'trackingNumber': label_result['trackingNumber'],
                    'labelUrl': label_result['labelUrl'],
                    'letterType': dispute_request.letterType,
                    'clientId': dispute_request.clientId,
                    'disputeId': dispute_request.disputeId,
                    'mailedAt': datetime.now().isoformat(),
                    'specialServices': dispute_request.specialServices or ["CERTIFIED_MAIL", "RETURN_RECEIPT"]
                }
            else:
                return label_result
                
        except Exception as error:
            logger.error(f"Error sending dispute letter: {str(error)}")
            return {
                'success': False,
                'error': str(error)
            }
    
    async def health_check(self) -> Dict:
        """Check USPS service health"""
        try:
            if not self.enabled:
                return {
                    'healthy': False,
                    'message': 'USPS service is disabled',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Test authentication
            token = await self.get_access_token()
            
            return {
                'healthy': True,
                'message': 'USPS service is operational',
                'authenticated': bool(token),
                'environment': self.environment,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as error:
            logger.error(f"USPS health check failed: {str(error)}")
            return {
                'healthy': False,
                'message': f'USPS service error: {str(error)}',
                'timestamp': datetime.now().isoformat()
            }

# Create singleton instance
usps_service = USPSService()