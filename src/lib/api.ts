/* -------------------------------------------------------------------------- */
/*  lib/api.ts — typed helpers for Flask-Supabase back-end + Storage uploads  */
/* -------------------------------------------------------------------------- */

import axios, { AxiosError } from 'axios'
import { supabase } from './supabase'

/* ────────────────────────────────────────────────────────────────────────── */
/*  1. Axios instance                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
// In direct-to-Flask local development you can hardcode:
// const LOCAL_API = 'http://localhost:5000/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()
  ? import.meta.env.VITE_API_BASE_URL
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r.data,
  (err: AxiosError<any>) =>
    Promise.reject(
      new Error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message,
      ),
    ),
)

/* ────────────────────────────────────────────────────────────────────────── */
/*  2. Shared Types                                                          */
/* ────────────────────────────────────────────────────────────────────────── */
export interface User { /* … */ }
export interface Property { /* … */ }
export interface Booking { /* … */ }
export interface Inquiry { /* … */ }
export interface Amenity { id: string; name: string; icon?: string }
export interface PropertyCategory { id: string; name: string; description?: string }

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. Auth                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
export const authAPI = {
  signUp: async (payload: { /* … */ }) => {
    const { token, user } = await api.post<{ token: string; user: User }>(
      '/auth/register',
      payload,
    )
    localStorage.setItem('token', token)
    return user
  },
  signIn: async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password },
    )
    localStorage.setItem('token', token)
    return user
  },
  signOut: () => {
    localStorage.removeItem('token')
  },
  me: async () => {
    try {
      const { user } = await api.get<{ user: User }>('/auth/me')
      return user
    } catch {
      localStorage.removeItem('token')
      return null
    }
  },
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  4. Supabase Storage helper                                               */
/* ────────────────────────────────────────────────────────────────────────── */
export const storageAPI = {
  async upload(bucket: string, file: File, folder = 'uploads'): Promise<string> {
    const filename = `${Date.now()}_${file.name}`
    const path = `${folder}/${filename}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  5. Properties                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
type PropertyFilters = Partial<{
  city: string
  property_type: string
  min_price: number
  max_price: number
  bedrooms: number
  bathrooms: number
  listing_type: 'RENT' | 'SALE'
}>

export const propertiesAPI = {
  list: (filters: PropertyFilters = {}) =>
    api.get<Property[]>('/properties', { params: filters }),
  get: (id: string) => api.get<Property>(`/properties/${id}`),
  create: (payload: Omit<Property, 'id' | 'created_at' | 'owner_id'>) =>
    api.post<Property>('/properties', payload),
  update: (id: string, patch: Partial<Property>) =>
    api.put<Property>(`/properties/${id}`, patch),
  remove: (id: string) => api.delete<void>(`/properties/${id}`),
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  6. Property images                                                       */
/* ────────────────────────────────────────────────────────────────────────── */
export const propertyImagesAPI = {
  list: (propertyId: string) =>
    api.get<string[]>(`/properties/${propertyId}/images`),
  upload: (propertyId: string, payload: { room_type: string; file: File }) => {
    const form = new FormData()
    form.append('room_type', payload.room_type)
    form.append('file', payload.file)
    return api.post<string>(`/properties/${propertyId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (propertyId: string, imageId: string) =>
    api.delete<void>(`/properties/${propertyId}/images/${imageId}`),
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  7. Taxonomy (categories / amenities)                                     */
/* ────────────────────────────────────────────────────────────────────────── */
export const propertyCategoriesAPI = {
  list: () => api.get<PropertyCategory[]>('/property-categories'),
}
export const amenitiesAPI = {
  list: () => api.get<Amenity[]>('/amenities'),
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  8. Bookings & Inquiries                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
export const bookingsAPI = {
  list: (f: Partial<{ property_id: string; user_id: string }>) =>
    api.get<Booking[]>('/bookings', { params: f }),
  create: (payload: {
    property_id: string
    booking_date: string
    booking_time: string
    notes?: string
  }) => api.post<Booking>('/bookings', payload),
  update: (id: string, patch: Partial<Booking>) =>
    api.put<Booking>(`/bookings/${id}`, patch),
}
export const inquiriesAPI = {
  list: (f: Partial<{ property_id: string; status: string }>) =>
    api.get<Inquiry[]>('/inquiries', { params: f }),
  create: (payload: Omit<Inquiry, 'id' | 'status' | 'created_at'>) =>
    api.post<Inquiry>('/inquiries', payload),
  update: (id: string, patch: Partial<Inquiry>) =>
    api.put<Inquiry>(`/inquiries/${id}`, patch),
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  9. Users & Agents                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
export const usersAPI = {
  list: (f: Partial<{ user_type: string; status: string }>) =>
    api.get<User[]>('/users', { params: f }),
  get: (id: string) => api.get<User>(`/users/${id}`),
  update: (id: string, patch: Partial<User>) =>
    api.put<User>(`/users/${id}`, patch),
}
export const agentsAPI = {
  list: (f: Partial<{ verification_status: string }>) =>
    api.get<User[]>('/agents', { params: f }),
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 10. Aggregate default export                                              */
/* ────────────────────────────────────────────────────────────────────────── */
export default {
  api: api,
  authAPI,
  storageAPI,
  propertiesAPI,
  propertyImagesAPI,
  propertyCategoriesAPI,
  amenitiesAPI,
  usersAPI,
  agentsAPI,
  bookingsAPI,
  inquiriesAPI,
}
