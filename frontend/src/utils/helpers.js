import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, fmt) : '—'
}

export const formatDateTime = date => formatDate(date, 'dd MMM yyyy, HH:mm')
export const formatTime = date     => formatDate(date, 'HH:mm')
export const timeAgo = date        => date ? formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true }) : '—'

export const formatCurrency = (amount, currency = 'PKR') =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0)

export const calculateAge = dob => {
  if (!dob) return '—'
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))
}

export const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const getStatusBadge = status => {
  const map = {
    scheduled: 'badge-info',       confirmed: 'badge-primary',
    'in-progress': 'badge-warning', completed: 'badge-success',
    cancelled: 'badge-danger',      'no-show': 'badge-neutral',
    inpatient: 'badge-warning',     outpatient: 'badge-info',
    discharged: 'badge-success',    critical: 'badge-danger',
    paid: 'badge-success',          unpaid: 'badge-danger',
    partial: 'badge-warning',       overdue: 'badge-danger',
    available: 'badge-success',     occupied: 'badge-warning',
    maintenance: 'badge-neutral',   active: 'badge-success',
    inactive: 'badge-danger',
  }
  return map[status] || 'badge-neutral'
}

export const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']
export const DEPARTMENTS  = ['Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology','Oncology','Radiology','Pathology','Emergency','General Surgery','Internal Medicine','Dermatology','Ophthalmology','ENT','Psychiatry','Urology','Nephrology','Gastroenterology','Pulmonology','Endocrinology']
export const WARD_TYPES   = ['general','private','icu','nicu','emergency','pediatric','maternity','surgery','orthopedic','cardiology']

export const truncate = (str, len = 40) => str && str.length > len ? str.slice(0, len) + '…' : str || ''
