// frontend/src/components/FuelPurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { fuelPurchaseAPI, vehicleAPI } from '../services/api';
import { useOffline } from '../hooks/useOffline';

const FuelPurchaseForm = () => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    liters: '',
    amount: '',
    receipt_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
    station_name: '',
    notes: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptPath, setReceiptPath] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a JPEG, PNG, or PDF file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setReceiptFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }

    // Upload file if online
    if (isOnline) {
      setUploadingReceipt(true);
      try {
        const result = await fuelPurchaseAPI.uploadReceipt(file);
        setReceiptPath(result.filePath);
        alert('✅ Receipt uploaded successfully!');
      } catch (error) {
        alert('❌ Error uploading receipt: ' + error.message);
        setReceiptFile(null);
        setReceiptPreview(null);
      } finally {
        setUploadingReceipt(false);
      }
    } else {
      // For offline, we'll store the file reference and upload later
      alert('⚠️ You are offline. Receipt will be uploaded when connection is restored.');
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptPath(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // If file is selected but not uploaded yet (offline), try to upload now
      let finalReceiptPath = receiptPath;
      if (receiptFile && !receiptPath && isOnline) {
        try {
          const uploadResult = await fuelPurchaseAPI.uploadReceipt(receiptFile);
          finalReceiptPath = uploadResult.filePath;
        } catch (error) {
          console.error('Error uploading receipt:', error);
          // Continue without receipt if upload fails
        }
      }

      const result = await fuelPurchaseAPI.createFuelPurchase({
        ...formData,
        liters: parseFloat(formData.liters),
        amount: parseFloat(formData.amount),
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
        receipt_slip_path: finalReceiptPath
      });
      
      if (result.offline) {
        alert('✅ Fuel purchase saved offline! Will sync when connection is available.');
      } else {
        alert('✅ Fuel purchase recorded successfully!');
      }
      
      // Reset form
      setFormData({
        vehicle_id: '',
        liters: '',
        amount: '',
        receipt_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        odometer_reading: '',
        station_name: '',
        notes: ''
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptPath(null);
    } catch (error) {
      alert('❌ Error recording fuel purchase: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePricePerLiter = () => {
    if (formData.liters && formData.amount) {
      const price = parseFloat(formData.amount) / parseFloat(formData.liters);
      return price.toFixed(2);
    }
    return '';
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className={`p-2 mb-4 rounded ${isOnline ? 'bg-green-100' : 'bg-yellow-100'}`}>
        Status: {isOnline ? 'Online' : 'Offline - Saving Locally'}
      </div>
      
      <h2 className="text-xl font-bold mb-4">Record Fuel Purchase</h2>
      
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Liters *</label>
            <input 
              type="number"
              step="0.01"
              value={formData.liters}
              onChange={(e) => setFormData({...formData, liters: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount (R) *</label>
            <input 
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        {formData.liters && formData.amount && (
          <div className="p-2 bg-blue-50 rounded">
            <span className="text-sm font-medium">Price per liter: R{calculatePricePerLiter()}</span>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Receipt Number</label>
          <input 
            type="text"
            value={formData.receipt_number}
            onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Optional"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Upload Receipt Slip</label>
          <div className="space-y-2">
            {!receiptFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">JPEG, PNG or PDF (MAX. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploadingReceipt}
                />
              </label>
            ) : (
              <div className="p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="Receipt preview" className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs">PDF</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{receiptFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(receiptFile.size / 1024).toFixed(2)} KB
                        {receiptPath && ' • Uploaded'}
                        {uploadingReceipt && ' • Uploading...'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Purchase Date</label>
          <input 
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
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
        
        <div>
          <label className="block text-sm font-medium mb-1">Station Name</label>
          <input 
            type="text"
            value={formData.station_name}
            onChange={(e) => setFormData({...formData, station_name: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Optional"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Optional notes"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || uploadingReceipt}
          className="w-full bg-green-500 text-white p-2 rounded disabled:bg-gray-400 hover:bg-green-600"
        >
          {isSubmitting ? 'Recording...' : 'Record Fuel Purchase'}
        </button>
      </form>
    </div>
  );
};

export default FuelPurchaseForm;
