import React, { useState, useEffect, useCallback } from 'react'
import { patientAPI } from '../../utils/api.js'
import { formatDate, calculateAge, getStatusBadge, BLOOD_GROUPS } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import PatientModal from './PatientModal.jsx'

export default function Patients() {
  const { isAdmin, canWrite } = useAuth()
  const canAdd = canWrite('admin','doctor','nurse','receptionist')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await patientAPI.getAll({ search, status, page, limit: 15 })
      setPatients(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast.error('Failed to load patients') }
    finally { setLoading(false) }
  }, [search, status, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, status])

  const handleDelete = async p => {
    const fullName = `${p.firstName} ${p.lastName}`
    if (!window.confirm(`Permanently delete ${fullName} (${p.patientId})?\n\nThis will also delete ALL their appointments, lab tests, and invoices, and free any ward bed they occupy.\n\nThis cannot be undone.`)) return
    const typed = window.prompt(`To confirm, type the patient's full name exactly:\n\n${fullName}\n\n(Or type DELETE to bypass.)`)
    if (typed === null) return
    if (typed.trim().toLowerCase() !== fullName.toLowerCase() && typed.trim().toUpperCase() !== 'DELETE') {
      toast.error('Confirmation did not match. Deletion cancelled.')
      return
    }
    try {
      const res = await patientAPI.delete(p._id, { confirmName: typed.trim() })
      const c = res.data.cascade || {}
      toast.success(`Deleted. Removed ${c.appointments||0} appointments, ${c.labTests||0} labs, ${c.invoices||0} invoices.`)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete') }
  }

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Patients <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({total})</span></h2>
        {canAdd && <button type="button" className="btn btn-primary" onClick={() => { setEdit(null); setModal(true) }}>+ Register Patient</button>}
      </div>

      <div className="filters">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <span className="search-ico">🔍</span>
          <input className="inp" placeholder="Name, ID, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="inp" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['outpatient','inpatient','discharged','critical','observation'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Age/Gender</th><th>Blood</th><th>Phone</th><th>Status</th><th>Registered</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : patients.length === 0
                  ? <tr><td colSpan={8}><div className="empty"><div className="empty-ico">👥</div><h3>No patients found</h3>{canAdd && <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setEdit(null); setModal(true) }}>+ Register Patient</button>}</div></td></tr>
                  : patients.map(p => (
                    <tr key={p._id}>
                      <td><span className="mono" style={{ color: 'var(--primary)' }}>{p.patientId}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="av av-sm">{p.firstName?.[0]}{p.lastName?.[0]}</div>
                          <div><div style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.email || '—'}</div></div>
                        </div>
                      </td>
                      <td>{calculateAge(p.dateOfBirth)} yrs · <span style={{ textTransform: 'capitalize' }}>{p.gender}</span></td>
                      <td><span className="badge badge-info">{p.bloodGroup || '?'}</span></td>
                      <td><span className="mono">{p.phone}</span></td>
                      <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{formatDate(p.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {canAdd && <button className="btn btn-sm btn-secondary" onClick={() => { setEdit(p); setModal(true) }}>Edit</button>}
                          {isAdmin() && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)} title="Permanently delete">Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: 14, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`btn btn-sm ${n === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="btn btn-sm btn-secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {modal && <PatientModal patient={edit} onClose={() => { setModal(false); setEdit(null) }} onSaved={() => { setModal(false); setEdit(null); load() }} />}
    </div>
  )
}
