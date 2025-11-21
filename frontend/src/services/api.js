// frontend/src/services/api.js
import axios from 'axios';
import { syncManager, db } from './offlineStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Request interceptor to add auth token and logging
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log(`API Call: ${config.url} | Size: ${JSON.stringify(config.data)?.length} bytes`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('driver');
      localStorage.removeItem('vehicle');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const tripAPI = {
  async getLastOdometer(vehicleId) {
    try {
      const response = await api.get('/trips/last-odometer', { params: { vehicle_id: vehicleId } });
      return response.data.suggested_start_odometer;
    } catch (error) {
      console.error('Error fetching last odometer:', error);
      return null;
    }
  },
  
  async submitTrip(tripData) {
    try {
      // Only send: driver_id, vehicle_id, end_odo, purpose
      // Start odometer is calculated in backend
      const { start_odo, fuel_used, ...cleanTripData } = tripData;
      const response = await api.post('/trips', cleanTripData);
      console.log(`Trip submitted successfully. Data used: ${response.data.size} bytes`);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        // Queue for sync when offline
        const { start_odo, fuel_used, ...cleanTripData } = tripData;
        await syncManager.queueForSync(cleanTripData);
        return { success: true, offline: true, message: 'Saved offline - will sync later' };
      }
      throw error;
    }
  },
  
  async syncPendingTrips() {
    if (!navigator.onLine) return { synced: 0 };
    
    const pendingTrips = await syncManager.getPendingSyncs();
    if (pendingTrips.length === 0) return { synced: 0 };
    
    try {
      const response = await api.post('/trips/bulk', { 
        trips: pendingTrips.map(trip => ({
          driver_id: trip.driver_id,
          vehicle_id: trip.vehicle_id,
          end_odo: trip.end_odo,
          purpose: trip.purpose
          // start_odo is calculated in backend
        }))
      });
      
      // Mark as synced
      for (const trip of pendingTrips) {
        await syncManager.markAsSynced(trip.id);
      }
      
      console.log(`Synced ${response.data.count} trips`);
      return response.data;
    } catch (error) {
      console.error('Sync failed:', error);
      return { synced: 0, error: error.message };
    }
  }
};

export const authAPI = {
  async login(driverId) {
    try {
      const response = await api.post('/auth/login', { driver_id: driverId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  async getCurrentDriver() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('driver');
    localStorage.removeItem('vehicle');
  }
};

export const driverAPI = {
  async getDrivers() {
    try {
      const response = await api.get('/drivers');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Try to get from offline storage
      try {
        return await db.drivers.toArray();
      } catch (e) {
        return [];
      }
    }
  }
};

export const vehicleAPI = {
  async getVehicles() {
    try {
      const response = await api.get('/vehicles');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      // Try to get from offline storage
      try {
        return await db.vehicles.toArray();
      } catch (e) {
        return [];
      }
    }
  }
};

export const fuelPurchaseAPI = {
  async getFuelPurchases(params = {}) {
    try {
      const response = await api.get('/fuel-purchases', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching fuel purchases:', error);
      return [];
    }
  },
  
  async uploadReceipt(file) {
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await api.post('/upload/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  },
  
  async createFuelPurchase(data) {
    try {
      const response = await api.post('/fuel-purchases', data);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        // Queue for offline sync
        await db.fuelPurchases?.add({ ...data, sync_status: 'pending' });
        return { success: true, offline: true };
      }
      throw error;
    }
  },
  
  async getFuelSummary(params = {}) {
    try {
      const response = await api.get('/fuel-purchases/summary', { params });
      return response.data.summary || {};
    } catch (error) {
      console.error('Error fetching fuel summary:', error);
      return {};
    }
  }
};

export const maintenanceAPI = {
  async getMaintenanceNotes(params = {}) {
    try {
      const response = await api.get('/maintenance', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching maintenance notes:', error);
      return [];
    }
  },
  
  async createMaintenanceNote(data) {
    try {
      const response = await api.post('/maintenance', data);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        // Queue for offline sync
        await db.maintenanceNotes?.add({ ...data, sync_status: 'pending' });
        return { success: true, offline: true };
      }
      throw error;
    }
  },
  
  async updateMaintenanceNote(id, data) {
    try {
      const response = await api.put(`/maintenance/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  async deleteMaintenanceNote(id) {
    try {
      const response = await api.delete(`/maintenance/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Auto-sync when coming online
window.addEventListener('online', () => {
  tripAPI.syncPendingTrips();
});