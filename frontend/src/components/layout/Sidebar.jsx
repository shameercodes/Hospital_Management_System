import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// Nav visibility mirrors backend route authorization. Empty roles => everyone.
const NAV = [
  { to: '/',             icon: '⊞', label: 'Dashboard',     roles: [] },
  { to: '/patients',     icon: '👥', label: 'Patients',      roles: ['admin','doctor','nurse','receptionist','accountant'] },
  { to: '/appointments', icon: '📅', label: 'Appointments',  roles: ['admin','doctor','nurse','receptionist','accountant'] },
  { to: '/doctors',      icon: '🩺', label: 'Doctors',       roles: [] },
  { to: '/wards',        icon: '🏥', label: 'Wards & Beds',  roles: [] },
  { to: '/lab',          icon: '🔬', label: 'Laboratory',    roles: ['admin','doctor','lab_technician','nurse','receptionist'] },
  { to: '/pharmacy',     icon: '💊', label: 'Pharmacy',      roles: [] },
  { to: '/billing',      icon: '💳', label: 'Billing',       roles: ['admin','accountant','receptionist','doctor'] },
  { to: '/reports',      icon: '📊', label: 'Reports',       roles: ['admin','accountant'] },
  { to: '/staff',        icon: '👤', label: 'Staff',         roles: ['admin'] },
  { to: '/audit',        icon: '🛡️', label: 'Audit Log',     roles: ['admin'] },
]

export default function Sidebar({ mobileOpen = false, onCloseMobile, isMobileDrawer = false }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visible = NAV.filter(n => n.roles.length === 0 || n.roles.includes(user?.role))
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??'

  const narrow = collapsed && !isMobileDrawer
  const toggleSidebar = () => {
    if (isMobileDrawer) onCloseMobile?.()
    else setCollapsed(c => !c)
  }

  const sidebarClass =
    `sidebar ${isMobileDrawer ? 'sidebar--drawer' : ''} ${mobileOpen && isMobileDrawer ? 'sidebar--open' : ''}`.trim()

  const asideStyle = {
    background: '#0b1220',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    transition: 'width .25s ease, transform .25s ease',
    overflow: 'hidden',
    ...(isMobileDrawer ? {} : { width: collapsed ? 60 : 240 }),
  }

  const linkNavigate = () => {
    if (isMobileDrawer) onCloseMobile?.()
  }

  return (
    <aside className={sidebarClass} style={asideStyle} aria-hidden={isMobileDrawer && !mobileOpen ? true : undefined}>
      {/* Logo */}
      <div className="sidebar-brand" style={{ padding: '18px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ width: 32, height: 32, background: '#0f6fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏥</div>
        {!narrow && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {import.meta.env.VITE_HOSPITAL_NAME || 'HMS'}
            </div>
            <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 10 }}>Management System</div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="sidebar-collapse-btn"
          aria-label={isMobileDrawer ? 'Close navigation menu' : narrow ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 4 }}
        >
          {isMobileDrawer ? '✕' : narrow ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {visible.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={linkNavigate}
            title={narrow ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              color: isActive ? '#fff' : 'rgba(148,163,184,1)',
              background: isActive ? 'rgba(15,111,255,.2)' : 'transparent',
              borderLeft: `3px solid ${isActive ? '#0f6fff' : 'transparent'}`,
              transition: 'all .15s', whiteSpace: 'nowrap', overflow: 'hidden'
            })}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
            {!narrow && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="av av-sm" style={{ background: 'rgba(15,111,255,.3)', color: '#90b4ff', flexShrink: 0 }}>{initials}</div>
          {!narrow && <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 10, textTransform: 'capitalize' }}>{user?.role?.replace('_',' ')}</div>
            </div>
            <button type="button" onClick={logout} title="Logout" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 16, padding: 4 }}>⏻</button>
          </>}
        </div>
      </div>
    </aside>
  )
}
