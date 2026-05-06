import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

import Sidebar   from './components/layout/Sidebar.jsx'
import Topbar    from './components/layout/Topbar.jsx'
import Login     from './components/auth/Login.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import Patients  from './components/patients/Patients.jsx'
import Appointments from './components/appointments/Appointments.jsx'
import Doctors   from './components/doctors/Doctors.jsx'
import Wards     from './components/wards/Wards.jsx'
import Lab       from './components/lab/Lab.jsx'
import Pharmacy  from './components/pharmacy/Pharmacy.jsx'
import Billing   from './components/billing/Billing.jsx'
import Reports   from './components/reports/Reports.jsx'
import Staff     from './components/staff/Staff.jsx'
import AuditLog  from './components/audit/AuditLog.jsx'
import { useMediaQuery } from './hooks/useMediaQuery.js'

function Guard({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function Layout({ children }) {
  const isMobileNav = useMediaQuery('(max-width: 900px)')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!isMobileNav) setMobileNavOpen(false)
  }, [isMobileNav])

  useEffect(() => {
    if (mobileNavOpen && isMobileNav) {
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
    }
    return () => { document.documentElement.style.overflow = '' }
  }, [mobileNavOpen, isMobileNav])

  useEffect(() => {
    const onEscape = e => {
      if (e.key !== 'Escape' || !mobileNavOpen || !isMobileNav) return
      setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [mobileNavOpen, isMobileNav])

  return (
    <div className={`app${mobileNavOpen && isMobileNav ? ' app--nav-open' : ''}`}>
      {mobileNavOpen && isMobileNav && (
        <div className="sidebar-backdrop" role="presentation" onClick={() => setMobileNavOpen(false)} />
      )}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        isMobileDrawer={isMobileNav}
      />
      <div className="main">
        <Topbar showNavToggle={isMobileNav} onOpenNav={() => setMobileNavOpen(true)} />
        <div className="page">{children}</div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: 13, borderRadius: 8, fontFamily: 'DM Sans, sans-serif' }
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Guard><Layout><Dashboard /></Layout></Guard>} />
          <Route path="/patients/*" element={<Guard roles={['admin','doctor','nurse','receptionist','accountant']}><Layout><Patients /></Layout></Guard>} />
          <Route path="/appointments/*" element={<Guard roles={['admin','doctor','nurse','receptionist','accountant']}><Layout><Appointments /></Layout></Guard>} />
          <Route path="/doctors/*" element={<Guard><Layout><Doctors /></Layout></Guard>} />
          <Route path="/wards/*" element={<Guard><Layout><Wards /></Layout></Guard>} />
          <Route path="/lab/*" element={<Guard roles={['admin','doctor','lab_technician','nurse','receptionist']}><Layout><Lab /></Layout></Guard>} />
          <Route path="/pharmacy/*" element={<Guard><Layout><Pharmacy /></Layout></Guard>} />
          <Route path="/billing/*" element={<Guard roles={['admin','accountant','receptionist','doctor']}><Layout><Billing /></Layout></Guard>} />
          <Route path="/reports/*" element={<Guard roles={['admin','accountant']}><Layout><Reports /></Layout></Guard>} />
          <Route path="/staff/*" element={<Guard roles={['admin']}><Layout><Staff /></Layout></Guard>} />
          <Route path="/audit/*" element={<Guard roles={['admin']}><Layout><AuditLog /></Layout></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
