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
│   │   ├── pages/              # Top-level screen and page views
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── LoginPanel.jsx
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── OnboardingPanel.jsx
│   │   │   └── SignUpPanel.jsx
│   │   ├── App.jsx             # Root layout & page switcher
│   │   ├── index.css           # Design system tokens and Tailwind CSS rules
│   │   └── main.jsx            # React root DOM renderer
│   ├── index.html              # HTML entry point
│   ├── package.json            # Client dependencies and npm scripts
│   └── vite.config.js          # Vite and Tailwind CSS plugins configuration
└── README.md                   # Project overview and documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Running the Frontend (`client`)

1. Change directory to the client:
   ```bash
   cd client
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run linter:
   ```bash
   npm run lint
   ```
