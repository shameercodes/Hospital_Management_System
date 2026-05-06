import React, { useState, useEffect, useCallback } from 'react'
import { billingAPI, patientAPI } from '../../utils/api.js'
import { formatDate, formatCurrency, getStatusBadge } from '../../utils/helpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function Billing() {
  const { isAdmin } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [payModal, setPayModal] = useState(null)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await billingAPI.getAll({ status: statusF, limit: 20 }); setInvoices(res.data.data); setTotal(res.data.total) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }, [statusF])

  useEffect(() => { load() }, [load])

  const handleDelete = async inv => {
    if (!window.confirm(`Permanently delete invoice ${inv.invoiceNumber}?\n\nThis cannot be undone.`)) return
    try { await billingAPI.delete(inv._id); toast.success('Invoice deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Billing <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({total})</span></h2>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ Create Invoice</button>
      </div>
      <div className="filters">
        <select className="inp" style={{ width: 180 }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Invoices</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option>
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Invoice #</th><th>Patient</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : invoices.length === 0
                  ? <tr><td colSpan={8}><div className="empty"><div className="empty-ico">💳</div><h3>No invoices</h3></div></td></tr>
                  : invoices.map(inv => (
                    <tr key={inv._id}>
                      <td><span className="mono" style={{ color: 'var(--primary)' }}>{inv.invoiceNumber}</span></td>
                      <td><div style={{ fontWeight: 500 }}>{inv.patient?.firstName} {inv.patient?.lastName}</div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>{inv.patient?.patientId}</div></td>
                      <td style={{ fontSize: 12 }}>{formatDate(inv.createdAt)}</td>
                      <td><span className="mono" style={{ fontWeight: 600 }}>{formatCurrency(inv.grandTotal)}</span></td>
                      <td><span className="mono" style={{ color: 'var(--success)' }}>{formatCurrency(inv.amountPaid)}</span></td>
                      <td><span className="mono" style={{ color: inv.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{formatCurrency(inv.balance)}</span></td>
                      <td><span className={`badge ${getStatusBadge(inv.paymentStatus)}`}>{inv.paymentStatus}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {inv.paymentStatus !== 'paid' && <button className="btn btn-sm btn-success" onClick={() => setPayModal(inv)}>Record Payment</button>}
                          {isAdmin() && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(inv)} title="Permanently delete">Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
      {createModal && <CreateInvoiceModal onClose={() => setCreateModal(false)} onSaved={() => { setCreateModal(false); load() }} />}
      {payModal && <PaymentModal invoice={payModal} onClose={() => setPayModal(null)} onSaved={() => { setPayModal(null); load() }} />}
    </div>
  )
}

function CreateInvoiceModal({ onClose, onSaved }) {
  const [patSearch, setPatSearch] = useState('')
  const [patients, setPatients] = useState([])
  const [selPat, setSelPat] = useState(null)
  const [items, setItems] = useState([{ description:'',category:'consultation',quantity:1,unitPrice:0,discount:0,tax:0 }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patSearch.length >= 2 && !selPat) patientAPI.getAll({ search: patSearch, limit: 8 }).then(r => setPatients(r.data.data)).catch(() => {})
    else setPatients([])
  }, [patSearch, selPat])

  const setItem = (i, f, v) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [f]: v } : item))
  const grandTotal = items.reduce((s, it) => s + it.quantity * it.unitPrice * (1 - (it.discount||0)/100) * (1 + (it.tax||0)/100), 0)

  const handleSubmit = async e => {
    e.preventDefault(); if (!selPat) { toast.error('Select a patient'); return }
    setLoading(true)
    try { await billingAPI.create({ patient: selPat._id, lineItems: items }); toast.success('Invoice created'); onSaved() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>Create Invoice</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="fg">
              <label className="lbl">Patient *</label>
              <div style={{ position: 'relative' }}>
                <input className="inp" placeholder="Search patient…" value={patSearch} onChange={e => { setPatSearch(e.target.value); setSelPat(null) }} />
                {patients.length > 0 && !selPat && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, maxHeight: 160, overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                    {patients.map(p => <div key={p._id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }} onClick={() => { setSelPat(p); setPatSearch(`${p.firstName} ${p.lastName}`); setPatients([]) }}><strong>{p.firstName} {p.lastName}</strong> <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{p.patientId}</span></div>)}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Line Items</span>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setItems(p => [...p, { description:'',category:'other',quantity:1,unitPrice:0,discount:0,tax:0 }])}>+ Add</button>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 70px 80px 55px auto', gap: 5, marginBottom: 6, alignItems: 'center' }}>
                  <input className="inp" placeholder="Description" value={item.description} onChange={e => setItem(i,'description',e.target.value)} />
                  <select className="inp" value={item.category} onChange={e => setItem(i,'category',e.target.value)}>{['consultation','bed','medicine','lab','surgery','procedure','nursing','other'].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}</select>
                  <input className="inp" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => setItem(i,'quantity',+e.target.value)} />
                  <input className="inp" type="number" min="0" placeholder="Price" value={item.unitPrice} onChange={e => setItem(i,'unitPrice',+e.target.value)} />
                  <input className="inp" type="number" min="0" max="100" placeholder="Disc%" value={item.discount} onChange={e => setItem(i,'discount',+e.target.value)} />
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => setItems(p => p.filter((_,idx) => idx !== i))} disabled={items.length === 1}>×</button>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginTop: 8 }}>Total: {formatCurrency(grandTotal)}</div>
            </div>
          </div>
          <div className="modal-ft"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Invoice'}</button></div>
        </form>
      </div>
    </div>
  )
}

function PaymentModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: invoice.balance || 0, method: 'cash', notes: '' })
  const [loading, setLoading] = useState(false)
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-hd"><h3 style={{ fontWeight: 700, fontSize: 15 }}>Record Payment</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span>Invoice</span><strong>{invoice.invoiceNumber}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 4 }}><span style={{ fontWeight: 600 }}>Balance Due</span><strong style={{ color: 'var(--danger)', fontSize: 15 }}>{formatCurrency(invoice.balance)}</strong></div>
          </div>
          <div className="fg"><label className="lbl">Amount (Rs.) *</label><input className="inp" type="number" min="1" max={invoice.balance} value={form.amount} onChange={e => setForm(p => ({ ...p, amount: +e.target.value }))} /></div>
          <div className="fg"><label className="lbl">Method</label><select className="inp" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>{['cash','card','insurance','online','cheque'].map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m}</option>)}</select></div>
          <div className="fg"><label className="lbl">Reference</label><input className="inp" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Transaction ID…" /></div>
        </div>
        <div className="modal-ft">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" disabled={loading} onClick={async () => { setLoading(true); try { await billingAPI.addPayment(invoice._id, form); toast.success('Payment recorded'); onSaved() } catch { toast.error('Failed') } finally { setLoading(false) } }}>
            {loading ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
