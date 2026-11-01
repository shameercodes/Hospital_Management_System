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
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)

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

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Doctors <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({doctors.length})</span></h2>
        {isAdmin() && <button type="button" className="btn btn-primary" onClick={() => { setEdit(null); setModal(true) }}>+ Add Doctor</button>}
      </div>
      <div className="filters">
        <select className="inp" style={{ width: 200 }} value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {loading
        ? <div className="spin-wrap"><div className="spin" /></div>
        : (
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
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setEdit(doc); setModal(true) }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(doc)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
      {!loading && doctors.length === 0 && (
        <div className="empty">
          <div className="empty-ico">🩺</div>
          <h3>No doctors found</h3>
          {isAdmin() && <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setEdit(null); setModal(true) }}>+ Add Doctor</button>}
        </div>
      )}
      {modal && <DoctorModal doctor={edit} onClose={() => { setModal(false); setEdit(null) }} onSaved={() => { setModal(false); setEdit(null); load() }} />}
    </div>
  )
}

function DoctorModal({ doctor, onClose, onSaved }) {
  const isEdit = !!doctor
  const [form, setForm] = useState(() => isEdit
    ? {
        name: doctor.user?.name || '',
        email: doctor.user?.email || '',
        phone: doctor.user?.phone || '',
        password: '',
        specialization: doctor.specialization || '',
        department: doctor.department || '',
        licenseNumber: doctor.licenseNumber || '',
        consultationFee: doctor.consultationFee || 500,
        experience: doctor.experience || 0,
        qualification: (doctor.qualification || []).join(', '),
        isAvailable: doctor.isAvailable !== false,
      }
    : {
        name: '', email: '', phone: '', password: '',
        specialization: '', department: 'Internal Medicine', licenseNumber: '',
        consultationFee: 1500, experience: 0, qualification: 'MBBS', isAvailable: true,
      })
  const [loading, setLoading] = useState(false)
  const s = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        consultationFee: Number(form.consultationFee) || 0,
        experience: Number(form.experience) || 0,
        qualification: form.qualification ? form.qualification.split(',').map(x => x.trim()).filter(Boolean) : [],
        isAvailable: form.isAvailable,
      }
      if (isEdit) {
        await doctorAPI.update(doctor._id, payload)
        toast.success('Doctor updated')
      } else {
        if (!form.password || form.password.length < 8) {
          toast.error('Password must be at least 8 characters and include a number')
          setLoading(false)
          return
        }
        payload.password = form.password
        await doctorAPI.create(payload)
        toast.success('Doctor added')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save doctor')
    } finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row2">
              <div className="fg"><label className="lbl">Full Name *</label><input className="inp" value={form.name} onChange={e => s('name', e.target.value)} required disabled={isEdit} /></div>
              <div className="fg"><label className="lbl">Email *</label><input className="inp" type="email" value={form.email} onChange={e => s('email', e.target.value)} required disabled={isEdit} /></div>
            </div>
            {!isEdit && (
              <div className="row2">
                <div className="fg"><label className="lbl">Login Password *</label><input className="inp" type="password" value={form.password} onChange={e => s('password', e.target.value)} required minLength={8} placeholder="Min 8 chars, include a number" /></div>
                <div className="fg"><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e => s('phone', e.target.value)} /></div>
              </div>
            )}
            {isEdit && <div className="fg"><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={e => s('phone', e.target.value)} /></div>}
            <div className="row2">
              <div className="fg"><label className="lbl">Specialization *</label><input className="inp" value={form.specialization} onChange={e => s('specialization', e.target.value)} required placeholder="Cardiologist" /></div>
              <div className="fg">
                <label className="lbl">Department *</label>
                <select className="inp" value={form.department} onChange={e => s('department', e.target.value)} required>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="row3">
              <div className="fg"><label className="lbl">License *</label><input className="inp" value={form.licenseNumber} onChange={e => s('licenseNumber', e.target.value)} required /></div>
              <div className="fg"><label className="lbl">Fee (Rs.)</label><input className="inp" type="number" min="0" value={form.consultationFee} onChange={e => s('consultationFee', e.target.value)} /></div>
              <div className="fg"><label className="lbl">Experience (yrs)</label><input className="inp" type="number" min="0" value={form.experience} onChange={e => s('experience', e.target.value)} /></div>
            </div>
            <div className="fg"><label className="lbl">Qualifications</label><input className="inp" value={form.qualification} onChange={e => s('qualification', e.target.value)} placeholder="MBBS, FCPS" /></div>
            {isEdit && (
              <div className="fg">
                <label className="lbl">Availability</label>
                <select className="inp" value={form.isAvailable ? 'yes' : 'no'} onChange={e => s('isAvailable', e.target.value === 'yes')}>
                  <option value="yes">Available</option>
                  <option value="no">Unavailable</option>
                </select>
              </div>
            )}
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Doctor'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
