/**
 * API Client (Outbound Adapter)
 * Handles HTTP communication with backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface RouteDTO {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface ComparisonResult {
  baseline: {
    routeId: string;
    year: number;
    vesselType: string;
    intensity: number;
  };
  comparisons: Array<{
    routeId: string;
    vesselType: string;
    fuelType: string;
    year: number;
    baselineIntensity: number;
    comparisonIntensity: number;
    percentDifference: number;
    compliant: boolean;
  }>;
  targetIntensity: number;
}

export interface ComplianceBalanceDTO {
  shipId: string;
  year: number;
  cb: number;
  isSurplus: boolean;
  isDeficit: boolean;
  isCompliant: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Routes
  async getRoutes(): Promise<RouteDTO[]> {
    return this.request<RouteDTO[]>('/routes');
  }

  async setBaseline(routeId: string): Promise<{ message: string; routeId: string }> {
    return this.request(`/routes/${routeId}/baseline`, {
      method: 'POST',
    });
  }

  // Comparison
  async getComparison(year?: number): Promise<ComparisonResult> {
    const query = year ? `?year=${year}` : '';
    return this.request<ComparisonResult>(`/routes/comparison${query}`);
  }

  // Compliance
  async getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalanceDTO> {
    return this.request<ComplianceBalanceDTO>(`/compliance/cb?shipId=${shipId}&year=${year}`);
  }

  async getAdjustedComplianceBalance(shipId: string, year: number): Promise<ComplianceBalanceDTO> {
    return this.request<ComplianceBalanceDTO>(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
  }

  // Banking
  async bankSurplus(shipId: string, year: number, amount: number): Promise<{ message: string; shipId: string; year: number; amount: number }> {
    return this.request('/banking/bank', {
      method: 'POST',
      body: JSON.stringify({ shipId, year, amount }),
    });
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<{ message: string; shipId: string; year: number; cbBefore: number; applied: number; cbAfter: number }> {
    return this.request('/banking/apply', {
      method: 'POST',
      body: JSON.stringify({ shipId, year, amount }),
    });
  }

  // Pooling
  async createPool(year: number, members: Array<{ shipId: string; cbBefore: number }>): Promise<{
    message: string;
    year: number;
    poolSum: number;
    valid: boolean;
    members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>;
  }> {
    return this.request('/pools', {
      method: 'POST',
      body: JSON.stringify({ year, members }),
    });
  }
}

export const apiClient = new ApiClient();

