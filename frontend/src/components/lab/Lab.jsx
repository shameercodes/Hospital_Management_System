import React, { useState, useEffect, useCallback } from 'react'
import { labAPI, patientAPI, doctorAPI } from '../../utils/api.js'
import { formatDateTime, getStatusBadge } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function Lab() {
  const { isAdmin } = useAuth()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [urgency, setUrgency] = useState('')
  const [resultsModal, setResultsModal] = useState(null)
  const [orderModal, setOrderModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await labAPI.getAll({ status, urgency }); setTests(res.data.data) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }, [status, urgency])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, s) => {
    try { await labAPI.update(id, { status: s }); toast.success('Updated'); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async t => {
    if (!window.confirm(`Permanently delete lab test ${t.testId} (${t.testName})?\n\nThis cannot be undone.`)) return
    try { await labAPI.delete(t._id); toast.success('Lab test deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const URG = { routine: 'badge-neutral', urgent: 'badge-warning', stat: 'badge-danger' }

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Laboratory <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({tests.length})</span></h2>
        <button className="btn btn-primary" onClick={() => setOrderModal(true)}>+ Order Test</button>
      </div>
      <div className="filters">
        <select className="inp" style={{ width: 180 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['ordered','sample-collected','processing','completed','cancelled'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('-',' ')}</option>)}
        </select>
        <select className="inp" style={{ width: 150 }} value={urgency} onChange={e => setUrgency(e.target.value)}>
          <option value="">All Urgency</option>
          <option value="stat">STAT</option><option value="urgent">Urgent</option><option value="routine">Routine</option>
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Test ID</th><th>Patient</th><th>Test</th><th>Ordered By</th><th>Urgency</th><th>Status</th><th>Ordered</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : tests.length === 0
                  ? <tr><td colSpan={8}><div className="empty"><div className="empty-ico">🔬</div><h3>No lab tests</h3></div></td></tr>
                  : tests.map(t => (
                    <tr key={t._id}>
                      <td><span className="mono" style={{ color: 'var(--primary)' }}>{t.testId}</span></td>
                      <td><div style={{ fontWeight: 500 }}>{t.patient?.firstName} {t.patient?.lastName}</div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>{t.patient?.patientId}</div></td>
                      <td><div style={{ fontWeight: 500 }}>{t.testName}</div>{t.category && <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'capitalize' }}>{t.category}</div>}</td>
                      <td style={{ fontSize: 13 }}>{t.orderedBy?.user?.name || '—'}</td>
                      <td><span className={`badge ${URG[t.urgency]}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>{t.urgency}</span></td>
                      <td><span className={`badge ${getStatusBadge(t.status)}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>{t.status?.replace('-',' ')}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{formatDateTime(t.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {t.status === 'ordered' && <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(t._id, 'sample-collected')}>Collect</button>}
                          {t.status === 'sample-collected' && <button className="btn btn-sm btn-warning" onClick={() => updateStatus(t._id, 'processing')}>Process</button>}
                          {t.status === 'processing' && <button className="btn btn-sm btn-success" onClick={() => setResultsModal(t)}>Results</button>}
                          {t.status === 'completed' && <button className="btn btn-sm btn-secondary" onClick={() => setResultsModal(t)}>View</button>}
                          {isAdmin() && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t)} title="Permanently delete">Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
      {resultsModal && <ResultsModal test={resultsModal} onClose={() => setResultsModal(null)} onSaved={() => { setResultsModal(null); load() }} />}
      {orderModal && <OrderTestModal onClose={() => setOrderModal(false)} onSaved={() => { setOrderModal(false); load() }} />}
    </div>
  )
}

function OrderTestModal({ onClose, onSaved }) {
  const [patSearch, setPatSearch] = useState('')
  const [patResults, setPatResults] = useState([])
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({
    patient: '', orderedBy: '', testName: '', category: 'hematology',
    urgency: 'routine', sampleType: '', price: 0
  })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  useEffect(() => { doctorAPI.getAll().then(r => setDoctors(r.data.data)).catch(() => {}) }, [])
  useEffect(() => {
    if (patSearch.length >= 2 && !form.patient) {
      patientAPI.getAll({ search: patSearch, limit: 8 }).then(r => setPatResults(r.data.data)).catch(() => {})
    } else { setPatResults([]) }
  }, [patSearch, form.patient])

  const PRESETS = [
    { name: 'Complete Blood Count (CBC)',  category: 'hematology',    price: 800,  sampleType: 'Blood (EDTA)' },
    { name: 'Liver Function Test (LFT)',   category: 'biochemistry',  price: 1500, sampleType: 'Blood (Serum)' },
    { name: 'Kidney Function Test (KFT)',  category: 'biochemistry',  price: 1500, sampleType: 'Blood (Serum)' },
    { name: 'Lipid Profile',               category: 'biochemistry',  price: 1800, sampleType: 'Blood (Serum)' },
    { name: 'HbA1c',                       category: 'biochemistry',  price: 1200, sampleType: 'Blood (EDTA)' },
    { name: 'Urine R/E',                   category: 'urine',         price: 400,  sampleType: 'Urine' },
    { name: 'Chest X-Ray',                 category: 'radiology',     price: 1500, sampleType: 'Imaging' },
    { name: 'COVID-19 PCR',                category: 'microbiology',  price: 4500, sampleType: 'Nasopharyngeal Swab' },
    { name: 'Thyroid Profile (TSH/T3/T4)', category: 'biochemistry',  price: 2200, sampleType: 'Blood (Serum)' },
    { name: 'Blood Culture',               category: 'microbiology',  price: 2500, sampleType: 'Blood' },
  ]

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.patient) { toast.error('Select a patient'); return }
    if (!form.orderedBy) { toast.error('Select ordering doctor'); return }
    setLoading(true)
    try { await labAPI.create(form); toast.success('Lab test ordered'); onSaved() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>Order Lab Test</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="fg">
              <label className="lbl">Patient *</label>
              <div style={{ position: 'relative' }}>
                <input className="inp" placeholder="Search patient…" value={patSearch} onChange={e => { setPatSearch(e.target.value); set('patient', '') }} />
                {patResults.length > 0 && !form.patient && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, maxHeight: 180, overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                    {patResults.map(p => (
                      <div key={p._id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                        onClick={() => { set('patient', p._id); setPatSearch(`${p.firstName} ${p.lastName} (${p.patientId})`); setPatResults([]) }}>
                        <strong>{p.firstName} {p.lastName}</strong> <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{p.patientId} · {p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="fg">
              <label className="lbl">Ordered By (Doctor) *</label>
              <select className="inp" value={form.orderedBy} onChange={e => set('orderedBy', e.target.value)} required>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name} — {d.specialization}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="lbl">Quick Picks</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {PRESETS.map(p => (
                  <button key={p.name} type="button" className="btn btn-sm btn-secondary" style={{ fontSize: 11 }}
                    onClick={() => setForm(prev => ({ ...prev, testName: p.name, category: p.category, price: p.price, sampleType: p.sampleType }))}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="fg"><label className="lbl">Test Name *</label><input className="inp" value={form.testName} onChange={e => set('testName', e.target.value)} required placeholder="e.g. Complete Blood Count" /></div>
            <div className="row2">
              <div className="fg">
                <label className="lbl">Category</label>
                <select className="inp" value={form.category} onChange={e => set('category', e.target.value)}>
                  {['hematology','biochemistry','microbiology','radiology','pathology','serology','urine','other'].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="lbl">Urgency</label>
                <select className="inp" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                  <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option>
                </select>
              </div>
            </div>
            <div className="row2">
              <div className="fg"><label className="lbl">Sample Type</label><input className="inp" value={form.sampleType} onChange={e => set('sampleType', e.target.value)} placeholder="Blood, Urine…" /></div>
              <div className="fg"><label className="lbl">Price (Rs.)</label><input className="inp" type="number" min="0" value={form.price} onChange={e => set('price', +e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Ordering…' : 'Order Test'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResultsModal({ test, onClose, onSaved }) {
  const isView = test.status === 'completed'
  const [rows, setRows] = useState(test.results?.length > 0 ? test.results : [{ parameter:'',value:'',unit:'',normalRange:'',flag:'normal' }])
  const [notes, setNotes] = useState(test.resultNotes || '')
  const [loading, setLoading] = useState(false)
  const setRow = (i, f, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const FLAGS = { normal: 'var(--success)', high: 'var(--danger)', low: 'var(--info)', critical: 'var(--danger)' }
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-hd"><div><h3 style={{ fontWeight: 700, fontSize: 15 }}>{test.testName} — {test.testId}</h3><p style={{ fontSize: 11, color: 'var(--text-2)' }}>{test.patient?.firstName} {test.patient?.lastName}</p></div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Parameters</span>
            {!isView && <button className="btn btn-sm btn-secondary" onClick={() => setRows(p => [...p, { parameter:'',value:'',unit:'',normalRange:'',flag:'normal' }])}>+ Row</button>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
            <thead><tr style={{ background: 'var(--surface-2)' }}>{['Parameter','Value','Unit','Normal Range','Flag'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-2)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '5px 8px' }}>{isView ? r.parameter : <input className="inp" value={r.parameter} onChange={e => setRow(i,'parameter',e.target.value)} />}</td>
                  <td style={{ padding: '5px 8px' }}>{isView ? <strong style={{ color: FLAGS[r.flag] }}>{r.value}</strong> : <input className="inp" value={r.value} onChange={e => setRow(i,'value',e.target.value)} />}</td>
                  <td style={{ padding: '5px 8px' }}>{isView ? r.unit : <input className="inp" value={r.unit} onChange={e => setRow(i,'unit',e.target.value)} />}</td>
                  <td style={{ padding: '5px 8px' }}>{isView ? r.normalRange : <input className="inp" value={r.normalRange} onChange={e => setRow(i,'normalRange',e.target.value)} />}</td>
                  <td style={{ padding: '5px 8px' }}>{isView ? <span style={{ color: FLAGS[r.flag], fontWeight: 600, textTransform: 'capitalize', fontSize: 12 }}>{r.flag}</span> : <select className="inp" value={r.flag} onChange={e => setRow(i,'flag',e.target.value)}>{['normal','high','low','critical'].map(f => <option key={f} value={f} style={{ textTransform: 'capitalize' }}>{f}</option>)}</select>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fg"><label className="lbl">Notes</label><textarea className="inp" rows={3} value={notes} onChange={e => setNotes(e.target.value)} disabled={isView} /></div>
        </div>
        <div className="modal-ft">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {!isView && <button className="btn btn-success" disabled={loading} onClick={async () => { setLoading(true); try { await labAPI.submitResults(test._id, { results: rows, notes }); toast.success('Results submitted'); onSaved() } catch { toast.error('Failed') } finally { setLoading(false) } }}>{loading ? 'Submitting…' : 'Submit Results'}</button>}
        </div>
      </div>
    </div>
  )
}
