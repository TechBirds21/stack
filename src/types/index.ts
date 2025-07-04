export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'seller' | 'buyer' | 'agent';
  phoneNumber?: string;
  image?: string;
  status: 'active' | 'inactive';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  price: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  propertyCategory: string;
  bookingType: 'sale' | 'rent';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    mandal: string;
  };
  images: string[];
  amenities: string[];
  features: string[];
  ownerId: string;
  agentId?: string;
  status: 'draft' | 'listed' | 'sold' | 'rented' | 'unlisted';
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetAudience: 'all' | 'buyers' | 'sellers' | 'agents' | 'specific';
  targetUsers?: string[];
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  template?: string;
  createdBy: string;
  createdAt: string;
  analytics?: {
    delivered: number;
    opened: number;
    clicked: number;
    totalRecipients: number;
  };
}

export interface TourRequest {
  id: string;
  propertyId: string;
  userId: string;
  requestedDate: string;
  requestedTime: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'admin' | 'seller' | 'buyer' | 'agent';
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: 'seller' | 'buyer' | 'agent';
  dateOfBirth?: string;
  gender?: string;
}