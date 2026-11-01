import React, { useState, useEffect, useCallback } from 'react'
import { wardAPI } from '../../utils/api.js'
import { WARD_TYPES } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const BED_CLR = { available: '#10b981', occupied: '#f59e0b', maintenance: '#94a3b8', reserved: '#3b82f6' }

export default function Wards() {
  const { isAdmin } = useAuth()
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    wardAPI.getAll().then(r => { setWards(r.data.data); if (r.data.data.length) setSel(r.data.data[0]) })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async w => {
    if (!window.confirm(`Permanently delete ward "${w.name}"?\n\nRefuses if any beds are occupied.\n\nThis cannot be undone.`)) return
    try {
      await wardAPI.delete(w._id)
      toast.success('Ward deleted')
      setSel(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const totalBeds    = wards.reduce((s, w) => s + (w.totalBeds || 0), 0)
  const occupiedBeds = wards.reduce((s, w) => s + (w.occupiedBeds || 0), 0)

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Wards & Bed Management</h2>
        {isAdmin() && <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>+ Add Ward</button>}
      </div>
      {loading && <div className="spin-wrap"><div className="spin" /></div>}
      {!loading && (
      <>
      <div className="g4" style={{ marginBottom: 18 }}>
        {[['Total Beds', totalBeds, '#3b82f6', '#eff6ff'], ['Occupied', occupiedBeds, '#f59e0b', '#fffbeb'], ['Available', totalBeds - occupiedBeds, '#10b981', '#ecfdf5'], ['Occupancy', totalBeds ? `${Math.round((occupiedBeds/totalBeds)*100)}%` : '0%', '#8b5cf6', '#f5f3ff']].map(([l,v,c,bg]) => (
          <div className="card" key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛏</div>
            <div><div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>{l}</div></div>
          </div>
        ))}
      </div>

      <div className="g2">
        {/* Ward list */}
        <div className="card">
          <div className="card-hd"><span className="card-title">Wards</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {wards.map(w => {
              const occ = w.occupiedBeds || 0
              const rate = w.totalBeds ? Math.round((occ / w.totalBeds) * 100) : 0
              return (
                <div key={w._id} onClick={() => setSel(w)}
                  style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${sel?._id === w._id ? 'var(--primary)' : 'var(--border)'}`, background: sel?._id === w._id ? 'var(--primary-light)' : 'var(--surface-2)', transition: '.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div><span style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</span><span className="badge badge-neutral" style={{ marginLeft: 6, fontSize: 10, textTransform: 'capitalize' }}>{w.type}</span></div>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{occ}/{w.totalBeds}</span>
                  </div>
                  <div className="prog"><div className="prog-bar" style={{ width: `${rate}%`, background: rate > 85 ? 'var(--danger)' : rate > 70 ? 'var(--warning)' : 'var(--success)' }} /></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bed grid */}
        <div className="card">
          <div className="card-hd">
            <span className="card-title">{sel?.name || 'Select a ward'}</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {Object.entries(BED_CLR).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} /><span style={{ textTransform: 'capitalize' }}>{s}</span>
                </div>
              ))}
              {isAdmin() && sel && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sel)}>Delete Ward</button>}
            </div>
          </div>
          {sel
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(78px,1fr))', gap: 8 }}>
                {sel.beds?.map(bed => (
                  <div key={bed._id} style={{ padding: '8px 6px', borderRadius: 8, textAlign: 'center', fontSize: 11, border: `2px solid ${BED_CLR[bed.status] || '#94a3b8'}`, background: `${BED_CLR[bed.status]}18` }}>
                    <div style={{ fontSize: 15, marginBottom: 2 }}>{bed.status === 'occupied' ? '🛏' : bed.status === 'available' ? '✅' : '🔧'}</div>
                    <div style={{ fontWeight: 600, fontSize: 11 }}>{bed.bedNumber}</div>
                    <div style={{ fontSize: 9, color: BED_CLR[bed.status], fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{bed.status}</div>
                  </div>
                ))}
              </div>
            : <div className="empty"><div className="empty-ico">🏥</div><p>Select a ward</p></div>
          }
        </div>
      </div>
      </>
      )}
      {modal && <WardModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />}
    </div>
  )
}

function WardModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', wardNumber: '', type: 'general', floor: 1, totalBeds: 10, description: '' })
  const [loading, setLoading] = useState(false)
  const s = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await wardAPI.create({
        name: form.name,
        wardNumber: form.wardNumber,
        type: form.type,
        floor: Number(form.floor) || 1,
        totalBeds: Number(form.totalBeds) || 1,
        description: form.description,
      })
      toast.success('Ward added')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add ward')
    } finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>Add Ward</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row2">
              <div className="fg"><label className="lbl">Ward Name *</label><input className="inp" value={form.name} onChange={e => s('name', e.target.value)} required placeholder="General Ward A" /></div>
              <div className="fg"><label className="lbl">Ward Number *</label><input className="inp" value={form.wardNumber} onChange={e => s('wardNumber', e.target.value)} required placeholder="W-101" /></div>
            </div>
            <div className="row3">
              <div className="fg">
                <label className="lbl">Type *</label>
                <select className="inp" value={form.type} onChange={e => s('type', e.target.value)}>
                  {WARD_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                </select>
              </div>
              <div className="fg"><label className="lbl">Floor</label><input className="inp" type="number" min="0" value={form.floor} onChange={e => s('floor', e.target.value)} /></div>
              <div className="fg"><label className="lbl">Beds *</label><input className="inp" type="number" min="1" value={form.totalBeds} onChange={e => s('totalBeds', e.target.value)} required /></div>
            </div>
            <div className="fg"><label className="lbl">Description</label><input className="inp" value={form.description} onChange={e => s('description', e.target.value)} /></div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add Ward'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
