import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDb() {
  console.log('🔄 Initializing PostgreSQL database schema...');

  // 1. Create tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'citizen',
      organisation VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS issues (
      id VARCHAR(100) PRIMARY KEY,
      reference_number VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      severity VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'reported',
      city VARCHAR(100) DEFAULT 'New Delhi',
      location_name VARCHAR(255),
      latitude NUMERIC(10, 7),
      longitude NUMERIC(10, 7),
      map_pos JSONB,
      photos JSONB DEFAULT '[]'::jsonb,
      support_count INTEGER DEFAULT 0,
      similar_count INTEGER DEFAULT 0,
      reporter_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
      reporter_name VARCHAR(255),
      department VARCHAR(255),
      assigned_crew VARCHAR(255),
      ai_confidence NUMERIC(5, 2),
      timeline JSONB DEFAULT '[]'::jsonb,
      before_after JSONB,
      is_demo BOOLEAN DEFAULT FALSE,
      created_by_user BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS issue_supports (
      id SERIAL PRIMARY KEY,
      issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      user_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (issue_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS issue_comments (
      id VARCHAR(100) PRIMARY KEY,
      issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      user_id VARCHAR(100),
      author_name VARCHAR(255) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_code VARCHAR(50) NOT NULL,
      officer VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      avg_response_hours INTEGER DEFAULT 12,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crews (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      specialty VARCHAR(255),
      leader VARCHAR(255),
      members INTEGER DEFAULT 4,
      status VARCHAR(50) DEFAULT 'Available',
      assigned_issue_id VARCHAR(100),
      vehicle_number VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      unread BOOLEAN DEFAULT TRUE,
      issue_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ PostgreSQL tables verified/created successfully.');

  // 3. Clean up any leftover demo issues if present and ensure schema migrations
  try {
    await query("DELETE FROM issue_comments WHERE issue_id LIKE 'iss-00%'");
    await query("DELETE FROM notifications WHERE issue_id LIKE 'iss-00%' OR id IN (1, 2, 3, 4)");
    await query("UPDATE crews SET assigned_issue_id = null, status = 'Available' WHERE assigned_issue_id LIKE 'iss-00%'");
    await query("DELETE FROM issues WHERE is_demo = true OR id LIKE 'iss-00%'");

    // Dynamic migrations
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Pune'");
    await query("ALTER TABLE issue_supports ADD COLUMN IF NOT EXISTS vote_type VARCHAR(10) DEFAULT 'up'");
    await query("UPDATE issues SET city = 'Pune' WHERE city = 'All Cities' OR city IS NULL");
  } catch (cleanErr) {
    console.warn('Notice: Migration step notice:', cleanErr.message);
  }

  console.log('🌟 PostgreSQL database initialization and seeding complete!');
}

export default initDb;
