import React, { useEffect, useState, useCallback } from 'react'
import { auditAPI } from '../../utils/api.js'
import { formatDate } from '../../utils/helpers.js'
import toast from 'react-hot-toast'

const ENTITIES = ['', 'Patient', 'Appointment', 'Doctor', 'LabTest', 'Invoice', 'Medicine', 'Ward', 'User']
const ACTIONS  = ['', 'delete', 'cascade_delete', 'login', 'role_change', 'permission_change', 'export']

const colorForAction = a => {
  if (a === 'cascade_delete') return 'badge-danger'
  if (a === 'delete')         return 'badge-warning'
  if (a === 'login')          return 'badge-info'
  return 'badge-info'
}

export default function AuditLog() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditAPI.list({ entity: entity || undefined, action: action || undefined, page, limit: 50 })
      setItems(res.data.data); setTotal(res.data.total)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load audit log') }
    finally { setLoading(false) }
  }, [entity, action, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [entity, action])

  return (
    <div>
      <div className="page-head">
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>
          Audit Log <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>({total})</span>
        </h2>
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Append-only · cannot be deleted</div>
      </div>

      <div className="filters">
        <select className="inp" style={{ width: 160 }} value={entity} onChange={e => setEntity(e.target.value)}>
          {ENTITIES.map(v => <option key={v} value={v}>{v || 'All entities'}</option>)}
        </select>
        <select className="inp" style={{ width: 180 }} value={action} onChange={e => setAction(e.target.value)}>
          {ACTIONS.map(v => <option key={v} value={v}>{v || 'All actions'}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Summary</th><th>IP</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spin" style={{ margin: '0 auto' }} /></td></tr>
                : items.length === 0
                  ? <tr><td colSpan={7}><div className="empty"><div className="empty-ico">🛡️</div><h3>No audit entries</h3><p>Sensitive actions (deletes, role changes) will be logged here.</p></div></td></tr>
                  : items.map(it => (
                    <React.Fragment key={it._id}>
                      <tr>
                        <td style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{formatDate(it.createdAt)} · {new Date(it.createdAt).toLocaleTimeString()}</td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{it.actor?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{it.actor?.email} · <span style={{ textTransform: 'capitalize' }}>{it.actor?.role}</span></div>
                        </td>
                        <td><span className={`badge ${colorForAction(it.action)}`}>{it.action}</span></td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{it.entity}</span><div style={{ fontSize: 10, color: 'var(--text-2)' }}>{it.entityId}</div></td>
                        <td style={{ fontSize: 12 }}>{it.summary || '—'}</td>
                        <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>{it.ip || '—'}</span></td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => setExpanded(expanded === it._id ? null : it._id)}>
                            {expanded === it._id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expanded === it._id && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--surface-2, #f8f9fb)', padding: 12 }}>
                            {it.cascade && (
                              <div style={{ marginBottom: 8, fontSize: 12 }}>
                                <strong>Cascade:</strong> {Object.entries(it.cascade).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                              </div>
                            )}
                            <details>
                              <summary style={{ fontSize: 12, cursor: 'pointer', color: 'var(--text-2)' }}>Snapshot</summary>
                              <pre style={{ fontSize: 11, marginTop: 6, maxHeight: 280, overflow: 'auto', background: '#0b1220', color: '#cbd5e1', padding: 10, borderRadius: 6 }}>
                                {JSON.stringify(it.snapshot, null, 2)}
                              </pre>
                            </details>
                            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 8 }}>
                              User-Agent: <span className="mono">{it.userAgent || '—'}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
