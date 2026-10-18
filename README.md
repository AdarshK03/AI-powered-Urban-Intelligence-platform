# AI-powered Urban Intelligence Platform (UIP)

An AI-powered urban civic management and intelligence platform designed to streamline issue tracking, department assignment, predictive resource allocation, and citizen engagement.

---

## 📁 Repository Structure

```text
AI-powered-UIP/
├── client/                     # React Frontend application (Vite, React 19, Tailwind CSS v4)
│   ├── public/                 # Static assets
│   ├── src/                    # Application source code
│   │   ├── assets/             # SVGs, icons, illustrations
│   │   ├── components/         # Reusable modular components
│   │   │   ├── admin/          # Admin dashboard tabs, modals, and route guards
│   │   │   │   ├── AllIssuesTab.jsx
│   │   │   │   ├── AnalyticsTab.jsx
│   │   │   │   ├── AssignmentsTab.jsx
│   │   │   │   ├── DepartmentsTab.jsx
│   │   │   │   ├── IssueDetailModal.jsx
│   │   │   │   ├── LogoutModal.jsx
│   │   │   │   ├── MapViewTab.jsx
│   │   │   │   ├── NewIssueModal.jsx
│   │   │   │   ├── NotificationsTab.jsx
│   │   │   │   ├── OverviewTab.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   ├── ReportsTab.jsx
│   │   │   │   ├── SettingsTab.jsx
│   │   │   │   └── Toast.jsx
│   │   │   └── public/         # Public pages layout and components
│   │   │       ├── CitizenLayout.jsx
│   │   │       └── Placeholder.jsx
│   │   ├── context/            # React Context stores
│   │   │   └── AuthContext.jsx # Backend-connected auth provider with localStorage sync
│   │   ├── pages/              # Top-level screen and page views
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── LoginPanel.jsx   # Citizen & general email/password login
│   │   │   ├── LoginScreen.jsx  # Municipal administrator login
│   │   │   ├── OnboardingPanel.jsx
│   │   │   └── SignUpPanel.jsx  # Real user registration connected to backend
│   │   ├── App.jsx             # Root layout & page switcher
│   │   ├── index.css           # Design system tokens and Tailwind CSS rules
│   │   └── main.jsx            # React root DOM renderer
│   ├── index.html              # HTML entry point
│   ├── package.json            # Client dependencies and npm scripts
│   └── vite.config.js          # Vite config with backend API proxy (/api -> localhost:5000)
├── server/                     # Node.js Express Authentication Backend
│   ├── controllers/            # Route controllers
│   │   └── authController.js   # Login, registration, profile, and logout
│   ├── data/                   # Persistent user storage and seed accounts
│   │   ├── users.js            # User retrieval, bcrypt hashing, and sanitization
│   │   └── users.json          # File persistence store for registered users
│   ├── middleware/             # Express middlewares
│   │   └── authMiddleware.js   # JWT authentication & role authorization guards
│   ├── routes/                 # API routes
│   │   └── authRoutes.js       # /api/auth routes
│   ├── .env                    # Server environment configuration
│   ├── package.json            # Backend dependencies (express, bcryptjs, jsonwebtoken, cors)
│   └── server.js               # Express application entrypoint
├── package.json                # Workspace root runner scripts
└── README.md                   # Project overview and documentation
```

---

## 🔐 Authentication System

The platform features a complete **Node.js / Express** authentication flow connected directly to the React frontend:

- **Email & Password Authentication**: Pure email and password login flow with validation shifted to the backend.
- **Password Security**: Passwords hashed with `bcryptjs`.
- **JWT Tokens**: Secure JSON Web Tokens issued on login and registration (`Bearer <token>`).
- **Session & Credentials Caching**: Active JWT token, user object, and last-used credentials stored in `localStorage` (`uip_token`, `uip_user`, `uip_credentials`).
- **Protected Routes**: Access to `/admin` is guarded by role-based authorization checking (`role === 'admin'`), and `/crew` is guarded for Field Crew Leaders (`role === 'crew'`).
- **Proxy Configuration**: Frontend Vite dev server proxies `/api` calls to `http://localhost:5001`.

### Pre-configured Test Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Municipal Administrator** | `admin@urban-intelligence.gov.in` | `admin123` | Municipal Admin Console (`/admin`) |
| **Field Crew Leader** | `crew@urban-intelligence.gov.in` | `crew123` | Crew Leader Operations (`/crew`) |
| **Citizen** | `citizen@urban-intelligence.in` | `citizen123` | Citizen Portal (`/citizen`) |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and uptime | No |
| `POST` | `/api/auth/login` | Authenticate with email & password | No |
| `POST` | `/api/auth/register` | Register new citizen or officer account | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (`Bearer <token>`) |
| `POST` | `/api/auth/logout` | End session | No |
| `GET` | `/api/auth/users` | List registered accounts | Yes (`admin` only) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended, v24 supported)
- npm or yarn

### 1. Install Dependencies
Run the following from the root directory to install both client and server packages:
```bash
npm run install:all
```

Or install them individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Start the Backend Server (`server`)
```bash
npm run server
# or: cd server && npm run dev
```
The server will start on `http://localhost:5001`.

### 3. Start the AI Model Service (`ml-service`)
In a new terminal:
```bash
cd ml-service
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
The AI inference service will start on `http://127.0.0.1:8000`.

### 4. Start the Frontend Application (`client`)
In a new terminal:
```bash
npm run client
# or: cd client && npm run dev
```
The client will start on `http://localhost:5173`.
