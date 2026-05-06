# 🏥 Hospital Management System v2.0 — Professional MERN Stack

A production-ready, full-featured Hospital Management System built with MongoDB, Express.js, React, and Node.js.

---

## ✨ What's New in v2.0 (vs original)

| Feature | Original | v2.0 |
|---|---|---|
| Authentication | Basic | JWT + Role-based (7 roles) |
| Patient Records | Simple CRUD | Full EMR with vitals, allergies, history |
| Appointments | Basic booking | Slot-based scheduling, status workflow |
| Billing | None | Full invoicing, payments, insurance |
| Pharmacy | None | Inventory with low-stock/expiry alerts |
| Lab | None | Orders → Sample → Processing → Results |
| Wards | None | Visual bed grid with real-time occupancy |
| Dashboard | None | Live stats + revenue/appointment charts |
| Reports | None | Revenue, patient demographics, doctor analytics |
| Staff Management | None | Accounts, roles, activation |
| Security | None | Helmet, rate limiting, input validation |
| Data Seeder | None | Pre-loaded demo data |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone & Install

```bash
git clone <your-repo>
cd hospital-management-system
npm install                    # root
cd backend && npm install      # backend
cd ../frontend && npm install  # frontend
```

### 2. Configure Environment

```bash
# In /backend/
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=change_this_to_something_long_and_random
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

This creates demo data including admin, 4 doctors, nurses, wards, medicines, etc.

### 4. Run

```bash
# From root (runs both together)
npm run dev

# OR separately:
cd backend && npm run dev     # http://localhost:5000
cd frontend && npm start      # http://localhost:3000
```

---

## 🔐 Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@hospital.com | Admin@123 |
| Doctor | dr.ahmed@hospital.com | Doctor@123 |
| Doctor | dr.sara@hospital.com | Doctor@123 |
| Receptionist | reception.ali@hospital.com | Reception@123 |
| Pharmacist | pharmacy.usman@hospital.com | Pharmacy@123 |
| Lab Tech | lab.zara@hospital.com | Lab@12345 |

---

## 🏗️ Architecture

```
hospital-management-system/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic
│   ├── middleware/       # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── utils/           # Helpers, seeder
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/        # Login
        │   ├── layout/      # Sidebar, Topbar
        │   ├── dashboard/   # Overview + charts
        │   ├── patients/    # Patient management
        │   ├── appointments/# Scheduling
        │   ├── doctors/     # Doctor directory
        │   ├── wards/       # Bed management
        │   ├── lab/         # Lab tests
        │   ├── pharmacy/    # Medicines
        │   ├── billing/     # Invoices + payments
        │   ├── reports/     # Analytics
        │   └── staff/       # Staff accounts
        ├── context/         # Auth state
        └── utils/           # API client, helpers
```

---

## 🔌 API Endpoints

| Module | Base Route | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /login`, `GET /me`, `PUT /updatepassword` |
| Patients | `/api/patients` | Full CRUD, `POST /:id/vitals`, `PUT /:id/admit` |
| Appointments | `/api/appointments` | Full CRUD, `GET /slots/:doctorId/:date` |
| Doctors | `/api/doctors` | Full CRUD |
| Wards | `/api/wards` | Full CRUD, `PATCH /:id/beds/:bedId` |
| Billing | `/api/billing` | Full CRUD, `POST /:id/payment` |
| Pharmacy | `/api/pharmacy` | Full CRUD, `PATCH /:id/stock` |
| Lab | `/api/lab` | Full CRUD, `POST /:id/results` |
| Staff | `/api/staff` | GET, PUT, `PATCH /:id/toggle` |
| Dashboard | `/api/dashboard` | `GET /` |
| Reports | `/api/reports` | `GET /revenue`, `/patients`, `/appointments` |

---

## 👥 Role Permissions

| Role | Dashboard | Patients | Appt | Billing | Pharmacy | Lab | Reports | Staff |
|---|---|---|---|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| doctor | ✅ | ✅ | ✅ | View | View | ✅ | ❌ | ❌ |
| nurse | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| receptionist | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| pharmacist | ✅ | View | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| lab_technician | ✅ | View | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| accountant | ✅ | View | View | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## 🛡️ Security Features

- JWT authentication with expiry
- Password hashing with bcryptjs (12 rounds)
- Rate limiting (200 req/15min per IP)
- Helmet.js security headers
- Role-based access control on all routes
- Soft deletes (data never permanently removed)
- Input validation via mongoose schema validators

---

## 📈 Upgrade Roadmap

- [ ] Patient portal (public-facing)
- [ ] SMS/Email appointment reminders
- [ ] PDF invoice generation
- [ ] Audit log for all actions
- [ ] Multi-hospital / branch support
- [ ] DICOM viewer for radiology
- [ ] Mobile app (React Native)
