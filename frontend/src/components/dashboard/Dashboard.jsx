import React, { useState, useEffect } from 'react'
import { dashboardAPI } from '../../utils/api.js'
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers.js'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#6b7280']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.get().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spin-wrap"><div className="spin" /></div>
  if (!data)   return <div className="empty"><div className="empty-ico">⚠️</div><h3>Failed to load dashboard</h3></div>

  const { stats, recentAppointments = [], appointmentsByStatus = [], revenueByMonth = [] } = data

  const revData  = revenueByMonth.map(r => ({ name: `${MONTHS[r._id.month - 1]}`, revenue: r.revenue }))
  const apptData = appointmentsByStatus.map(s => ({ name: s._id, value: s.count }))

  const totalBeds    = stats.wards?.reduce((s, w) => s + (w.totalBeds || 0), 0) || 0
  const occupiedBeds = stats.wards?.reduce((s, w) => s + (w.occupied || 0), 0) || 0
  const occRate      = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const STATS = [
    { label: 'Total Patients',   value: stats.patients.total,          sub: `+${stats.patients.newToday} today`,      icon: '👥', bg: '#e8f4ff', clr: '#1d4ed8' },
    { label: "Today's Appts",    value: stats.appointments.today,       sub: `${stats.appointments.pending} pending`,  icon: '📅', bg: '#fef3c7', clr: '#92400e' },
    { label: 'Monthly Revenue',  value: formatCurrency(stats.revenue.thisMonth), sub: `${stats.revenue.growth > 0 ? '↑' : '↓'} ${Math.abs(stats.revenue.growth)}% vs last month`, icon: '💰', bg: '#ecfdf5', clr: '#065f46', change: stats.revenue.growth > 0 ? 'up' : 'dn' },
    { label: 'Active Doctors',   value: stats.doctors.available,        sub: `of ${stats.doctors.total} total`,        icon: '🩺', bg: '#f3e8ff', clr: '#7e22ce' },
    { label: 'Pending Bills',    value: stats.billing.pending,          sub: `${stats.billing.overdue} overdue`,       icon: '💳', bg: '#fef2f2', clr: '#991b1b' },
    { label: 'Lab Tests Pending',value: stats.lab.pending,              sub: 'awaiting results',                        icon: '🔬', bg: '#f0fdf4', clr: '#166534' },
    { label: 'Low Stock Meds',   value: stats.pharmacy.lowStock,        sub: `${stats.pharmacy.expired} expired`,      icon: '💊', bg: '#fff7ed', clr: '#9a3412' },
    { label: 'Bed Occupancy',    value: `${occRate}%`,                  sub: `${occupiedBeds}/${totalBeds} beds`,       icon: '🛏', bg: '#e0f2fe', clr: '#0369a1', prog: occRate },
  ]

  return (
    <div>
      {/* Stat cards */}
      <div className="g4" style={{ marginBottom: 20 }}>
        {STATS.map((s, i) => (
          <div className="stat" key={i}>
            <div className="stat-icon" style={{ background: s.bg, color: s.clr }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="stat-val">{s.value}</div>
              <div className="stat-lbl">{s.label}</div>
              {s.prog !== undefined ? (
                <div style={{ marginTop: 6 }}>
                  <div className="prog"><div className="prog-bar" style={{ width: `${s.prog}%`, background: s.prog > 85 ? 'var(--danger)' : s.prog > 70 ? 'var(--warning)' : 'var(--success)' }} /></div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ) : (
                <div className={`stat-sub ${s.change || ''}`}>{s.sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-hd"><span className="card-title">Revenue Trend</span><span style={{ fontSize: 12, color: 'var(--text-2)' }}>Last 6 months</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revData}>
              <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f6fff" stopOpacity={.15}/><stop offset="95%" stopColor="#0f6fff" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0f6fff" strokeWidth={2} fill="url(#gr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-hd"><span className="card-title">Appointments by Status</span><span style={{ fontSize: 12, color: 'var(--text-2)' }}>This month</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={apptData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {apptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v.charAt(0).toUpperCase() + v.slice(1)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom */}
      <div className="g2">
        <div className="card">
          <div className="card-hd"><span className="card-title">Today's Schedule</span><span style={{ fontSize: 12, color: 'var(--text-2)' }}>{recentAppointments.length} appointments</span></div>
          {recentAppointments.length === 0
            ? <div className="empty" style={{ padding: 24 }}><div className="empty-ico">📅</div><p>No appointments today</p></div>
            : recentAppointments.slice(0, 7).map(a => (
              <div key={a._id} className="dash-schedule-row" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <div className="av av-sm">{a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}</div>
                <div className="dash-schedule-meta">
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Dr. {a.doctor?.user?.name} · {a.timeSlot}</div>
                </div>
                <span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span>
              </div>
            ))
          }
        </div>

        <div className="card">
          <div className="card-hd"><span className="card-title">Ward Occupancy</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.wards?.map(w => {
              const rate = w.totalBeds ? Math.round((w.occupied / w.totalBeds) * 100) : 0
              return (
                <div key={w._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{w.name}</span>
                    <span style={{ color: 'var(--text-2)' }}>{w.occupied}/{w.totalBeds}</span>
                  </div>
                  <div className="prog"><div className="prog-bar" style={{ width: `${rate}%`, background: rate > 85 ? 'var(--danger)' : rate > 70 ? 'var(--warning)' : 'var(--success)' }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
