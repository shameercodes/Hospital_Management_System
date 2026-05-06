import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000,
})

// Attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('hms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('hms_token')
      localStorage.removeItem('hms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  login:          data  => API.post('/auth/login', data),
  me:             ()    => API.get('/auth/me'),
  register:       data  => API.post('/auth/register', data),
  updateProfile:  data  => API.put('/auth/updateprofile', data),
  updatePassword: data  => API.put('/auth/updatepassword', data),
}

// ─── Patients ────────────────────────────────────────────
export const patientAPI = {
  getAll:    params     => API.get('/patients', { params }),
  getOne:    id         => API.get(`/patients/${id}`),
  create:    data       => API.post('/patients', data),
  update:    (id, data) => API.put(`/patients/${id}`, data),
  delete:    (id, body) => API.delete(`/patients/${id}`, { data: body }),
  addVitals: (id, data) => API.post(`/patients/${id}/vitals`, data),
  admit:     (id, data) => API.put(`/patients/${id}/admit`, data),
  discharge: id         => API.put(`/patients/${id}/discharge`),
}

// ─── Doctors ─────────────────────────────────────────────
export const doctorAPI = {
  getAll:  params     => API.get('/doctors', { params }),
  getOne:  id         => API.get(`/doctors/${id}`),
  create:  data       => API.post('/doctors', data),
  update:  (id, data) => API.put(`/doctors/${id}`, data),
  delete:  id         => API.delete(`/doctors/${id}`),
}

// ─── Appointments ─────────────────────────────────────────
export const appointmentAPI = {
  getAll:   params            => API.get('/appointments', { params }),
  getOne:   id                => API.get(`/appointments/${id}`),
  create:   data              => API.post('/appointments', data),
  update:   (id, data)        => API.put(`/appointments/${id}`, data),
  // Soft cancel — flips status to 'cancelled', record stays in DB.
  cancel:   (id, reason)      => API.post(`/appointments/${id}/cancel`, { reason }),
  // Hard delete — removes the appointment from DB (admin only).
  delete:   id                => API.delete(`/appointments/${id}`),
  getSlots: (doctorId, date)  => API.get(`/appointments/slots/${doctorId}/${date}`),
}

// ─── Wards ───────────────────────────────────────────────
export const wardAPI = {
  getAll:    params              => API.get('/wards', { params }),
  getOne:    id                  => API.get(`/wards/${id}`),
  create:    data                => API.post('/wards', data),
  update:    (id, data)          => API.put(`/wards/${id}`, data),
  delete:    id                  => API.delete(`/wards/${id}`),
  updateBed: (wardId, bedId, d)  => API.patch(`/wards/${wardId}/beds/${bedId}`, d),
}

// ─── Billing ─────────────────────────────────────────────
export const billingAPI = {
  getAll:     params     => API.get('/billing', { params }),
  getOne:     id         => API.get(`/billing/${id}`),
  create:     data       => API.post('/billing', data),
  update:     (id, data) => API.put(`/billing/${id}`, data),
  delete:     id         => API.delete(`/billing/${id}`),
  addPayment: (id, data) => API.post(`/billing/${id}/payment`, data),
}

// ─── Pharmacy ────────────────────────────────────────────
export const pharmacyAPI = {
  getAll:      params     => API.get('/pharmacy', { params }),
  create:      data       => API.post('/pharmacy', data),
  update:      (id, data) => API.put(`/pharmacy/${id}`, data),
  adjustStock: (id, data) => API.patch(`/pharmacy/${id}/stock`, data),
  delete:      id         => API.delete(`/pharmacy/${id}`),
}

// ─── Lab ─────────────────────────────────────────────────
export const labAPI = {
  getAll:        params     => API.get('/lab', { params }),
  create:        data       => API.post('/lab', data),
  update:        (id, data) => API.put(`/lab/${id}`, data),
  submitResults: (id, data) => API.post(`/lab/${id}/results`, data),
  delete:        id         => API.delete(`/lab/${id}`),
}

// ─── Staff ───────────────────────────────────────────────
export const staffAPI = {
  getAll:  params     => API.get('/staff', { params }),
  getOne:  id         => API.get(`/staff/${id}`),
  update:  (id, data) => API.put(`/staff/${id}`, data),
  toggle:  id         => API.patch(`/staff/${id}/toggle`),
  delete:  id         => API.delete(`/staff/${id}`),
}

// ─── Dashboard & Reports ─────────────────────────────────
export const dashboardAPI = {
  get: () => API.get('/dashboard'),
}

export const reportsAPI = {
  revenue:      params => API.get('/reports/revenue', { params }),
  patients:     params => API.get('/reports/patients', { params }),
  appointments: params => API.get('/reports/appointments', { params }),
}

// ─── Audit Log (admin only) ─────────────────────────────
export const auditAPI = {
  list: params => API.get('/audit', { params }),
}

export default API
