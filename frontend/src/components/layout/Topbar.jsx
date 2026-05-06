import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const TITLES = {
  '/':             { title: 'Dashboard',          sub: 'Hospital operations overview' },
  '/patients':     { title: 'Patient Management', sub: 'Register and manage patients' },
  '/appointments': { title: 'Appointments',       sub: 'Schedule and track appointments' },
  '/doctors':      { title: 'Doctors',            sub: 'Medical staff directory' },
  '/wards':        { title: 'Wards & Beds',       sub: 'Ward and bed allocation' },
  '/lab':          { title: 'Laboratory',         sub: 'Lab orders and test results' },
  '/pharmacy':     { title: 'Pharmacy',           sub: 'Medicine inventory management' },
  '/billing':      { title: 'Billing',              sub: 'Invoices and payment tracking' },
  '/reports':      { title: 'Reports',            sub: 'Analytics and performance data' },
  '/staff':        { title: 'Staff Management',   sub: 'Staff accounts and roles' },
  '/audit':        { title: 'Audit Log',           sub: 'Security and compliance trail' },
}

export default function Topbar({ showNavToggle = false, onOpenNav }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [now, setNow] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t) }, [])

  const key = Object.keys(TITLES).find(k => k === '/' ? pathname === '/' : pathname.startsWith(k)) || '/'
  const { title, sub } = TITLES[key]

  const greet = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <header className="topbar" style={{ minHeight: 62, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 16, flexShrink: 0 }}>
      {showNavToggle && (
        <button type="button" className="topbar-nav-btn" aria-label="Open navigation menu" onClick={onOpenNav}>
          <span aria-hidden>☰</span>
        </button>
      )}
      <div className="topbar-titles" style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        <p style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</p>
      </div>

      <div className="topbar-meta-time" style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
          {now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>

      <div className="topbar-user-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0, minWidth: 0 }}>
        <div className="av av-sm" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
        <div className="topbar-greet-lines" style={{ lineHeight: 1.2, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }} className="topbar-greet-name">{greet}, {user?.name?.split(' ')[0]}</div>
          <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'capitalize' }}>{user?.role?.replace('_',' ')}</div>
        </div>
      </div>
    </header>
  )
}
