import { User, Property, Notification, TourRequest, LoginCredentials, RegisterData, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  // Users
  async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<ApiResponse<{ users: User[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);

    return this.request(`/users?${queryParams.toString()}`);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Properties
  async getProperties(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
  }): Promise<ApiResponse<{ properties: Property[]; total: number }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/properties?${queryParams.toString()}`);
  }

  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    return this.request(`/properties/${id}`);
  }

  async createProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProperty(id: string, data: Partial<Property>): Promise<ApiResponse<Property>> {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    return this.request(`/properties/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<{ notifications: Notification[]; total: number }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/notifications?${queryParams.toString()}`);
  }

  async getNotificationById(id: string): Promise<ApiResponse<Notification>> {
    return this.request(`/notifications/${id}`);
  }

  async createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'analytics'>): Promise<ApiResponse<Notification>> {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNotification(id: string, data: Partial<Notification>): Promise<ApiResponse<Notification>> {
    return this.request(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  async sendNotification(id: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${id}/send`, { method: 'POST' });
  }

  // Tour Requests
  async getTourRequests(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<{ requests: TourRequest[]; total: number }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/tour-requests?${queryParams.toString()}`);
  }

  async createTourRequest(data: Omit<TourRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<TourRequest>> {
    return this.request('/tour-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTourRequest(id: string, data: Partial<TourRequest>): Promise<ApiResponse<TourRequest>> {
    return this.request(`/tour-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard Analytics
  async getDashboardStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalProperties: number;
    totalTourRequests: number;
    totalRevenue: number;
    recentUsers: User[];
    recentProperties: Property[];
    monthlyStats: Array<{ month: string; users: number; properties: number; revenue: number }>;
  }>> {
    return this.request('/dashboard/stats');
  }

  // File Upload
  async uploadFile(file: File, type: 'profile' | 'property' | 'document'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
  }
}

export const apiService = new ApiService();