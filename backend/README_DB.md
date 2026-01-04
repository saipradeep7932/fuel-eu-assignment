# Database Setup Instructions

## Prerequisites

- PostgreSQL 12+ installed and running
- OR Docker installed (for containerized PostgreSQL)

## Quick Start (Windows PowerShell)

```powershell
# 1. Run the setup script
.\setup-db.ps1

# 2. Create .env file (copy from .env.example)
Copy-Item .env.example .env

# 3. Start backend
npm run dev
```

## Option 1: Docker (Recommended)

### Start PostgreSQL Container

**Windows PowerShell:**
```powershell
docker run --name fueleu-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=fueleu `
  -p 5432:5432 `
  -d postgres:15
```

**Linux/Mac/Bash:**
```bash
docker run --name fueleu-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fueleu \
  -p 5432:5432 \
  -d postgres:15
```

### Connection String

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fueleu
```

## Option 2: Local PostgreSQL

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fueleu;

# Exit
\q
```

### Connection String

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fueleu
```

## Setup Database Schema

### 1. Create Tables

**Windows PowerShell:**
```powershell
Get-Content src/infrastructure/db/schema.sql | docker exec -i fueleu-postgres psql -U postgres -d fueleu
```

**Linux/Mac/Bash:**
```bash
docker exec -i fueleu-postgres psql -U postgres -d fueleu < backend/src/infrastructure/db/schema.sql
```

### 2. Seed Data

**Windows PowerShell:**
```powershell
Get-Content src/infrastructure/db/seed.sql | docker exec -i fueleu-postgres psql -U postgres -d fueleu
```

**Linux/Mac/Bash:**
```bash
docker exec -i fueleu-postgres psql -U postgres -d fueleu < backend/src/infrastructure/db/seed.sql
```

## Environment Variables

Create a `.env` file in the `backend/` directory (copy from `.env.example`):

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

Then edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fueleu
PORT=3001
```

**Note:** If you don't have Docker/PostgreSQL, you can still start the backend, but API calls will fail. The server will start and show connection errors when you try to use the APIs.

## Start Backend

```bash
cd backend
npm run dev
```

## Verify Database Connection

The backend should start without errors. You can test with:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/routes
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify port 5432 is accessible

### Authentication Failed
- Check username/password in DATABASE_URL
- Verify PostgreSQL user has access to the database

### Table Does Not Exist
- Run schema.sql to create tables
- Check database name matches DATABASE_URL

