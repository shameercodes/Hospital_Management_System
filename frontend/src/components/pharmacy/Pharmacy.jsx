// ─── Pharmacy ───────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react'
import { pharmacyAPI } from '../../utils/api.js'
import { formatDate } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function Pharmacy() {
  const { isAdmin } = useAuth()
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editModal, setEditModal] = useState(null)
  const [stockModal, setStockModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = {}
      if (search) p.search = search
      if (filter === 'low') p.lowStock = true
      if (filter === 'expiring') p.expiringSoon = true
      const res = await pharmacyAPI.getAll(p)
      setMeds(res.data.data)
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }, [search, filter])

  useEffect(() => { load() }, [load])

  const handleSave = async form => {
    try {
      if (editModal?._id) await pharmacyAPI.update(editModal._id, form)
      else await pharmacyAPI.create(form)
      toast.success('Saved'); setEditModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleStock = async (med, adj) => {
    try { await pharmacyAPI.adjustStock(med._id, { adjustment: adj }); toast.success('Stock updated'); setStockModal(null); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async med => {
    if (!window.confirm(`Permanently delete medicine "${med.name}"?\n\nThis cannot be undone.`)) return
    try { await pharmacyAPI.delete(med._id); toast.success('Medicine deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Pharmacy</h2>
        <button className="btn btn-primary" onClick={() => setEditModal({})}>+ Add Medicine</button>
      </div>
      <div className="filters">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 280 }}>
          <span className="search-ico">🔍</span>
          <input className="inp" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[['all','All'],['low','Low Stock'],['expiring','Expiring Soon']].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Price</th><th>Expiry</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : meds.length === 0
                  ? <tr><td colSpan={7}><div className="empty"><div className="empty-ico">💊</div><h3>No medicines</h3></div></td></tr>
                  : meds.map(m => {
                    const expired = m.expiryDate && new Date(m.expiryDate) < new Date()
                    return (
                      <tr key={m._id}>
                        <td><div style={{ fontWeight: 500 }}>{m.name} {m.strength && <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 400 }}>{m.strength}</span>}</div>{m.genericName && <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{m.genericName}</div>}{m.brand && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.brand}</div>}</td>
                        <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: 10 }}>{m.category}</span></td>
                        <td>
                          <span className="mono" style={{ fontWeight: 700, color: m.isLowStock ? 'var(--danger)' : 'inherit' }}>{m.quantity}</span>
                          {m.isLowStock && <span className="badge badge-danger" style={{ marginLeft: 5, fontSize: 9 }}>LOW</span>}
                        </td>
                        <td><span className="mono">Rs. {m.sellingPrice?.toLocaleString()}</span></td>
                        <td style={{ fontSize: 12, color: expired ? 'var(--danger)' : 'inherit', fontWeight: expired ? 600 : 400 }}>
                          {m.expiryDate ? formatDate(m.expiryDate) : '—'}
                          {expired && <span className="badge badge-danger" style={{ marginLeft: 4, fontSize: 9 }}>EXP</span>}
                        </td>
                        <td>{m.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Inactive</span>}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => setStockModal(m)}>Stock</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditModal(m)}>Edit</button>
                            {isAdmin() && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)}>Delete</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {editModal !== null && (
        <MedModal med={editModal} onClose={() => setEditModal(null)} onSave={handleSave} />
      )}
      {stockModal && (
        <StockModal med={stockModal} onClose={() => setStockModal(null)} onSave={adj => handleStock(stockModal, adj)} />
      )}
    </div>
  )
}

function MedModal({ med, onClose, onSave }) {
  const isEdit = !!med._id
  const [form, setForm] = useState(isEdit ? { ...med, expiryDate: med.expiryDate?.split('T')[0] || '' } : { name:'',genericName:'',brand:'',category:'tablet',strength:'',quantity:0,minStockLevel:10,sellingPrice:0,requiresPrescription:true,isActive:true,expiryDate:'' })
  const s = (f, v) => setForm(p => ({ ...p, [f]: v }))
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? 'Edit Medicine' : 'Add Medicine'}</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="row2"><div className="fg"><label className="lbl">Name *</label><input className="inp" value={form.name} onChange={e => s('name', e.target.value)} required /></div><div className="fg"><label className="lbl">Generic Name</label><input className="inp" value={form.genericName||''} onChange={e => s('genericName', e.target.value)} /></div></div>
          <div className="row2"><div className="fg"><label className="lbl">Brand</label><input className="inp" value={form.brand||''} onChange={e => s('brand', e.target.value)} /></div><div className="fg"><label className="lbl">Category</label><select className="inp" value={form.category} onChange={e => s('category', e.target.value)}>{['tablet','capsule','syrup','injection','ointment','drops','inhaler','other'].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}</select></div></div>
          <div className="row3"><div className="fg"><label className="lbl">Strength</label><input className="inp" value={form.strength||''} onChange={e => s('strength', e.target.value)} placeholder="500mg" /></div><div className="fg"><label className="lbl">Quantity</label><input className="inp" type="number" value={form.quantity} onChange={e => s('quantity', +e.target.value)} /></div><div className="fg"><label className="lbl">Min Stock</label><input className="inp" type="number" value={form.minStockLevel} onChange={e => s('minStockLevel', +e.target.value)} /></div></div>
          <div className="row2"><div className="fg"><label className="lbl">Selling Price (Rs.)</label><input className="inp" type="number" value={form.sellingPrice} onChange={e => s('sellingPrice', +e.target.value)} /></div><div className="fg"><label className="lbl">Expiry Date</label><input className="inp" type="date" value={form.expiryDate||''} onChange={e => s('expiryDate', e.target.value)} /></div></div>
        </div>
        <div className="modal-ft"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(form)}>{isEdit ? 'Save' : 'Add'}</button></div>
      </div>
    </div>
  )
}

function StockModal({ med, onClose, onSave }) {
  const [adj, setAdj] = useState(0)
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>Adjust Stock</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <p style={{ fontSize: 13, marginBottom: 12 }}>Current stock of <strong>{med.name}</strong>: <strong style={{ color: 'var(--primary)' }}>{med.quantity}</strong></p>
          <div className="fg"><label className="lbl">Adjustment (+ add / − remove)</label><input className="inp" type="number" value={adj} onChange={e => setAdj(+e.target.value)} /></div>
          <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 13 }}>New quantity: <strong>{Math.max(0, med.quantity + adj)}</strong></div>
        </div>
        <div className="modal-ft"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(adj)}>Update Stock</button></div>
      </div>
    </div>
  )
}
