// frontend/src/components/TripForm.jsx
import React, { useState, useEffect } from 'react';
import { tripAPI, driverAPI, vehicleAPI } from '../services/api';
import { useOffline } from '../hooks/useOffline';

const TripForm = () => {
  const [formData, setFormData] = useState({
    driver_id: '',
    vehicle_id: '',
    end_odo: '',
    purpose: ''
  });
  const [lastTripOdometer, setLastTripOdometer] = useState(null);
  const [tripDistance, setTripDistance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOffline();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get logged-in driver info
        const savedDriver = localStorage.getItem('driver');
        const savedVehicle = localStorage.getItem('vehicle');
        
        if (savedDriver) {
          const driver = JSON.parse(savedDriver);
          setFormData(prev => ({ ...prev, driver_id: driver.id.toString() }));
        }
        
        // Get all available vehicles (drivers can use any available vehicle)
        const vehiclesData = await vehicleAPI.getVehicles();
        setVehicles(vehiclesData);
        
        // Auto-select last used vehicle if available, otherwise first available vehicle
        const lastUsedVehicleStr = localStorage.getItem('lastUsedVehicle');
        if (lastUsedVehicleStr && vehiclesData.length > 0) {
          const lastUsedVehicle = JSON.parse(lastUsedVehicleStr);
          const foundVehicle = vehiclesData.find(v => v.id === lastUsedVehicle.id);
          if (foundVehicle) {
            setFormData(prev => ({ ...prev, vehicle_id: foundVehicle.id.toString() }));
          } else if (vehiclesData.length > 0) {
            setFormData(prev => ({ ...prev, vehicle_id: vehiclesData[0].id.toString() }));
          }
        } else if (vehiclesData.length > 0) {
          setFormData(prev => ({ ...prev, vehicle_id: vehiclesData[0].id.toString() }));
        } else if (savedVehicle) {
          const vehicle = JSON.parse(savedVehicle);
          setFormData(prev => ({ ...prev, vehicle_id: vehicle.id.toString() }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load last trip's end odometer when vehicle is selected
  useEffect(() => {
    const loadLastOdometer = async () => {
      if (formData.vehicle_id) {
        const lastOdo = await tripAPI.getLastOdometer(formData.vehicle_id);
        setLastTripOdometer(lastOdo);
      } else {
        setLastTripOdometer(null);
      }
      // Reset trip distance when vehicle changes
      setTripDistance(null);
    };
    loadLastOdometer();
  }, [formData.vehicle_id]);

  // Calculate trip distance when end odometer is entered
  useEffect(() => {
    if (formData.end_odo && lastTripOdometer !== null) {
      const end = parseInt(formData.end_odo);
      const start = parseInt(lastTripOdometer);
      if (!isNaN(end) && !isNaN(start) && end >= start) {
        setTripDistance(end - start);
      } else if (end < start) {
        setTripDistance(null);
      } else {
        setTripDistance(null);
      }
    } else {
      setTripDistance(null);
    }
  }, [formData.end_odo, lastTripOdometer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tripDistance && formData.end_odo) {
      alert('⚠️ Please check your end odometer reading. It should be greater than the last trip\'s end reading.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Don't send start_odo - backend will calculate it automatically
      const submitData = {
        driver_id: formData.driver_id,
        vehicle_id: formData.vehicle_id,
        end_odo: formData.end_odo,
        purpose: formData.purpose
      };
      
      console.log('📤 Submitting trip data:', submitData);
      
      const result = await tripAPI.submitTrip(submitData);
      
      if (result.offline) {
        alert('✅ Trip saved offline! Will sync when connection is available.');
      } else {
        alert('✅ Trip submitted successfully!');
      }
      
      // Reset form but keep vehicle selected for next trip
      setFormData({
        driver_id: '',
        vehicle_id: formData.vehicle_id, // Keep vehicle selected
        end_odo: '',
        purpose: ''
      });
      // Reload last odometer (which will now be the trip we just submitted)
      if (formData.vehicle_id) {
        const newLastOdo = await tripAPI.getLastOdometer(formData.vehicle_id);
        setLastTripOdometer(newLastOdo);
      }
      setTripDistance(null);
    } catch (error) {
      console.error('❌ Error submitting trip:', error);
      console.error('Error response:', error.response?.data);
      alert('❌ Error submitting trip: ' + (error.response?.data?.error || error.response?.data?.details || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className={`p-2 mb-4 rounded ${isOnline ? 'bg-green-100' : 'bg-yellow-100'}`}>
        Status: {isOnline ? 'Online' : 'Offline - Saving Locally'}
      </div>
      
      <h2 className="text-xl font-bold mb-4">Record Trip</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your trip details. Start odometer is calculated automatically from the last trip.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Driver is auto-selected from login - hidden field */}
        <input type="hidden" value={formData.driver_id} />
        {formData.driver_id && (
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-sm">
              <span className="font-medium">Driver:</span> {
                JSON.parse(localStorage.getItem('driver') || '{}').name || 'Logged in driver'
              }
            </p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle *</label>
          {vehicles.length > 0 ? (
            <>
              <select 
                value={formData.vehicle_id}
                onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                className="w-full p-2 border rounded"
                required
                disabled={loading}
              >
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration} {vehicle.model ? `- ${vehicle.model}` : ''}
                  </option>
                ))}
              </select>
              {vehicles.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Select any available vehicle
                </p>
              )}
            </>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                No vehicles available. Please contact administrator.
              </p>
            </div>
          )}
          {formData.vehicle_id && lastTripOdometer !== null && (
            <p className="text-xs text-gray-500 mt-1">
              📍 Last trip ended at: {lastTripOdometer} km (this will be your start odometer)
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Purpose</label>
          <input 
            type="text"
            value={formData.purpose}
            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="e.g., Delivery, Client visit, etc. (optional)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">End Odometer *</label>
          <input 
            type="number"
            value={formData.end_odo}
            onChange={(e) => setFormData({...formData, end_odo: e.target.value})}
            className="w-full p-2 border rounded"
            required
            placeholder="Enter current odometer reading"
          />
        </div>
        
        {/* Trip Distance Display */}
        {formData.vehicle_id && lastTripOdometer !== null && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Trip Distance:</span>
              {tripDistance !== null ? (
                <span className="text-lg font-bold text-blue-600">{tripDistance} km</span>
              ) : formData.end_odo ? (
                <span className="text-sm text-red-600">Invalid reading</span>
              ) : (
                <span className="text-sm text-gray-500">Enter end odometer</span>
              )}
            </div>
            {tripDistance !== null && (
              <p className="text-xs text-gray-600 mt-1">
                Start: {lastTripOdometer} km → End: {formData.end_odo} km
              </p>
            )}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isSubmitting || (formData.end_odo && tripDistance === null)}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-400 hover:bg-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Trip'}
        </button>
      </form>
      
      <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
        <p className="font-medium mb-1">💡 How it works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Start odometer is calculated automatically from the last trip's end reading</li>
          <li>Just enter the end odometer when you finish your trip</li>
          <li>Trip distance is calculated automatically for fuel consumption tracking</li>
          <li>If another driver used the vehicle, their last trip's end reading becomes your start</li>
        </ul>
      </div>
    </div>
  );
};

export default TripForm;
