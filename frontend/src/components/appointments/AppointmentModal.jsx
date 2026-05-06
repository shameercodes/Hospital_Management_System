import React, { useState, useEffect } from 'react'
import { appointmentAPI, doctorAPI, patientAPI } from '../../utils/api.js'
import toast from 'react-hot-toast'

export default function AppointmentModal({ appointment, onClose, onSaved }) {
  const isEdit = !!appointment
  const [form, setForm] = useState(appointment
    ? { ...appointment, patient: appointment.patient?._id || appointment.patient, doctor: appointment.doctor?._id || appointment.doctor, date: appointment.date?.split('T')[0] || '' }
    : { patient: '', doctor: '', date: '', timeSlot: '', type: 'consultation', priority: 'normal', chiefComplaint: '', symptoms: '' })
  const [doctors, setDoctors] = useState([])
  const [patSearch, setPatSearch] = useState(isEdit ? `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}` : '')
  const [patResults, setPatResults] = useState([])
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { doctorAPI.getAll().then(r => setDoctors(r.data.data)).catch(() => {}) }, [])

  useEffect(() => {
    if (patSearch.length >= 2 && !form.patient) {
      patientAPI.getAll({ search: patSearch, limit: 8 }).then(r => setPatResults(r.data.data)).catch(() => {})
    } else { setPatResults([]) }
  }, [patSearch, form.patient])

  useEffect(() => {
    if (form.doctor && form.date) {
      setLoadingSlots(true)
      appointmentAPI.getSlots(form.doctor, form.date).then(r => setSlots(r.data.data)).catch(() => setSlots([])).finally(() => setLoadingSlots(false))
    }
  }, [form.doctor, form.date])

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!isEdit && !form.patient) {
      toast.error('Please pick a patient from the dropdown (start typing a name and click a result).')
      return
    }
    if (!form.doctor)   { toast.error('Please select a doctor.'); return }
    if (!form.date)     { toast.error('Please pick a date.'); return }
    if (!form.timeSlot) { toast.error('Please pick a time slot.'); return }

    setLoading(true)
    try {
      const payload = { ...form, symptoms: form.symptoms ? (typeof form.symptoms === 'string' ? form.symptoms.split(',').map(s => s.trim()).filter(Boolean) : form.symptoms) : [] }
      if (isEdit) await appointmentAPI.update(appointment._id, payload)
      else await appointmentAPI.create(payload)
      toast.success(isEdit ? 'Appointment updated' : 'Appointment booked')
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? 'Edit Appointment' : 'Book Appointment'}</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Patient */}
            <div className="fg">
              <label className="lbl">Patient *</label>
              {isEdit
                ? <input className="inp" disabled value={patSearch} />
                : <div style={{ position: 'relative' }}>
                    <input
                      className="inp"
                      placeholder="Search patient by name, ID, or phone…"
                      value={patSearch}
                      onChange={e => { setPatSearch(e.target.value); set('patient', '') }}
                      style={{ borderColor: form.patient ? '#10b981' : (patSearch && !form.patient ? '#f59e0b' : undefined) }}
                    />
                    {patResults.length > 0 && !form.patient && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, maxHeight: 180, overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                        {patResults.map(p => (
                          <div key={p._id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { set('patient', p._id); setPatSearch(`${p.firstName} ${p.lastName} (${p.patientId})`); setPatResults([]) }}>
                            <strong>{p.firstName} {p.lastName}</strong> <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{p.patientId} · {p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.patient && (
                      <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>✓ Patient selected</div>
                    )}
                    {!form.patient && patSearch.length >= 2 && patResults.length === 0 && (
                      <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>No matching patients — keep typing or register a new patient first.</div>
                    )}
                    {!form.patient && patSearch.length >= 2 && patResults.length > 0 && (
                      <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Click a result to select the patient.</div>
                    )}
                  </div>
              }
            </div>
            {/* Doctor */}
            <div className="fg">
              <label className="lbl">Doctor *</label>
              <select className="inp" value={form.doctor} onChange={e => set('doctor', e.target.value)} required>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name} — {d.specialization} (Rs. {d.consultationFee?.toLocaleString()})</option>)}
              </select>
            </div>
            <div className="row2">
              <div className="fg">
                <label className="lbl">Date *</label>
                <input className="inp" type="date" value={form.date} onChange={e => set('date', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="fg">
                <label className="lbl">Time Slot *</label>
                {loadingSlots
                  ? <div className="inp" style={{ color: 'var(--text-3)' }}>Loading slots…</div>
                  : <select className="inp" value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)} required>
                      <option value="">Select Slot</option>
                      {slots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                }
              </div>
            </div>
            <div className="row2">
              <div className="fg">
                <label className="lbl">Type</label>
                <select className="inp" value={form.type} onChange={e => set('type', e.target.value)}>
                  {['consultation','follow-up','emergency','procedure','checkup'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="lbl">Priority</label>
                <select className="inp" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="fg"><label className="lbl">Chief Complaint</label><input className="inp" value={form.chiefComplaint || ''} onChange={e => set('chiefComplaint', e.target.value)} placeholder="Main reason for visit" /></div>
            <div className="fg"><label className="lbl">Symptoms (comma-separated)</label><input className="inp" value={form.symptoms || ''} onChange={e => set('symptoms', e.target.value)} placeholder="fever, headache, cough" /></div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Book Appointment'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
