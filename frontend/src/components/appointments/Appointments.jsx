import React, { useState, useEffect, useCallback } from 'react'
import { appointmentAPI } from '../../utils/api.js'
import { formatDate, getStatusBadge } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import AppointmentModal from './AppointmentModal.jsx'

export default function Appointments() {
  const { isAdmin, canWrite } = useAuth()
  const canAdd = canWrite('admin','doctor','nurse','receptionist')
  const [apts, setApts] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 25 }
      if (date) params.date = date
      if (status) params.status = status
      const res = await appointmentAPI.getAll(params)
      setApts(res.data.data); setTotal(res.data.total)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [date, status])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, s) => {
    try { await appointmentAPI.update(id, { status: s }); toast.success('Updated'); load() }
    catch { toast.error('Failed') }
  }

  const handleCancel = async a => {
    if (a.status === 'cancelled') return
    const reason = window.prompt(`Cancel appointment ${a.appointmentId}?\nReason (optional):`, '')
    if (reason === null) return
    try { await appointmentAPI.cancel(a._id, reason); toast.success('Appointment cancelled'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async a => {
    if (!window.confirm(`Permanently delete appointment ${a.appointmentId}?\n\nThis removes the record from the database and detaches any linked lab tests / invoices.\n\nThis cannot be undone.`)) return
    try { await appointmentAPI.delete(a._id); toast.success('Appointment deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const NEXT = { scheduled: { label: 'Confirm', next: 'confirmed', cls: 'btn-primary' }, confirmed: { label: 'Start', next: 'in-progress', cls: 'btn-warning' }, 'in-progress': { label: 'Complete', next: 'completed', cls: 'btn-success' } }

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Appointments <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({total})</span></h2>
        {canAdd && <button type="button" className="btn btn-primary" onClick={() => { setEdit(null); setModal(true) }}>+ New Appointment</button>}
      </div>
      <div className="filters">
        <input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
        <button className="btn btn-sm btn-secondary" onClick={() => setDate('')}>All Dates</button>
        <select className="inp" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['scheduled','confirmed','in-progress','completed','cancelled','no-show'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Fee</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : apts.length === 0
                  ? <tr><td colSpan={9}><div className="empty"><div className="empty-ico">📅</div><h3>No appointments</h3>{canAdd && <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setEdit(null); setModal(true) }}>+ New Appointment</button>}</div></td></tr>
                  : apts.map(a => (
                    <tr key={a._id}>
                      <td><span className="mono" style={{ color: 'var(--primary)' }}>{a.appointmentId}</span></td>
                      <td><div style={{ fontWeight: 500 }}>{a.patient?.firstName} {a.patient?.lastName}</div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>{a.patient?.patientId}</div></td>
                      <td><div style={{ fontWeight: 500 }}>{a.doctor?.user?.name}</div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>{a.doctor?.specialization}</div></td>
                      <td style={{ fontSize: 12 }}>{formatDate(a.date)}</td>
                      <td><span className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>{a.timeSlot}</span></td>
                      <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{a.type}</span></td>
                      <td><span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span></td>
                      <td><span className="mono">Rs. {(a.fee||0).toLocaleString()}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {canAdd && <button className="btn btn-sm btn-secondary" onClick={() => { setEdit(a); setModal(true) }}>Edit</button>}
                          {NEXT[a.status] && <button className={`btn btn-sm ${NEXT[a.status].cls}`} onClick={() => updateStatus(a._id, NEXT[a.status].next)}>{NEXT[a.status].label}</button>}
                          {!['cancelled','completed'].includes(a.status) && <button className="btn btn-sm btn-warning" onClick={() => handleCancel(a)} title="Cancel (mark cancelled)">Cancel</button>}
                          {isAdmin() && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a)} title="Permanently delete">Delete</button>}
                        </div>
                      </td>

                    </tr>
                  ))
              }
            </tbody>
            
          </table>
        </div>
      </div>
      {modal && <AppointmentModal appointment={edit} onClose={() => { setModal(false); setEdit(null) }} onSaved={() => { setModal(false); load() }} />}
    </div>
  )
}
