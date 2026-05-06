const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const SAFE_USER_FIELDS = 'name email role phone avatar department employeeId isActive lastLogin';

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      employeeId: user.employeeId,
    }
  });
};

// Minimum complexity: 8+ chars, at least 1 letter and 1 number.
const isStrongPassword = (pw) =>
  typeof pw === 'string' && pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

// @route POST /api/auth/register   (admin only — see routes/auth.js)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, department, employeeId } = req.body;
  if (!name || !email || !password) {
    res.status(400); throw new Error('name, email and password are required');
  }
  if (!isStrongPassword(password)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters and contain both letters and numbers');
  }
  const user = await User.create({ name, email, password, role, phone, department, employeeId });
  sendToken(user, 201, res);
});

// @route POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400); throw new Error('Please provide email and password');
  }
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  // Generic message — never reveal whether the email exists.
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid credentials');
  }
  if (!user.isActive) {
    res.status(401); throw new Error('Account deactivated');
  }
  await User.updateOne({ _id: user._id }, { lastLogin: Date.now() });
  sendToken(user, 200, res);
});

// @route GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(SAFE_USER_FIELDS);
  res.json({ success: true, data: user });
});

// @route PUT /api/auth/updatepassword
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400); throw new Error('currentPassword and newPassword are required');
  }
  if (!isStrongPassword(newPassword)) {
    res.status(400);
    throw new Error('New password must be at least 8 characters and contain both letters and numbers');
  }
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

// @route PUT /api/auth/updateprofile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, avatar },
    { new: true, runValidators: true, context: 'query' }
  ).select(SAFE_USER_FIELDS);
  res.json({ success: true, data: user });
});
