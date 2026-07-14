import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@hospital.com', password: 'Admin@123' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Check your credentials.'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const DEMOS = [
    { role: 'Admin',        email: 'admin@hospital.com',           pwd: 'Admin@123'      },
    { role: 'Doctor',       email: 'dr.ahmed@hospital.com',        pwd: 'Doctor@123'     },
    { role: 'Receptionist', email: 'reception.ali@hospital.com',   pwd: 'Reception@123'  },
    { role: 'Pharmacist',   email: 'pharmacy.usman@hospital.com',  pwd: 'Pharmacy@123'   },
    { role: 'Lab Tech',     email: 'lab.zara@hospital.com',        pwd: 'Lab@12345'      },
    { role: 'Nurse',        email: 'nurse.ayesha@hospital.com',    pwd: 'Nurse@123'      },
  ]

  return (
    <div className="login-shell">
      {/* Left */}
      <div className="login-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, background: '#0f6fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏥</div>
          <div>

            <div style={{ fontSize: 17, fontWeight: 700 }}>{import.meta.env.VITE_HOSPITAL_NAME || 'City Medical Center'}</div>
            <div style={{ fontSize: 11, opacity: .5 }}>Hospital Management System v2.0</div>
          </div>

        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }} className="login-hero-title">
          Modern Healthcare<br />Management Platform
        </h1>
        <p style={{ opacity: .65, fontSize: 14, lineHeight: 1.8, maxWidth: 380, marginBottom: 36 }}>
          Manage patients, appointments, billing, pharmacy, lab and staff — all in one secure, role-based system.
        </p>
        {[
          { icon: '🔒', text: '7 role-based access levels' },
          { icon: '⚡', text: 'Real-time dashboard & analytics' },
          { icon: '💊', text: 'Pharmacy with expiry & stock alerts' },
          { icon: '🔬', text: 'Full lab order & results workflow' },
        ].map(f => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, opacity: .75 }}>
            <span>{f.icon}</span><span style={{ fontSize: 13 }}>{f.text}</span>
          </div>
        ))}
        
      </div>

      {/* Right — form */}
      <div className="login-panel">
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, marginBottom: 28 }}>Access the hospital management system</p>

          <form onSubmit={handleSubmit}>
            <div className="fg">
              <label className="lbl" style={{ color: 'rgba(255,255,255,.55)' }}>Email</label>
              <input className="inp" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }} />
            </div>
            <div className="fg">
              <label className="lbl" style={{ color: 'rgba(255,255,255,.55)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="inp" type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.12)', color: '#fff', paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 14 }}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 28, padding: 14, background: 'rgba(255,255,255,.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Quick Login (Demo)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMOS.map(d => (
                <button key={d.role} onClick={() => setForm({ email: d.email, password: d.pwd })}
                  className="demo-login-row"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, cursor: 'pointer', color: '#fff', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#90b4ff' }}>{d.role}</span>
                  <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>{d.email}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 8 }}>Click a role to prefill credentials, then Sign In</p>
          </div>
        </div>
      </div>
    </div>
  )
}
