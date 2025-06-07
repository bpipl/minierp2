# Mini-ERP Order Management QC App

A comprehensive internal web application for managing laptop part orders, quality control processes, and inter-location operations.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM

## 📋 Features Overview

### Phase 1: Foundation & Authentication (97% Complete)
- [x] Project setup with React + Vite + Supabase + Tailwind + Shadcn/ui
- [x] Database schema design (SQL scripts ready)
- [x] User authentication system with role-based permissions
- [x] Login interface with validation
- [x] Role-based navigation system
- [ ] Database tables deployment (pending MCP activation)
- [ ] Admin panel for user/role management (UI ready, needs DB)
- [ ] New device login alerts (logic ready, needs DB)

### Phase 2: Order Management Core (50% Complete)
- [x] Order line card-based UI with progressive quantity display
- [x] Orders listing page with search and filters
- [x] ETA management with color-coded indicators
- [x] Sample data demonstration
- [ ] Order import/creation (manual, CSV, Google Sheets) - needs DB
- [ ] Real-time UI updates via Supabase - needs DB
- [ ] WhatsApp integration - needs N8N setup

### Future Phases
- CT Number Management & FAI System
- SB Workflow & Quantity Tracking
- Label Design & Printing System
- Invoicing & Procurement Features
- NP Location & Inter-Location Transfers
- AI-Powered Enhancements

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MiniERP2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📊 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── forms/          # Form components
│   ├── cards/          # Order card components
│   └── modals/         # Modal dialogs
├── features/           # Feature-based modules
│   ├── auth/           # Authentication
│   ├── orders/         # Order management
│   ├── ct-numbers/     # CT number management
│   ├── fai/            # FAI document handling
│   ├── workflows/      # SB/NP workflows
│   ├── invoicing/      # Invoicing module
│   ├── procurement/    # Procurement features
│   └── admin/          # Admin functionality
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── stores/             # Zustand stores
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following key entities:

- **Users & Roles**: Authentication and role-based permissions
- **Order Lines**: Core order management with quantity tracking
- **CT Numbers**: Serial number management with duplicate detection
- **FAI Documents**: First Article Inspection document handling
- **Quantity Logs**: Detailed audit trail for all quantity movements
- **Transfers**: Inter-location transfer management

See `docs/ARCHITECTURE.md` for detailed schema documentation.

## 👥 User Roles

1. **Director/Admin**: Full system access and administrative controls
2. **Accountant**: Invoicing and financial data access
3. **Warehouse Operations Manager**: SB location oversight
4. **SB Kitting/Packing Staff**: Simplified kitting/packing interface
5. **SB Screening/QC Staff**: Quality control workflow access
6. **NP Location Manager**: NP operations and transfer management
7. **NP QC/Testing Staff**: NP testing and quality control
8. **Procurement Staff**: Vendor communication and procurement tools

## 🔐 Security Features

- Row-level security (RLS) on all database tables
- Role-based access control (RBAC)
- New device login detection and alerts
- Comprehensive audit logging
- Secure file upload and storage

## 📚 Documentation

- [Development Phases](docs/PHASES.md) - Detailed development roadmap
- [Technical Architecture](docs/ARCHITECTURE.md) - System design and tech stack
- [Feature TODO](docs/TODO.md) - Comprehensive feature checklist
- [Requirements](REQUIREMENTS.md) - Complete business requirements

## 🚀 Deployment

The application is designed for deployment with:
- **Frontend**: Vercel with automatic deployments
- **Backend**: Supabase Cloud with backup strategy
- **File Storage**: Supabase Storage with CDN
- **Monitoring**: Supabase Dashboard + custom analytics

## 🤝 Contributing

This is an internal company project. For development:

1. Follow the phase-based development approach outlined in `docs/PHASES.md`
2. Update the TODO checklist in `docs/TODO.md` as features are completed
3. Maintain comprehensive commit messages and documentation
4. Test all role-based permissions thoroughly

## 📞 Support

For technical support or questions about the system, contact the development team.

---

**Project Status**: Phase 1 (Foundation & Authentication) - In Progress  
**Target Users**: 20-30 internal company staff  
**Expected Codebase Size**: 50,000-100,000 lines of code