import React, { useState, useEffect, useCallback } from 'react'
import { doctorAPI } from '../../utils/api.js'
import { DEPARTMENTS } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function Doctors() {
  const { isAdmin } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await doctorAPI.getAll({ department: dept }); setDoctors(res.data.data) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }, [dept])

  useEffect(() => { load() }, [load])

  const handleDelete = async doc => {
    if (!window.confirm(`Permanently delete ${doc.user?.name} (${doc.doctorId})?\n\nThis also deletes their user account.\n\nRefuses if there are upcoming appointments.\n\nThis cannot be undone.`)) return
    try { await doctorAPI.delete(doc._id); toast.success('Doctor deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <div className="spin-wrap"><div className="spin" /></div>

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Doctors <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({doctors.length})</span></h2>
      </div>
      <div className="filters">
        <select className="inp" style={{ width: 200 }} value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="g3">
        {doctors.map(doc => (
          <div className="card" key={doc._id}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div className="av av-lg">{doc.user?.name?.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.user?.name}</div>
                <div style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 500 }}>{doc.specialization}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{doc.department}</div>
              </div>
              <span className={`badge ${doc.isAvailable ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'flex-start', fontSize: 10 }}>
                {doc.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {doc.qualification?.map(q => <span key={q} className="badge badge-primary" style={{ fontSize: 10 }}>{q}</span>)}
            </div>
            <div className="g2" style={{ gap: 8 }}>
              {[['Experience', `${doc.experience} yrs`], ['Fee', `Rs. ${doc.consultationFee?.toLocaleString()}`], ['License', doc.licenseNumber], ['ID', doc.doctorId]].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--surface-2)', padding: '7px 10px', borderRadius: 7 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{v}</div>
                </div>
              ))}
            </div>
            {doc.schedule?.some(s => s.isAvailable) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 5 }}>Available Days</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {doc.schedule.filter(s => s.isAvailable).map(s => <span key={s.day} className="badge badge-neutral" style={{ fontSize: 10, textTransform: 'capitalize' }}>{s.day.slice(0,3)}</span>)}
                </div>
              </div>
            )}
            {isAdmin() && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(doc)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {!loading && doctors.length === 0 && <div className="empty"><div className="empty-ico">🩺</div><h3>No doctors found</h3></div>}
    </div>
  )
}
