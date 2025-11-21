// frontend/src/services/offlineStorage.js
import Dexie from 'dexie';

class OfflineStorage extends Dexie {
  constructor() {
    super('FleetDatabase');
    
    this.version(1).stores({
      trips: '++id, driver_id, vehicle_id, start_odo, end_odo, purpose, sync_status, created_at',
      drivers: 'id, name, phone',
      vehicles: 'id, registration, make, model',
      fuelPurchases: '++id, vehicle_id, liters, amount, receipt_number, sync_status, created_at',
      maintenanceNotes: '++id, vehicle_id, note, maintenance_type, status, sync_status, created_at',
      syncQueue: '++id, action, data, created_at'
    });
  }
}

export const db = new OfflineStorage();

// Sync management
export const syncManager = {
  async queueForSync(tripData) {
    await db.trips.add({
      ...tripData,
      sync_status: 'pending',
      created_at: new Date().toISOString()
    });
  },
  
  async getPendingSyncs() {
    return await db.trips.where('sync_status').equals('pending').toArray();
  },
  
  async markAsSynced(tripId) {
    await db.trips.update(tripId, { sync_status: 'synced' });
  }
};