import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Address {
  streetAddress: string;
  streetAddressAbbreviation?: string;
  secondaryAddress?: string;
  cityAbbreviation?: string;
  city: string;
  state: string;
  ZIPCode: string;
  ZIPPlus4?: string;
  urbanization?: string;
  firstName?: string;
  lastName?: string;
  firm?: string;
  phone?: string;
  email?: string;
}

interface PackageDescription {
  mailClass: 'USPS_GROUND_ADVANTAGE' | 'PRIORITY_MAIL' | 'PRIORITY_MAIL_EXPRESS' | 'PARCEL_SELECT' | 'MEDIA_MAIL' | 'LIBRARY_MAIL';
  rateIndicator?: 'SP' | 'DR' | 'DS';
  weight: {
    unitOfMeasurement: 'LB' | 'OZ';
    value: number;
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unitOfMeasurement: 'IN';
  };
  processingCategory?: 'MACHINABLE' | 'NON_MACHINABLE';
  destinationEntryFacilityType?: 'NONE' | 'DESTINATION_DELIVERY_UNIT' | 'DESTINATION_SECTIONAL_CENTER_FACILITY';
  mailingDate: string;
  deliveryOption?: 'HOLD_FOR_PICKUP' | 'SIGNATURE_REQUIRED' | 'ADULT_SIGNATURE_REQUIRED';
  specialServices?: {
    specialServiceTypes: string[];
    inputParameters?: any[];
  };
}

interface ImageInfo {
  imageType: 'PDF' | 'PNG' | 'JPG' | 'GIF' | 'TIFF' | 'SVG';
  labelType: 'SHIPPING_LABEL' | 'RETURN_LABEL';
  receiptOption?: 'SEPARATE_PAGE' | 'SAME_PAGE' | 'NONE';
  returnLabelIndicator?: boolean;
}

interface LabelRequest {
  toAddress: Address;
  fromAddress: Address;
  senderAddress?: Address;
  returnAddress?: Address;
  packageDescription: PackageDescription;
  imageInfo: ImageInfo;
  customsForm?: any;
  immediateManifest?: boolean;
}

interface LabelResponse {
  success: boolean;
  labelMetadata?: {
    labelId: string;
    trackingNumber: string;
    postage: {
      totalPrice: number;
      currency: string;
    };
    deliveryDate?: string;
    guaranteedDelivery?: boolean;
  };
  labelImage?: string; // Base64 encoded
  receiptImage?: string; // Base64 encoded
  error?: string;
}

interface TrackingRequest {
  trackingNumbers: string[];
}

interface TrackingResponse {
  success: boolean;
  trackingResults?: {
    trackingNumber: string;
    status: string;
    statusDescription: string;
    deliveryDate?: string;
    deliveryTime?: string;
    events: {
      eventType: string;
      eventDescription: string;
      eventDate: string;
      eventTime: string;
      location: string;
    }[];
  }[];
  error?: string;
}

interface MailingStats {
  totalSent: number;
  totalCost: number;
  monthlyVolume: number;
  averageCost: number;
  deliveryRate: number;
  pendingShipments: number;
}

@Injectable({
  providedIn: 'root'
})
export class UspsService {
  private apiUrl = 'https://apis.usps.com';
  private testApiUrl = 'https://apis-tem.usps.com';
  private isTestMode = true; // Set to false for production
  private paymentToken: string | null = null;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Demo credentials and settings
  private demoSettings = {
    permitNumber: 'DEMO123456',
    accountNumber: 'RICK001',
    customerRegistrationId: 'CRID123',
    mailingAgentId: 'MA001'
  };

  constructor(private http: HttpClient) {
    // Load saved token if available
    const savedToken = localStorage.getItem('usps_payment_token');
    if (savedToken) {
      this.paymentToken = savedToken;
      this.isAuthenticatedSubject.next(true);
    }
  }

  private getBaseUrl(): string {
    return this.isTestMode ? this.testApiUrl : this.apiUrl;
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Payment-Authorization-Token': this.paymentToken || '',
      'Accept': 'application/json'
    });
  }

  // Authentication methods
  setPaymentToken(token: string): void {
    this.paymentToken = token;
    localStorage.setItem('usps_payment_token', token);
    this.isAuthenticatedSubject.next(true);
  }

  clearAuth(): void {
    this.paymentToken = null;
    localStorage.removeItem('usps_payment_token');
    this.isAuthenticatedSubject.next(false);
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Label creation methods
  createLabel(labelRequest: LabelRequest): Observable<LabelResponse> {
    return this.http.post<any>(`${this.getBaseUrl()}/labels/v3/label`, labelRequest, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        // Handle multipart response
        if (response && response.labelMetadata) {
          return {
            success: true,
            labelMetadata: response.labelMetadata,
            labelImage: response.labelImage,
            receiptImage: response.receiptImage
          };
        }
        return { success: false, error: 'Invalid response format' };
      }),
      catchError(error => {
        console.error('Label creation error:', error);
        return of({ success: false, error: 'Failed to create label' });
      })
    );
  }

  // Tracking methods
  trackPackages(trackingNumbers: string[]): Observable<TrackingResponse> {
    const trackingRequest: TrackingRequest = { trackingNumbers };
    
    return this.http.post<any>(`${this.getBaseUrl()}/tracking/v3/tracking`, trackingRequest, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && response.trackingResults) {
          return {
            success: true,
            trackingResults: response.trackingResults
          };
        }
        return { success: false, error: 'No tracking data available' };
      }),
      catchError(error => {
        console.error('Tracking error:', error);
        return of({ success: false, error: 'Failed to retrieve tracking information' });
      })
    );
  }

  // Address validation
  validateAddress(address: Address): Observable<{ success: boolean, validatedAddress?: Address, error?: string }> {
    return this.http.post<any>(`${this.getBaseUrl()}/addresses/v3/address`, address, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && response.address) {
          return {
            success: true,
            validatedAddress: response.address
          };
        }
        return { success: false, error: 'Address validation failed' };
      }),
      catchError(error => {
        console.error('Address validation error:', error);
        return of({ success: false, error: 'Failed to validate address' });
      })
    );
  }

  // Pricing methods
  calculatePricing(packageDescription: PackageDescription, fromZip: string, toZip: string): Observable<any> {
    const pricingRequest = {
      originZIPCode: fromZip,
      destinationZIPCode: toZip,
      weight: packageDescription.weight,
      dimensions: packageDescription.dimensions,
      mailClass: packageDescription.mailClass,
      processingCategory: packageDescription.processingCategory,
      rateIndicator: packageDescription.rateIndicator,
      mailingDate: packageDescription.mailingDate
    };

    return this.http.post<any>(`${this.getBaseUrl()}/prices/v3/base-rates/search`, pricingRequest, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && response.rates) {
          return {
            success: true,
            rates: response.rates
          };
        }
        return { success: false, error: 'No pricing data available' };
      }),
      catchError(error => {
        console.error('Pricing error:', error);
        return of({ success: false, error: 'Failed to calculate pricing' });
      })
    );
  }

  // Utility methods for demo data
  getDemoMailingStats(): Observable<MailingStats> {
    const stats: MailingStats = {
      totalSent: 1247,
      totalCost: 3891.45,
      monthlyVolume: 156,
      averageCost: 3.12,
      deliveryRate: 98.7,
      pendingShipments: 23
    };
    
    return of(stats);
  }

  getDemoTrackingData(): Observable<TrackingResponse> {
    const demoTracking: TrackingResponse = {
      success: true,
      trackingResults: [
        {
          trackingNumber: '9400111899562537866142',
          status: 'DELIVERED',
          statusDescription: 'Delivered to recipient',
          deliveryDate: '2024-01-15',
          deliveryTime: '14:30',
          events: [
            {
              eventType: 'DELIVERED',
              eventDescription: 'Delivered, Front Door/Porch',
              eventDate: '2024-01-15',
              eventTime: '14:30',
              location: 'ATLANTA, GA 30309'
            },
            {
              eventType: 'OUT_FOR_DELIVERY',
              eventDescription: 'Out for Delivery',
              eventDate: '2024-01-15',
              eventTime: '08:45',
              location: 'ATLANTA, GA 30309'
            },
            {
              eventType: 'ARRIVED_AT_FACILITY',
              eventDescription: 'Arrived at Post Office',
              eventDate: '2024-01-14',
              eventTime: '22:15',
              location: 'ATLANTA, GA 30309'
            }
          ]
        }
      ]
    };
    
    return of(demoTracking);
  }

  // Helper methods for creating common label requests
  createStandardLabelRequest(
    toAddress: Address,
    fromAddress: Address,
    weight: number,
    mailClass: string = 'USPS_GROUND_ADVANTAGE'
  ): LabelRequest {
    return {
      toAddress,
      fromAddress,
      packageDescription: {
        mailClass: mailClass as any,
        weight: {
          unitOfMeasurement: 'LB',
          value: weight
        },
        processingCategory: 'MACHINABLE',
        mailingDate: new Date().toISOString().split('T')[0]
      },
      imageInfo: {
        imageType: 'PDF',
        labelType: 'SHIPPING_LABEL',
        receiptOption: 'SEPARATE_PAGE'
      }
    };
  }

  // Bulk mailing methods
  createBulkLabels(labelRequests: LabelRequest[]): Observable<LabelResponse[]> {
    const bulkRequests = labelRequests.map(request => 
      this.createLabel(request)
    );
    
    // For demo purposes, return successful responses
    return of(labelRequests.map((_, index) => ({
      success: true,
      labelMetadata: {
        labelId: `LABEL_${Date.now()}_${index}`,
        trackingNumber: `9400111899562537866${String(index).padStart(3, '0')}`,
        postage: {
          totalPrice: 3.12 + (Math.random() * 2),
          currency: 'USD'
        }
      }
    })));
  }

  // Service standards (delivery time estimates)
  getServiceStandards(originZip: string, destinationZip: string, mailClass: string): Observable<any> {
    return this.http.get<any>(
      `${this.getBaseUrl()}/service-standards/v3/estimates?originZIPCode=${originZip}&destinationZIPCode=${destinationZip}&mailClass=${mailClass}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response && response.serviceStandards) {
          return {
            success: true,
            serviceStandards: response.serviceStandards
          };
        }
        return { success: false, error: 'No service standards available' };
      }),
      catchError(error => {
        console.error('Service standards error:', error);
        return of({ success: false, error: 'Failed to retrieve service standards' });
      })
    );
  }

  // Toggle between test and production modes
  setTestMode(isTest: boolean): void {
    this.isTestMode = isTest;
  }

  getTestMode(): boolean {
    return this.isTestMode;
  }
}