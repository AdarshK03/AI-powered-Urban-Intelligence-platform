import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'users.json');

// Pre-seeded credentials
const DEFAULT_USERS = [
  {
    id: 'usr_admin_001',
    name: 'Municipal Administrator',
    email: 'admin@urban-intelligence.gov.in',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    organisation: 'Municipal Road Infrastructure Administration',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_citizen_001',
    name: 'Priya Sharma',
    email: 'citizen@urban-intelligence.in',
    passwordHash: bcrypt.hashSync('citizen123', 10),
    role: 'citizen',
    organisation: 'Civic Resident Association',
    createdAt: new Date().toISOString()
  }
];

// In-memory user cache with file-system persistence
let users = [];

function loadUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(data);
    } else {
      users = [...DEFAULT_USERS];
      saveUsers();
    }
  } catch (err) {
    console.error('Error loading users from file, initializing with defaults:', err);
    users = [...DEFAULT_USERS];
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users to file:', err);
  }
}

// Initial load
loadUsers();

export function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id) {
  if (!id) return null;
  return users.find((u) => u.id === id) || null;
}

export function createUser({ name, email, password, role = 'citizen', organisation = '' }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('A user with this email already exists.');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: role || 'citizen',
    organisation: organisation.trim() || 'Civic Participant',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();

  return sanitizeUser(newUser);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function getAllUsers() {
  return users.map(sanitizeUser);
}
