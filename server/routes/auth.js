const express  = require('express');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: 'Email already registered' });
    const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const user   = await User.create({ name, email, password, role: 'user', avatar });
    const token  = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, avatar: user.avatar },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, avatar: user.avatar },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
