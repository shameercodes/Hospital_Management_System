// Reports.jsx
import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../utils/api.js'
import { formatCurrency } from '../../utils/helpers.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CLR = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4']

export function Reports() {
  const [rev, setRev] = useState([])
  const [pat, setPat] = useState(null)
  const [appt, setAppt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([reportsAPI.revenue(), reportsAPI.patients(), reportsAPI.appointments()])
      .then(([r, p, a]) => {
        setRev(r.data.data.map(d => ({ name: `${MONTHS[d._id.month-1]} ${d._id.year}`, revenue: d.revenue })))
        setPat(p.data.data); setAppt(a.data.data)
      }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spin-wrap"><div className="spin" /></div>

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>Analytics & Reports</h2>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-hd"><span className="card-title">Monthly Revenue</span></div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rev}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
            <Bar dataKey="revenue" fill="#0f6fff" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="g2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-hd"><span className="card-title">Patients by Gender</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pat?.byGender?.map(d => ({ name: d._id, value: d.count }))} cx="50%" cy="50%" outerRadius={75} dataKey="value">{pat?.byGender?.map((_,i) => <Cell key={i} fill={CLR[i]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} formatter={v => v?.charAt(0).toUpperCase() + v?.slice(1)} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-hd"><span className="card-title">Blood Groups</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pat?.byBloodGroup?.map(d => ({ name: d._id, value: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
              <Bar dataKey="value" radius={[3,3,0,0]}>{pat?.byBloodGroup?.map((_,i) => <Cell key={i} fill={CLR[i%CLR.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {appt?.byDoctor?.length > 0 && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Top Doctors by Appointments</span></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments</th><th>Share</th></tr></thead>
              <tbody>
                {appt.byDoctor.map((d, i) => {
                  const max = appt.byDoctor[0]?.count || 1
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{d.doctorName}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{d.specialization}</td>
                      <td><span className="mono" style={{ fontWeight: 700 }}>{d.count}</span></td>
                      <td style={{ minWidth: 100 }}><div className="prog"><div className="prog-bar" style={{ width: `${(d.count/max)*100}%`, background: 'var(--primary)' }} /></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
