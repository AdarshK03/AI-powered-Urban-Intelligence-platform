import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

async function seedAdmin() {
  console.log('🌱 Starting admin user seed script...');
  try {
    // 1. Check if admin user already exists
    const adminEmail = 'admin@urban-intelligence.gov.in';
    const checkRes = await query('SELECT * FROM users WHERE LOWER(email) = $1', [adminEmail.toLowerCase()]);

    const salt = bcrypt.genSaltSync(10);
    const adminPassword = 'admin123';
    const passwordHash = bcrypt.hashSync(adminPassword, salt);

    if (checkRes.rows.length > 0) {
      console.log(`ℹ️ User with email ${adminEmail} already exists. Updating credentials and role...`);
      await query(
        `UPDATE users
         SET password_hash = $1, role = 'admin', name = 'Municipal Administrator', organisation = 'Municipal Road Infrastructure Administration', city = 'Pune', updated_at = NOW()
         WHERE LOWER(email) = $2`,
        [passwordHash, adminEmail.toLowerCase()]
      );
      console.log('✅ Admin user credentials updated successfully!');
    } else {
      console.log(`Creating new admin user ${adminEmail}...`);
      const adminId = 'usr_admin_001';
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, organisation, phone, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
        [
          adminId,
          'Municipal Administrator',
          adminEmail,
          passwordHash,
          'admin',
          'Municipal Road Infrastructure Administration',
          '+91 98765 43210',
          'Pune'
        ]
      );
      console.log('✅ Admin user created successfully in database!');
    }

    // Also check/seed default citizen user just in case
    const citizenEmail = 'citizen@urban-intelligence.in';
    const citizenCheck = await query('SELECT * FROM users WHERE LOWER(email) = $1', [citizenEmail.toLowerCase()]);
    if (citizenCheck.rows.length === 0) {
      const citHash = bcrypt.hashSync('citizen123', salt);
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, organisation, phone, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [
          'usr_citizen_001',
          'Priya Sharma',
          citizenEmail,
          citHash,
          'citizen',
          'Civic Resident Association',
          '+91 91234 56789',
          'Pune'
        ]
      );
      console.log('✅ Default citizen user seeded!');
    }

    // Fetch and display users in DB
    const allUsers = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC');
    console.log('\n📋 Current registered users in database:');
    console.table(allUsers.rows);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await pool.end();
  }
}

seedAdmin();
