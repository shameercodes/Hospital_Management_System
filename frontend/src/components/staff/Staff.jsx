import React, { useState, useEffect, useCallback } from 'react'
import { staffAPI, authAPI } from '../../utils/api.js'
import { formatDate } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const ROLES = ['admin','doctor','nurse','receptionist','pharmacist','lab_technician','accountant']
const ROLE_CLR = { admin:'badge-danger', doctor:'badge-primary', nurse:'badge-info', receptionist:'badge-neutral', pharmacist:'badge-warning', lab_technician:'badge-success', accountant:'badge-neutral' }

export default function Staff() {
  const { user: currentUser } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleF, setRoleF] = useState('')
  const [modal, setModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await staffAPI.getAll({ role: roleF }); setStaff(res.data.data) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }, [roleF])

  useEffect(() => { load() }, [load])

  const toggle = async id => {
    try { await staffAPI.toggle(id); toast.success('Status updated'); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async s => {
    if (!window.confirm(`Permanently delete ${s.name} (${s.email})?\n\nThis removes their account and (for doctors) their doctor profile.\n\nThis cannot be undone.`)) return
    try { await staffAPI.delete(s._id); toast.success('Account deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Staff <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({staff.length})</span></h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Staff</button>
      </div>
      <div className="filters">
        <select className="inp" style={{ width: 180 }} value={roleF} onChange={e => setRoleF(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.replace('_',' ')}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Emp ID</th><th>Last Login</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : staff.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="av av-sm">{s.name?.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                        <div><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>{s.email}</div></div>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_CLR[s.role]||'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{s.role?.replace('_',' ')}</span></td>
                    <td style={{ fontSize: 13 }}>{s.department || '—'}</td>
                    <td><span className="mono">{s.employeeId || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.lastLogin ? formatDate(s.lastLogin) : 'Never'}</td>
                    <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className={`btn btn-sm ${s.isActive ? 'btn-warning' : 'btn-success'}`} onClick={() => toggle(s._id)}>
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {s._id !== currentUser?.id && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)} title="Permanently delete">Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
      {modal && <AddStaffModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />}
    </div>
  )
}

function AddStaffModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'receptionist', phone:'', department:'', employeeId:'' })
  const [loading, setLoading] = useState(false)
  const s = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await authAPI.register(form); toast.success('Staff account created'); onSaved() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>Add New Staff</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row2">
              <div className="fg"><label className="lbl">Full Name *</label><input className="inp" value={form.name} onChange={e => s('name', e.target.value)} required /></div>
              <div className="fg"><label className="lbl">Email *</label><input className="inp" type="email" value={form.email} onChange={e => s('email', e.target.value)} required /></div>
            </div>
            <div className="row2">
              <div className="fg"><label className="lbl">Password *</label><input className="inp" type="password" value={form.password} onChange={e => s('password', e.target.value)} required minLength={8} placeholder="Min 8 characters" /></div>
              <div className="fg"><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e => s('phone', e.target.value)} /></div>
            </div>
            <div className="row2">
              <div className="fg">
                <label className="lbl">Role *</label>
                <select className="inp" value={form.role} onChange={e => s('role', e.target.value)} required>
                  {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="fg"><label className="lbl">Department</label><input className="inp" value={form.department} onChange={e => s('department', e.target.value)} /></div>
            </div>
            <div className="fg"><label className="lbl">Employee ID</label><input className="inp" value={form.employeeId} onChange={e => s('employeeId', e.target.value)} placeholder="EMP-0010" /></div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
