import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    passwordHash: undefined,
  };
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const res = await query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    organisation: row.organisation,
    phone: row.phone,
    city: row.city || 'Pune',
    createdAt: row.created_at,
  };
}

export async function findUserById(id) {
  if (!id) return null;
  const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    organisation: row.organisation,
    phone: row.phone,
    city: row.city || 'Pune',
    createdAt: row.created_at,
  };
}

export async function createUser({ name, email, password, role = 'citizen', organisation = '', city = 'Pune' }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('A user with this email already exists.');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const res = await query(
    `INSERT INTO users (id, name, email, password_hash, role, organisation, city)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, organisation, phone, city, created_at AS "createdAt"`,
    [id, name.trim(), normalizedEmail, passwordHash, role || 'citizen', organisation.trim() || 'Civic Participant', city.trim() || 'Pune']
  );

  return res.rows[0];
}

export async function updateUserProfile(id, { name, organisation, phone, city }) {
  const updates = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    updates.push(`name = $${idx++}`);
    values.push(name.trim());
  }
  if (organisation !== undefined) {
    updates.push(`organisation = $${idx++}`);
    values.push(organisation.trim());
  }
  if (phone !== undefined) {
    updates.push(`phone = $${idx++}`);
    values.push(phone.trim());
  }
  if (city !== undefined) {
    updates.push(`city = $${idx++}`);
    values.push(city.trim());
  }

  if (updates.length === 0) return findUserById(id);

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const res = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, role, organisation, phone, city, created_at AS "createdAt"`,
    values
  );

  return res.rows[0];
}

export async function getAllUsers() {
  const res = await query(
    `SELECT id, name, email, role, organisation, phone, city, created_at AS "createdAt"
     FROM users ORDER BY created_at DESC`
  );
  return res.rows;
}
