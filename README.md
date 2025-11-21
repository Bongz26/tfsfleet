# Fleet Management Application

A full-stack fleet management application with offline support, built with React (Vite) and Node.js (Express).

## Features

- ✅ Trip management (create, view, summary)
- ✅ Driver management
- ✅ Vehicle management
- ✅ Offline support with automatic sync
- ✅ Data-efficient API design
- ✅ PostgreSQL database

## Project Structure

```
fleet-management-app/
├── backend/          # Node.js Express API
├── frontend/         # React Vite application
└── database/         # Database migrations and seeds
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE fleet_management;
```

2. Run the schema:
```bash
psql -U your_user -d fleet_management -f "db schema.sql"
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Trips
- `POST /api/trips` - Create a new trip
- `POST /api/trips/bulk` - Bulk create trips (for sync)
- `GET /api/trips` - Get trips (with optional filters)
- `GET /api/trips/summary` - Get trip summary statistics

### Drivers
- `GET /api/drivers` - Get all active drivers
- `GET /api/drivers/:id` - Get a specific driver
- `POST /api/drivers` - Create a new driver
- `PUT /api/drivers/:id` - Update a driver

### Vehicles
- `GET /api/vehicles` - Get all active vehicles
- `GET /api/vehicles/:id` - Get a specific vehicle
- `POST /api/vehicles` - Create a new vehicle
- `PUT /api/vehicles/:id` - Update a vehicle

### Sync
- `GET /api/sync/drivers` - Get drivers for sync
- `GET /api/sync/vehicles` - Get vehicles for sync
- `POST /api/sync/trips` - Bulk sync trips

### Health
- `GET /api/health` - Health check endpoint

## Offline Support

The application includes offline support using IndexedDB (via Dexie). When offline:
- Trips are saved locally
- Data automatically syncs when connection is restored
- Reference data (drivers, vehicles) is cached locally

## Development

### Quick Start (Windows)
Run from project root:
```powershell
.\start-dev.ps1
```
Or double-click `start-dev.bat`

This will start both backend and frontend in separate windows.

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production

## Technologies Used

### Backend
- Express.js
- PostgreSQL (pg)
- Joi (validation)
- Helmet (security)
- CORS
- Compression

### Frontend
- React 18
- Vite
- Axios
- Dexie (IndexedDB)
- Tailwind CSS

## License

MIT

