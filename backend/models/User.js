const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: { type: String, required: true, minlength: 8, select: false },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'accountant'],
    default: 'receptionist'
  },
  phone: { type: String },
  avatar: { type: String, default: '' },
  department: { type: String },
  employeeId: { type: String, unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  passwordResetToken: String,
  passwordResetExpire: Date,
}, { timestamps: true });

// Encrypt password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Sign JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
