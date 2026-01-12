/**
 * Backend Service for FreshChain
 * Communicates with FastAPI backend that handles all blockchain operations
 * Frontend never directly interacts with blockchain
 */

import { getAuthService } from './authService';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export enum BatchStage {
  CREATED = 'Created',
  HARVESTED = 'Harvested',
  IN_TRANSIT = 'In Transit',
  AT_RETAILER = 'At Retailer',
  SELLING = 'Selling'
}

export interface BatchCreationRequest {
  batchId: string;
  productType: string;
}

export interface BatchUpdateRequest {
  batchId: string;
  stage: BatchStage;
  location: string;
}

export interface ReportAlertRequest {
  batchId: string;
  alertType: string;
  encryptedData: string;
}

export interface LocationUpdate {
  stage: BatchStage;
  location: string;
  timestamp: string;
  transactionHash: string;
  updatedBy: string;
}

export interface Alert {
  alertType: string;
  encryptedData: string;
  timestamp: string;
  transactionHash: string;
}

export interface BatchDetails {
  batchId: string;
  productType: string;
  created: string;
  currentStage: BatchStage;
  currentLocation: string;
  locationHistory: LocationUpdate[];
  alerts: Alert[];
  isActive: boolean;
  isFinalStage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  transactionHash?: string;
}

export class BackendService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authService = getAuthService();
      const headers = authService.getAuthHeaders();

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          ...headers,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle different response structures
      if (data.success !== undefined) {
        // Backend returns {success: true, data: [...]}
        return {
          success: data.success,
          data: data.data,
          message: data.message,
          transactionHash: data.transactionHash,
        };
      } else {
        // Backend returns data directly
        return {
          success: true,
          data: data,
          message: data.message,
          transactionHash: data.transactionHash,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Create a new batch (Admin or Retailer only)
   * Backend signs the transaction with system wallet
   */
  async createBatch(request: BatchCreationRequest): Promise<ApiResponse<void>> {
    return this.makeRequest('/batch/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update batch stage (Retailer or Transporter only)
   * Backend signs the transaction with system wallet
   */
  async updateBatchStage(request: BatchUpdateRequest): Promise<ApiResponse<void>> {
    return this.makeRequest('/batch/update-stage', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Report an alert/excursion for a batch (Retailer or Transporter only)
   */
  async reportAlert(request: ReportAlertRequest): Promise<ApiResponse<void>> {
    return this.makeRequest('/batch/report-alert', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get batch details (Public - used for QR scanning)
   * Always returns the latest blockchain state
   */
  async getBatchDetails(batchId: string): Promise<ApiResponse<BatchDetails>> {
    return this.makeRequest<BatchDetails>(`/batch/${batchId}`);
  }

  /**
   * Check backend health and blockchain connection
   */
  async checkHealth(): Promise<ApiResponse<{ status: string; blockchain_connected: boolean; network: string }>> {
    return this.makeRequest<{ status: string; blockchain_connected: boolean; network: string }>('/health');
  }

  /**
   * Get all batches (Admin only)
   */
  async getAllBatches(): Promise<ApiResponse<BatchDetails[]>> {
    return this.makeRequest<BatchDetails[]>('/admin/batches');
  }

  // Admin MetaMask operations (simplified - no signature modals)
  async adminCreateBatchWithMetaMask(request: BatchCreationRequest): Promise<ApiResponse<void>> {
    return this.makeRequest('/admin/metamask/create-batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async adminUpdateStageWithMetaMask(request: BatchUpdateRequest): Promise<ApiResponse<void>> {
    return this.makeRequest('/admin/metamask/update-stage', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getWalletStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest('/admin/wallet/status');
  }
}

// Singleton instance
let backendService: BackendService | null = null;

export const getBackendService = (): BackendService => {
  if (!backendService) {
    backendService = new BackendService();
  }
  return backendService;
};

export default BackendService;