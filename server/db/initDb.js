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

  // 2. Seed Users from users.json if needed
  try {
    const usersJsonPath = path.join(__dirname, '..', 'data', 'users.json');
    if (fs.existsSync(usersJsonPath)) {
      const raw = fs.readFileSync(usersJsonPath, 'utf8');
      const usersData = JSON.parse(raw);
      for (const u of usersData) {
        await query(
          `INSERT INTO users (id, name, email, password_hash, role, organisation, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO UPDATE SET
             name = EXCLUDED.name,
             password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             organisation = EXCLUDED.organisation`,
          [
            u.id,
            u.name,
            u.email.toLowerCase(),
            u.passwordHash,
            u.role || 'citizen',
            u.organisation || 'Civic Participant',
            u.createdAt || new Date().toISOString(),
          ]
        );
      }
      console.log(`✅ Synced ${usersData.length} users into PostgreSQL.`);
    }
  } catch (err) {
    console.error('⚠️ Could not sync users.json to DB:', err.message);
  }

  // 3. Clean up any leftover demo issues if present
  try {
    await query("DELETE FROM issue_comments WHERE issue_id LIKE 'iss-00%'");
    await query("DELETE FROM notifications WHERE issue_id LIKE 'iss-00%' OR id IN (1, 2, 3, 4)");
    await query("UPDATE crews SET assigned_issue_id = null, status = 'Available' WHERE assigned_issue_id LIKE 'iss-00%'");
    await query("DELETE FROM issues WHERE is_demo = true OR id LIKE 'iss-00%'");
  } catch (cleanErr) {
    console.warn('Notice: Cleanup of legacy demo data skipped:', cleanErr.message);
  }

  // 4. Seed Departments if empty
  const deptsCheck = await query('SELECT COUNT(*) FROM departments');
  if (parseInt(deptsCheck.rows[0].count, 10) === 0) {
    const depts = [
      { id: 'dept-1', name: 'Public Works Department (PWD)', short_code: 'PWD', officer: 'Er. Rajesh K. Sharma', email: 'pwd.delhi@gov.in', phone: '+91 11 2339 2001', avg_response_hours: 14 },
      { id: 'dept-2', name: 'Municipal Corporation (South Zone)', short_code: 'MCD', officer: 'Smt. Ananya Sen, IAS', email: 'mcd.south@delhi.gov.in', phone: '+91 11 2651 8840', avg_response_hours: 22 },
      { id: 'dept-3', name: 'Water & Sewage Utility Authority', short_code: 'DJB', officer: 'Dr. Vikram Malhotra', email: 'support@delhijalboard.nic.in', phone: '+91 11 2353 8490', avg_response_hours: 19 },
      { id: 'dept-4', name: 'Department of Urban Power & Lighting', short_code: 'BSES', officer: 'Shri Amitav Ghosh', email: 'streetlighting@urbanpower.org', phone: '+91 11 3999 9707', avg_response_hours: 8 },
      { id: 'dept-5', name: 'Drainage & Stormwater Division', short_code: 'IFCD', officer: 'Er. Kavita Verma', email: 'stormwater@delhi-flood.nic.in', phone: '+91 11 2386 1124', avg_response_hours: 12 },
      { id: 'dept-6', name: 'Road Safety & Traffic Engineering', short_code: 'DTP', officer: 'DCP Manish Singhal, IPS', email: 'trafficsafety@delhipolice.gov.in', phone: '+91 11 2584 4444', avg_response_hours: 6 },
    ];
    for (const d of depts) {
      await query(
        `INSERT INTO departments (id, name, short_code, officer, email, phone, avg_response_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [d.id, d.name, d.short_code, d.officer, d.email, d.phone, d.avg_response_hours]
      );
    }
  }

  // 5. Seed Crews if empty
  const crewsCheck = await query('SELECT COUNT(*) FROM crews');
  if (parseInt(crewsCheck.rows[0].count, 10) === 0) {
    const crewsList = [
      { id: 'crew-1', name: 'Rapid Asphalt Patch Crew #1', specialty: 'Potholes & Pavement Resurfacing', leader: 'Foreman Rakesh Yadav', members: 6, status: 'Available', assigned_issue_id: null, vehicle_number: 'DL-1GB-4021' },
      { id: 'crew-2', name: 'Stormwater Grate & Drainage Squad A', specialty: 'Open Grates & Suction Pumping', leader: 'Suresh Chand', members: 4, status: 'Available', assigned_issue_id: null, vehicle_number: 'DL-3CD-9018' },
      { id: 'crew-3', name: 'Urban Lighting High-Boom Unit 4', specialty: 'Street Lamp & Driver Replacement', leader: 'Deepak Roy', members: 3, status: 'Available', assigned_issue_id: null, vehicle_number: 'DL-2LT-1102' },
      { id: 'crew-4', name: 'Footpath & Median Masonry Team C', specialty: 'Concrete Paver Restoration', leader: 'Mohan Lal', members: 5, status: 'Available', assigned_issue_id: null, vehicle_number: 'DL-4MS-7730' },
      { id: 'crew-5', name: 'Heavy Pothole Roller Unit B', specialty: 'Bituminous Heavy Overlay', leader: 'Gurpreet Singh', members: 7, status: 'Available', assigned_issue_id: null, vehicle_number: 'DL-1PR-5520' },
    ];
    for (const cr of crewsList) {
      await query(
        `INSERT INTO crews (id, name, specialty, leader, members, status, assigned_issue_id, vehicle_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
        [cr.id, cr.name, cr.specialty, cr.leader, cr.members, cr.status, cr.assigned_issue_id, cr.vehicle_number]
      );
    }
  }

  console.log('🌟 PostgreSQL database initialization and seeding complete!');
}

export default initDb;
