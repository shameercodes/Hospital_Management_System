const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema({
  description: String,
  category: {
    type: String,
    enum: ['consultation', 'bed', 'medicine', 'lab', 'surgery', 'procedure', 'nursing', 'equipment', 'other']
  },
  quantity: { type: Number, default: 1 },
  unitPrice: Number,
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  admission:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },

  lineItems: [LineItemSchema],

  subtotal:      { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  taxTotal:      { type: Number, default: 0 },
  grandTotal:    { type: Number, required: true },

  insurance: {
    provider: String,
    policyNumber: String,
    claimNumber: String,
    coveredAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'partial'], default: 'pending' }
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded', 'waived'],
    default: 'unpaid'
  },
  payments: [{
    amount: Number,
    method: { type: String, enum: ['cash', 'card', 'insurance', 'online', 'cheque'] },
    transactionId: String,
    paidAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  amountPaid: { type: Number, default: 0 },
  balance: Number,

  dueDate: Date,
  notes:   String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const d = new Date();
    this.invoiceNumber = `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(5,'0')}`;
  }
  this.amountPaid = this.payments.reduce((s, p) => s + p.amount, 0);
  this.balance = this.grandTotal - this.amountPaid - (this.insurance?.coveredAmount || 0);
  if (this.balance <= 0) this.paymentStatus = 'paid';
  else if (this.amountPaid > 0) this.paymentStatus = 'partial';
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
