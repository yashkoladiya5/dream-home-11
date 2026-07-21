import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface KycVerificationResult {
  success: boolean;
  provider: string;
  verifiedName?: string;
  dob?: string;
  metadata?: any;
  errorReason?: string;
}

@Injectable()
export class KycProviderService {
  private readonly logger = new Logger(KycProviderService.name);
  private readonly providerUrl: string;
  private readonly apiKey: string;
  private readonly isMockMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Defaulting to Zoop or Digio API configuration
    this.providerUrl = this.configService.get<string>('KYC_PROVIDER_URL') || 'https://api.testkycprovider.com';
    this.apiKey = this.configService.get<string>('KYC_API_KEY') || 'mock_key_only';
    
    // If no real API key is provided, we run in mock/simulation mode so the app doesn't break
    this.isMockMode = this.apiKey === 'mock_key_only' || this.apiKey.includes('test');
    
    if (this.isMockMode) {
      this.logger.warn('Running KYC Provider in MOCK mode. No real API calls will be made.');
    }
  }

  /**
   * Verifies Aadhaar via OTP or Document verification
   */
  async verifyAadhaar(aadhaarNumber: string): Promise<KycVerificationResult> {
    if (this.isMockMode) {
      return this.simulateAadhaarVerification(aadhaarNumber);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.providerUrl}/v1/verify/aadhaar`,
          { aadhaar_number: aadhaarNumber },
          { headers: { Authorization: `Bearer ${this.apiKey}` } }
        )
      );
      
      const data = response.data;
      return {
        success: data.verified,
        provider: 'kyc_api_v1',
        verifiedName: data.name,
        dob: data.dob,
        metadata: data,
      };
    } catch (error: any) {
      this.logger.error(`Aadhaar verification failed: ${error.message}`);
      return {
        success: false,
        provider: 'kyc_api_v1',
        errorReason: error.response?.data?.message || 'Provider API error',
      };
    }
  }

  /**
   * Verifies PAN directly against NSDL/ITD database via Provider
   */
  async verifyPan(panNumber: string): Promise<KycVerificationResult> {
    if (this.isMockMode) {
      return this.simulatePanVerification(panNumber);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.providerUrl}/v1/verify/pan`,
          { pan_number: panNumber },
          { headers: { Authorization: `Bearer ${this.apiKey}` } }
        )
      );

      const data = response.data;
      return {
        success: data.verified,
        provider: 'kyc_api_v1',
        verifiedName: data.name,
        metadata: data,
      };
    } catch (error: any) {
      this.logger.error(`PAN verification failed: ${error.message}`);
      return {
        success: false,
        provider: 'kyc_api_v1',
        errorReason: error.response?.data?.message || 'Provider API error',
      };
    }
  }

  private simulateAadhaarVerification(aadhaarNumber: string): KycVerificationResult {
    // Basic mod10 or length check simulation
    if (aadhaarNumber.length !== 12 || !/^\d+$/.test(aadhaarNumber)) {
      return { success: false, provider: 'mock_provider', errorReason: 'Invalid Aadhaar format' };
    }
    
    // Simulate failing numbers for testing
    if (aadhaarNumber.startsWith('0000')) {
      return { success: false, provider: 'mock_provider', errorReason: 'Aadhaar suspended by UIDAI' };
    }

    return {
      success: true,
      provider: 'mock_provider',
      verifiedName: 'Test Verified User',
      dob: '1990-01-01',
      metadata: { simulated: true },
    };
  }

  private simulatePanVerification(panNumber: string): KycVerificationResult {
    // Regex for PAN: 5 letters, 4 numbers, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return { success: false, provider: 'mock_provider', errorReason: 'Invalid PAN format' };
    }

    // Simulate failing PANs
    if (panNumber.startsWith('FAIL')) {
      return { success: false, provider: 'mock_provider', errorReason: 'PAN blocked by ITD' };
    }

    return {
      success: true,
      provider: 'mock_provider',
      verifiedName: 'Test Verified User',
      metadata: { simulated: true },
    };
  }
}
