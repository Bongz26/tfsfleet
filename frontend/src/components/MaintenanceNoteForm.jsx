// frontend/src/components/MaintenanceNoteForm.jsx
import React, { useState, useEffect } from 'react';
import { maintenanceAPI, vehicleAPI } from '../services/api';
import { useOffline } from '../hooks/useOffline';

const MAINTENANCE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'repair', label: 'Repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'warning', label: 'Warning/Issue' },
  { value: 'service', label: 'Regular Service' },
  { value: 'tire', label: 'Tire Maintenance' },
  { value: 'general', label: 'General' }
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' }
];

const MaintenanceNoteForm = () => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    note: '',
    maintenance_type: 'general',
    status: 'pending',
    cost: '',
    service_date: '',
    odometer_reading: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOffline();

  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      try {
        const vehiclesData = await vehicleAPI.getVehicles();
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await maintenanceAPI.createMaintenanceNote({
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
        service_date: formData.service_date || null
      });
      
      if (result.offline) {
        alert('✅ Maintenance note saved offline! Will sync when connection is available.');
      } else {
        alert('✅ Maintenance note recorded successfully!');
      }
      
      // Reset form
      setFormData({
        vehicle_id: '',
        note: '',
        maintenance_type: 'general',
        status: 'pending',
        cost: '',
        service_date: '',
        odometer_reading: ''
      });
    } catch (error) {
      alert('❌ Error recording maintenance note: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className={`p-2 mb-4 rounded ${isOnline ? 'bg-green-100' : 'bg-yellow-100'}`}>
        Status: {isOnline ? 'Online' : 'Offline - Saving Locally'}
      </div>
      
      <h2 className="text-xl font-bold mb-4">Add Maintenance Note</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle *</label>
          <select 
            value={formData.vehicle_id}
            onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
            className="w-full p-2 border rounded"
            required
            disabled={loading}
          >
            <option value="">Select Vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration} {vehicle.make ? `- ${vehicle.make} ${vehicle.model || ''}` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Maintenance Note *</label>
          <textarea 
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            className="w-full p-2 border rounded"
            rows="4"
            placeholder="e.g., Engine light on, needs oil change, brake pads worn..."
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              value={formData.maintenance_type}
              onChange={(e) => setFormData({...formData, maintenance_type: e.target.value})}
              className="w-full p-2 border rounded"
            >
              {MAINTENANCE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full p-2 border rounded"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Cost (R)</label>
          <input 
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({...formData, cost: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Optional"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Service Date</label>
          <input 
            type="date"
            value={formData.service_date}
            onChange={(e) => setFormData({...formData, service_date: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Odometer Reading</label>
          <input 
            type="number"
            value={formData.odometer_reading}
            onChange={(e) => setFormData({...formData, odometer_reading: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Optional"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-orange-500 text-white p-2 rounded disabled:bg-gray-400 hover:bg-orange-600"
        >
          {isSubmitting ? 'Saving...' : 'Save Maintenance Note'}
        </button>
      </form>
    </div>
  );
};

export default MaintenanceNoteForm;

