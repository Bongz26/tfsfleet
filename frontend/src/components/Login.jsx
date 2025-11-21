// frontend/src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { authAPI, driverAPI } from '../services/api';

const Login = ({ onLogin }) => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDrivers = async () => {
      setLoading(true);
      try {
        const driversData = await driverAPI.getDrivers();
        setDrivers(driversData);
      } catch (error) {
        console.error('Error loading drivers:', error);
        setError('Failed to load drivers. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    loadDrivers();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setError('Please select a driver');
      return;
    }

    setLoggingIn(true);
    setError('');

    try {
      const result = await authAPI.login(selectedDriverId);
      
      if (result.success) {
        // Store token and driver info
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('driver', JSON.stringify(result.driver));
        // lastUsedVehicle is optional - just for convenience
        if (result.lastUsedVehicle) {
          localStorage.setItem('lastUsedVehicle', JSON.stringify(result.lastUsedVehicle));
        }
        
        // Call parent callback
        onLogin(result);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Driver Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Your Name *</label>
            <select 
              value={selectedDriverId}
              onChange={(e) => {
                setSelectedDriverId(e.target.value);
                setError('');
              }}
              className="w-full p-3 border rounded-lg"
              required
              disabled={loading || loggingIn}
            >
              <option value="">Choose your name...</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || loggingIn || !selectedDriverId}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:bg-gray-400 hover:bg-blue-600 font-medium"
          >
            {loggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          Select your name to access available vehicles and record trips
        </p>
      </div>
    </div>
  );
};

export default Login;

