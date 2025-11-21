// frontend/src/components/FuelUsageSummary.jsx
import React, { useState, useEffect } from 'react';
import { fuelPurchaseAPI, vehicleAPI } from '../services/api';

const FuelUsageSummary = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehiclesData = await vehicleAPI.getVehicles();
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    loadSummary();
  }, [selectedVehicle, dateRange]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params = {
        ...dateRange,
        ...(selectedVehicle && { vehicle_id: selectedVehicle })
      };
      const data = await fuelPurchaseAPI.getFuelSummary(params);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEfficiency = () => {
    if (!summary || !summary.usage?.total_fuel_used || !summary.usage?.total_distance) {
      return null;
    }
    const fuelUsed = parseFloat(summary.usage.total_fuel_used);
    const distance = parseFloat(summary.usage.total_distance);
    if (fuelUsed > 0) {
      const kmPerLiter = distance / fuelUsed;
      return kmPerLiter.toFixed(2);
    }
    return null;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Fuel Usage Summary</h2>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vehicle</label>
            <select 
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registration}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input 
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input 
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fuel Purchases Summary */}
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3 text-green-800">Fuel Purchases</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Purchases:</span>
                <span className="font-semibold">{summary.purchases?.total_purchases || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Liters:</span>
                <span className="font-semibold">{parseFloat(summary.purchases?.total_liters || 0).toFixed(2)} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">R{parseFloat(summary.purchases?.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Price/Liter:</span>
                <span className="font-semibold">R{parseFloat(summary.purchases?.avg_price_per_liter || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fuel Usage Summary */}
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">Fuel Usage (from Trips)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fuel Used:</span>
                <span className="font-semibold">{parseFloat(summary.usage?.total_fuel_used || 0).toFixed(2)} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fuel Cost:</span>
                <span className="font-semibold">R{parseFloat(summary.usage?.total_fuel_cost || 0).toFixed(2)}</span>
              </div>
              {calculateEfficiency() && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="font-semibold">{calculateEfficiency()} km/L</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No data available</div>
      )}
    </div>
  );
};

export default FuelUsageSummary;

