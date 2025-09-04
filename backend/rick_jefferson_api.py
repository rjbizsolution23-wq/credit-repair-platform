#!/usr/bin/env python3
"""
Rick Jefferson AI - Supreme Credit Enforcement Chain™ API
Simplified FastAPI backend for credit repair platform
"""

from fastapi import FastAPI, HTTPException, status, Depends, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import json
import os
import jwt
import bcrypt
from dotenv import load_dotenv
from usps_service import usps_service, USPSAddress, USPSPricingRequest, USPSLabelRequest, USPSDisputeMailRequest
import stripe

# Load environment variables from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'rick_jefferson_supreme_secret_2024')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))

# Security
security = HTTPBearer()

# Initialize FastAPI app
app = FastAPI(
    title="Rick Jefferson Solutions - Credit Repair API",
    description="Your Credit Freedom Starts Here - Complete credit repair automation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "https://rickjeffersonsolutions.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    ssn_last_four: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    credit_score: Optional[int] = None

class ClientResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    credit_score: Optional[int]
    status: str
    current_enforcement_stage: Optional[str]
    created_at: datetime
    updated_at: datetime

class DisputeCreate(BaseModel):
    client_id: str
    creditor_name: str
    account_number: str
    dispute_reason: str
    amount: Optional[float] = None
    description: Optional[str] = None

class DisputeResponse(BaseModel):
    id: str
    client_id: str
    creditor_name: str
    account_number: str
    dispute_reason: str
    amount: Optional[float]
    status: str
    ai_success_probability: Optional[float]
    created_at: datetime
    updated_at: datetime

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
    version: str

# Authentication Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: Optional[str] = "client"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

# In-memory storage (replace with database in production)
clients_db = {}
disputes_db = {}
users_db = {}  # For authentication
token_blacklist = set()  # For logout functionality

# Authentication Helper Functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str, role: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "rick-jefferson-solutions",
        "aud": "credit-repair-platform"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """Verify JWT token and return user info"""
    try:
        token = credentials.credentials
        
        # Check if token is blacklisted
        if token in token_blacklist:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )
        
        # Decode and verify token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], audience="credit-repair-platform")
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Check if user exists and is active
        user = users_db.get(user_id)
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

def get_current_user(token_data: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """Get current authenticated user"""
    user_id = token_data.get("user_id")
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def require_role(required_roles: List[str]):
    """Decorator to require specific roles"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if current_user.get("role") not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# USPS Models for API
class AddressVerificationRequest(BaseModel):
    streetAddress: str
    secondaryAddress: Optional[str] = None
    cityName: str
    state: str
    zipCode: str

class PricingRequest(BaseModel):
    originZipCode: str
    destinationZipCode: str
    weight: float
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    mailClass: Optional[str] = "USPS_GROUND_ADVANTAGE"

class LabelCreationRequest(BaseModel):
    fromAddress: USPSAddress
    toAddress: USPSAddress
    weight: float
    mailClass: str = "USPS_GROUND_ADVANTAGE"
    specialServices: Optional[List[str]] = None
    customerReference: Optional[str] = None

class DisputeMailRequest(BaseModel):
    clientId: str
    disputeId: str
    recipientAddress: USPSAddress
    letterType: str
    specialServices: Optional[List[str]] = None

# Stripe Payment Models
class CreateCustomerRequest(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[Dict[str, str]] = None

class CreateSubscriptionRequest(BaseModel):
    customer_id: str
    price_id: str
    payment_method_id: str

class PaymentIntentRequest(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    customer_id: Optional[str] = None
    description: Optional[str] = None

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: str
    amount: int
    interval: str
    features: List[str]
    popular: bool = False

# API Routes
@app.get("/", response_model=Dict[str, str])
async def root():
    """Welcome endpoint"""
    return {
        "message": "Rick Jefferson Solutions - Credit Repair API",
        "tagline": "Your Credit Freedom Starts Here",
        "method": "10 Step Total Enforcement Chain™",
        "contact": "info@rickjeffersonsolutions.com",
        "phone": "877-763-8587",
        "sms": "Text 'credit repair' to 945-308-8003"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="Rick Jefferson Solutions API is running",
        timestamp=datetime.now(),
        version="1.0.0"
    )

# Authentication Endpoints
@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    # Check if user already exists
    for user in users_db.values():
        if user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "password_hash": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    users_db[user_id] = user
    
    return UserResponse(
        id=user_id,
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )

@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login_user(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    # Find user by email
    user = None
    for u in users_db.values():
        if u["email"] == user_credentials.email:
            user = u
            break
    
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Create access token
    access_token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"]
    )
    
    # Update last login
    user["last_login"] = datetime.utcnow()
    user["updated_at"] = datetime.utcnow()
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            role=user["role"],
            is_active=user["is_active"],
            created_at=user["created_at"]
        )
    )

@app.post("/api/v1/auth/logout")
async def logout_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Logout user by blacklisting token"""
    token = credentials.credentials
    token_blacklist.add(token)
    return {"message": "Successfully logged out"}

@app.get("/api/v1/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

@app.get("/api/v1/auth/health")
async def auth_health_check():
    """Authentication system health check"""
    return {
        "healthy": True,
        "message": "Authentication system operational",
        "registered_users": len(users_db),
        "blacklisted_tokens": len(token_blacklist),
        "jwt_algorithm": JWT_ALGORITHM,
        "token_expiration_hours": JWT_EXPIRATION_HOURS
    }



@app.post("/api/v1/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(client: ClientCreate):
    """Create a new client"""
    client_id = str(uuid.uuid4())
    now = datetime.now()
    
    client_data = ClientResponse(
        id=client_id,
        first_name=client.first_name,
        last_name=client.last_name,
        email=client.email,
        phone=client.phone,
        credit_score=client.credit_score,
        status="active",
        current_enforcement_stage="Step 1: Credit Report Analysis",
        created_at=now,
        updated_at=now
    )
    
    clients_db[client_id] = client_data
    return client_data

@app.get("/api/v1/clients", response_model=List[ClientResponse])
async def get_clients():
    """Get all clients"""
    return list(clients_db.values())

@app.get("/api/v1/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str):
    """Get a specific client"""
    if client_id not in clients_db:
        raise HTTPException(status_code=404, detail="Client not found")
    return clients_db[client_id]

@app.post("/api/v1/disputes", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
async def create_dispute(dispute: DisputeCreate):
    """Create a new dispute"""
    if dispute.client_id not in clients_db:
        raise HTTPException(status_code=404, detail="Client not found")
    
    dispute_id = str(uuid.uuid4())
    now = datetime.now()
    
    dispute_data = DisputeResponse(
        id=dispute_id,
        client_id=dispute.client_id,
        creditor_name=dispute.creditor_name,
        account_number=dispute.account_number,
        dispute_reason=dispute.dispute_reason,
        amount=dispute.amount,
        status="pending",
        ai_success_probability=0.85,  # Mock AI prediction
        created_at=now,
        updated_at=now
    )
    
    disputes_db[dispute_id] = dispute_data
    return dispute_data

@app.get("/api/v1/disputes", response_model=List[DisputeResponse])
async def get_disputes():
    """Get all disputes"""
    return list(disputes_db.values())

@app.get("/api/v1/disputes/{dispute_id}", response_model=DisputeResponse)
async def get_dispute(dispute_id: str):
    """Get a specific dispute"""
    if dispute_id not in disputes_db:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return disputes_db[dispute_id]

@app.get("/api/v1/clients/{client_id}/disputes", response_model=List[DisputeResponse])
async def get_client_disputes(client_id: str):
    """Get all disputes for a specific client"""
    if client_id not in clients_db:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client_disputes = [dispute for dispute in disputes_db.values() if dispute.client_id == client_id]
    return client_disputes

@app.get("/api/v1/enforcement-stages", response_model=List[Dict[str, Any]])
async def get_enforcement_stages():
    """Get the 10 Step Total Enforcement Chain™ stages"""
    stages = [
        {"step": 1, "name": "Credit Report Analysis", "description": "Comprehensive review of all three credit reports"},
        {"step": 2, "name": "Error Identification", "description": "Identify inaccurate, incomplete, or unverifiable items"},
        {"step": 3, "name": "Strategic Dispute Planning", "description": "Develop customized dispute strategy"},
        {"step": 4, "name": "Initial Dispute Letters", "description": "Send FCRA-compliant dispute letters to bureaus"},
        {"step": 5, "name": "Furnisher Challenges", "description": "Direct disputes with data furnishers"},
        {"step": 6, "name": "Advanced Legal Tactics", "description": "Escalated enforcement procedures"},
        {"step": 7, "name": "Validation Requests", "description": "Debt validation under FDCPA"},
        {"step": 8, "name": "Compliance Monitoring", "description": "Ensure all parties follow legal requirements"},
        {"step": 9, "name": "Credit Optimization", "description": "Positive credit building strategies"},
        {"step": 10, "name": "Wealth Management Transition", "description": "Graduate to wealth building services"}
    ]
    return stages

@app.get("/api/v1/stats", response_model=Dict[str, Any])
async def get_stats():
    """Get platform statistics"""
    return {
        "total_clients": len(clients_db),
        "total_disputes": len(disputes_db),
        "lives_transformed": 10697,
        "homeowners_created": 475,
        "people_educated": 14000,
        "success_rate": "94%",
        "trusted_by": ["NFL Athletes", "Dallas Cowboys", "Business Owners"]
    }

# USPS API Routes
@app.post("/api/v1/usps/address/verify")
async def verify_address(request: AddressVerificationRequest):
    """Verify and standardize an address using USPS API"""
    try:
        address = USPSAddress(
            streetAddress=request.streetAddress,
            secondaryAddress=request.secondaryAddress,
            cityName=request.cityName,
            state=request.state,
            zipCode=request.zipCode
        )
        
        result = await usps_service.verify_address(address)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/usps/pricing")
async def get_pricing(request: PricingRequest):
    """Get shipping pricing for different service types"""
    try:
        pricing_request = USPSPricingRequest(
            originZipCode=request.originZipCode,
            destinationZipCode=request.destinationZipCode,
            weight=request.weight,
            length=request.length,
            width=request.width,
            height=request.height,
            mailClass=request.mailClass
        )
        
        result = await usps_service.get_pricing(pricing_request)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/usps/service-standards")
async def get_service_standards(origin_zip: str, destination_zip: str, mail_class: str = "USPS_GROUND_ADVANTAGE"):
    """Get service standards and delivery timeframes"""
    try:
        result = await usps_service.get_service_standards(origin_zip, destination_zip, mail_class)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/usps/locations")
async def find_locations(zip_code: str, radius: int = 10):
    """Find USPS locations near a ZIP code"""
    try:
        result = await usps_service.find_locations(zip_code, radius)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/usps/labels")
async def create_label(request: LabelCreationRequest):
    """Create shipping label with tracking"""
    try:
        label_request = USPSLabelRequest(
            fromAddress=request.fromAddress,
            toAddress=request.toAddress,
            weight=request.weight,
            mailClass=request.mailClass,
            specialServices=request.specialServices,
            customerReference=request.customerReference
        )
        
        result = await usps_service.create_label(label_request)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/usps/tracking/{tracking_number}")
async def track_package(tracking_number: str):
    """Track a package using tracking number"""
    try:
        result = await usps_service.track_package(tracking_number)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/usps/dispute-letters")
async def send_dispute_letter(request: DisputeMailRequest):
    """Send dispute letter via USPS with tracking"""
    try:
        dispute_request = USPSDisputeMailRequest(
            clientId=request.clientId,
            disputeId=request.disputeId,
            recipientAddress=request.recipientAddress,
            letterType=request.letterType,
            specialServices=request.specialServices
        )
        
        result = await usps_service.send_dispute_letter(dispute_request)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/usps/health")
async def usps_health():
    """Check USPS service health"""
    try:
        result = await usps_service.health_check()
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Stripe Payment Endpoints
@app.get("/api/v1/stripe/health")
async def stripe_health():
    """Check Stripe service health"""
    try:
        if not stripe.api_key:
            return {
                "healthy": False,
                "message": "Stripe API key not configured"
            }
        
        # Test Stripe connection
        account = stripe.Account.retrieve()
        
        return {
            "healthy": True,
            "message": "Stripe service is operational",
            "account_id": account.id,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled
        }
        
    except Exception as e:
        return {
            "healthy": False,
            "message": f"Stripe service error: {str(e)}"
        }

@app.get("/api/v1/stripe/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = [
        {
            "id": "basic",
            "name": "Basic Credit Repair",
            "price": "$97/month",
            "amount": 9700,
            "interval": "month",
            "features": [
                "Credit report analysis",
                "Basic dispute letters",
                "Monthly credit monitoring",
                "Email support"
            ],
            "popular": False
        },
        {
            "id": "professional",
            "name": "Professional Credit Repair",
            "price": "$197/month",
            "amount": 19700,
            "interval": "month",
            "features": [
                "Everything in Basic",
                "Advanced dispute strategies",
                "10 Step Total Enforcement Chain™",
                "Phone support",
                "Goodwill letters",
                "Credit builder recommendations"
            ],
            "popular": True
        },
        {
            "id": "elite",
            "name": "Elite Credit Repair",
            "price": "$397/month",
            "amount": 39700,
            "interval": "month",
            "features": [
                "Everything in Professional",
                "Priority processing",
                "Direct attorney consultation",
                "Business credit repair",
                "Wealth management guidance",
                "24/7 support"
            ],
            "popular": False
        }
    ]
    return {"plans": plans}

@app.post("/api/v1/stripe/customers")
async def create_customer(request: CreateCustomerRequest):
    """Create a new Stripe customer"""
    try:
        customer_data = {
            "email": request.email,
            "name": request.name
        }
        
        if request.phone:
            customer_data["phone"] = request.phone
            
        if request.address:
            customer_data["address"] = request.address
            
        customer = stripe.Customer.create(**customer_data)
        
        return {
            "success": True,
            "customer": {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/stripe/payment-intent")
async def create_payment_intent(request: PaymentIntentRequest):
    """Create a payment intent for one-time payments"""
    try:
        intent_data = {
            "amount": request.amount,
            "currency": request.currency,
            "automatic_payment_methods": {"enabled": True}
        }
        
        if request.customer_id:
            intent_data["customer"] = request.customer_id
            
        if request.description:
            intent_data["description"] = request.description
            
        intent = stripe.PaymentIntent.create(**intent_data)
        
        return {
            "success": True,
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/stripe/subscriptions")
async def create_subscription(request: CreateSubscriptionRequest):
    """Create a new subscription"""
    try:
        subscription = stripe.Subscription.create(
            customer=request.customer_id,
            items=[{"price": request.price_id}],
            default_payment_method=request.payment_method_id,
            expand=["latest_invoice.payment_intent"]
        )
        
        return {
            "success": True,
            "subscription": {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/stripe/customers/{customer_id}/subscriptions")
async def get_customer_subscriptions(customer_id: str):
    """Get all subscriptions for a customer"""
    try:
        subscriptions = stripe.Subscription.list(customer=customer_id)
        
        return {
            "success": True,
            "subscriptions": [{
                "id": sub.id,
                "status": sub.status,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "plan_name": sub.items.data[0].price.nickname if sub.items.data else "Unknown"
            } for sub in subscriptions.data]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/stripe/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(subscription_id: str):
    """Cancel a subscription"""
    try:
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )
        
        return {
            "success": True,
            "message": "Subscription will be canceled at the end of the current period",
            "subscription": {
                "id": subscription.id,
                "status": subscription.status,
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/stripe/webhook")
async def stripe_webhook(request):
    """Handle Stripe webhooks"""
    try:
        # In production, verify the webhook signature
        # sig_header = request.headers.get('stripe-signature')
        # event = stripe.Webhook.construct_event(
        #     payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        # )
        
        # For now, just return success
        return {"success": True, "message": "Webhook received"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)