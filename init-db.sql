-- Prompt Studio Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Disabled temporarily to avoid conflicts with Drizzle

-- Create indexes for better performance
-- These will be created by Drizzle migrations, but we can add some basic ones

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS json AS $$
BEGIN
    RETURN json_build_object(
        'status', 'healthy',
        'timestamp', CURRENT_TIMESTAMP,
        'database', current_database(),
        'version', version()
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (if needed)
-- GRANT ALL PRIVILEGES ON DATABASE promptstudio TO postgres;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Prompt Studio database initialized successfully';
END $$;



