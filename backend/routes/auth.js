// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', protect, authorize('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/updateprofile', protect, updateProfile);

module.exports = router;
