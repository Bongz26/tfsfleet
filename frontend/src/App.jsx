import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TripForm from './components/TripForm';
import FuelPurchaseForm from './components/FuelPurchaseForm';
import MaintenanceNoteForm from './components/MaintenanceNoteForm';
import FuelUsageSummary from './components/FuelUsageSummary';
import { authAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driver, setDriver] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('trips');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const savedDriver = localStorage.getItem('driver');
    
    if (token && savedDriver) {
      setDriver(JSON.parse(savedDriver));
      setIsAuthenticated(true);
      
      // Verify token is still valid (don't block UI if this fails)
      authAPI.getCurrentDriver()
        .then(result => {
          // lastUsedVehicle is optional - just for convenience
          if (result.lastUsedVehicle) {
            localStorage.setItem('lastUsedVehicle', JSON.stringify(result.lastUsedVehicle));
          }
        })
        .catch((error) => {
          // Token invalid, logout
          console.error('Token validation failed:', error);
          handleLogout();
        });
    }
  }, []);

  const handleLogin = (loginResult) => {
    setDriver(loginResult.driver);
    // lastUsedVehicle is optional - just for convenience, drivers can select any available vehicle
    if (loginResult.lastUsedVehicle) {
      localStorage.setItem('lastUsedVehicle', JSON.stringify(loginResult.lastUsedVehicle));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authAPI.logout();
    setDriver(null);
    setVehicle(null);
    setIsAuthenticated(false);
  };

  const tabs = [
    { id: 'trips', label: 'Trips', component: TripForm },
    { id: 'fuel', label: 'Fuel Purchases', component: FuelPurchaseForm },
    { id: 'maintenance', label: 'Maintenance', component: MaintenanceNoteForm },
    { id: 'summary', label: 'Fuel Summary', component: FuelUsageSummary }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TripForm;

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Fleet Management</h1>
            <p className="text-sm text-blue-100">
              {driver?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <main className="container mx-auto py-8">
        <ActiveComponent />
      </main>
    </div>
  );
}

export default App;

