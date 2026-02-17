-- Initialize PostgreSQL Database
-- This file runs automatically when the PostgreSQL container starts

-- Create the main database
SELECT 'CREATE DATABASE educonnect_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'educonnect_db')\gexec
