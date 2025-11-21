// API Routes
routes/
├── auth.js              # Login/token management
├── trips.js             # CRUD for trips
├── vehicles.js          # Vehicle management
├── sync.js              # Special endpoint for bulk sync
└── reports.js           # Data analysis endpoints

// Example Trip Model
const tripSchema = {
  id: 'uuid',
  driver_id: 'string',
  vehicle_id: 'string',
  start_odo: 'integer',
  end_odo: 'integer',
  start_time: 'timestamp',
  end_time: 'timestamp',
  route: 'text',
  purpose: 'text',
  fuel_used: 'decimal',
  status: 'pending/synced', // For offline tracking
  created_at: 'timestamp',
  updated_at: 'timestamp'
}