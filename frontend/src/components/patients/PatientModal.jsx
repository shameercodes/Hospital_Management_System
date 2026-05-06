import React, { useState } from 'react'
import { patientAPI } from '../../utils/api.js'
import { BLOOD_GROUPS } from '../../utils/helpers.js'
import toast from 'react-hot-toast'

const DEF = { firstName:'',lastName:'',dateOfBirth:'',gender:'',bloodGroup:'',phone:'',email:'', address:{street:'',city:'',state:'',postalCode:'',country:'Pakistan'}, emergencyContact:{name:'',relationship:'',phone:''}, chronicConditions:'',notes:'' }

export default function PatientModal({ patient, onClose, onSaved }) {
  const isEdit = !!patient
  const [form, setForm] = useState(isEdit ? { ...patient, address: patient.address || DEF.address, emergencyContact: patient.emergencyContact || DEF.emergencyContact, chronicConditions: patient.chronicConditions?.join(', ') || '' } : DEF)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('basic')

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const setN = (parent, f, v) => setForm(p => ({ ...p, [parent]: { ...p[parent], [f]: v } }))

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form, chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [] }
      if (isEdit) await patientAPI.update(patient._id, payload)
      else await patientAPI.create(payload)
      toast.success(isEdit ? 'Patient updated' : 'Patient registered')
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-hd">
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? 'Edit Patient' : 'Register New Patient'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="tabs" style={{ padding: '0 24px', marginBottom: 0 }}>
          {['basic','address','emergency','medical'].map(t => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>)}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {tab === 'basic' && <>
              <div className="row2"><div className="fg"><label className="lbl">First Name *</label><input className="inp" value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div><div className="fg"><label className="lbl">Last Name *</label><input className="inp" value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></div></div>
              <div className="row3">
                <div className="fg"><label className="lbl">Date of Birth *</label><input className="inp" type="date" value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''} onChange={e => set('dateOfBirth', e.target.value)} required /></div>
                <div className="fg"><label className="lbl">Gender *</label><select className="inp" value={form.gender} onChange={e => set('gender', e.target.value)} required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                <div className="fg"><label className="lbl">Blood Group</label><select className="inp" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}><option value="">Unknown</option>{BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              </div>
              <div className="row2"><div className="fg"><label className="lbl">Phone *</label><input className="inp" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+92-300-0000000" /></div><div className="fg"><label className="lbl">Email</label><input className="inp" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div></div>
            </>}
            {tab === 'address' && <>
              <div className="fg"><label className="lbl">Street</label><input className="inp" value={form.address?.street || ''} onChange={e => setN('address','street',e.target.value)} /></div>
              <div className="row3"><div className="fg"><label className="lbl">City</label><input className="inp" value={form.address?.city || ''} onChange={e => setN('address','city',e.target.value)} /></div><div className="fg"><label className="lbl">State</label><input className="inp" value={form.address?.state || ''} onChange={e => setN('address','state',e.target.value)} /></div><div className="fg"><label className="lbl">Postal Code</label><input className="inp" value={form.address?.postalCode || ''} onChange={e => setN('address','postalCode',e.target.value)} /></div></div>
            </>}
            {tab === 'emergency' && <>
              <div className="fg"><label className="lbl">Contact Name</label><input className="inp" value={form.emergencyContact?.name || ''} onChange={e => setN('emergencyContact','name',e.target.value)} /></div>
              <div className="row2"><div className="fg"><label className="lbl">Relationship</label><select className="inp" value={form.emergencyContact?.relationship || ''} onChange={e => setN('emergencyContact','relationship',e.target.value)}><option value="">Select</option>{['spouse','parent','sibling','child','friend','other'].map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}</select></div><div className="fg"><label className="lbl">Phone</label><input className="inp" value={form.emergencyContact?.phone || ''} onChange={e => setN('emergencyContact','phone',e.target.value)} /></div></div>
            </>}
            {tab === 'medical' && <>
              <div className="fg"><label className="lbl">Chronic Conditions (comma-separated)</label><input className="inp" value={form.chronicConditions || ''} onChange={e => set('chronicConditions', e.target.value)} placeholder="Diabetes, Hypertension…" /></div>
              <div className="fg"><label className="lbl">Notes</label><textarea className="inp" rows={4} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
            </>}
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Register Patient'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
