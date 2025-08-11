require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const User = require('./models/User');
const Round = require('./models/Round');

const app = express(); // ✅ only once

// ✅ MIDDLEWARE ORDER
app.use(cors()); // must come early
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ✅ ROUTES
const collegeRoutes = require('./routes/collegeRoutes');
app.use('/api', collegeRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// ✅ DATABASE CONNECTION
const PORT = process.env.PORT || 3000;
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}
connectDB();

// ✅ PREDICT COLLEGE
app.post('/predict', async (req, res) => {
  try {
    const { rank, category, round, gender } = req.body;

    if (rank == null || !category || round == null || !gender) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const rankInt = parseInt(rank);
    const roundInt = parseInt(round);

    const genderOptions = gender.toLowerCase() === 'female'
      ? ['Female-Only', 'Gender-Neutral']
      : ['Gender-Neutral'];

    const colleges = await Round.find({
      category: category.toUpperCase(),
      round: roundInt,
      gender: { $in: genderOptions },
      closing_rank: { $gte: rankInt }
    }).sort({ closing_rank: 1 }).limit(10);

    res.json({ colleges });
  } catch (err) {
    console.error('❌ Prediction error:', err);
    res.status(500).json({ message: 'Server error during prediction' });
  }
});

// ✅ EMAIL NOTIFICATIONS FOR COUNSELING UPDATES
const counselingUpdates = [
  {
    date: '2025-06-11',
    subject: 'Round 1 Counseling Starts',
    message: 'Round 1 counseling begins on June 1st. Please prepare your documents.'
  },
  {
    date: '2025-06-15',
    subject: 'Round 1 Seat Allotment Result',
    message: 'Round 1 seat allotment results will be out on June 15th. Check your account.'
  },
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendCounselingUpdateEmails(subject, message) {
  try {
    const users = await User.find({});
    const sendList = users.map(user =>
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject,
        html: `<p>Hi ${user.username},</p><p>${message}</p>`
      })
    );
    await Promise.all(sendList);
    console.log(`📬 Sent "${subject}" update to ${users.length} users`);
  } catch (error) {
    console.error('❌ Failed to send updates:', error);
  }
}

cron.schedule('0 9 * * * *', () => {
  const today = new Date().toISOString().slice(0, 10);
  counselingUpdates.forEach(update => {
    if (update.date === today) {
      sendCounselingUpdateEmails(update.subject, update.message);
    }
  });
});

// ✅ AUTH ROUTES

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ username }, { email: normalizedEmail }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username
          ? 'Username already exists'
          : 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email: normalizedEmail, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'All fields required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Forgot Password
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link valid for 1 hour.</p>`
    });

    res.json({ message: 'Reset link sent' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send reset link' });
  }
});

// Reset Password
app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token and new password required' });

    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ✅ SERVE STATIC HTML FILES
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'home.html'));
});

app.get('/reviews.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'reviews.html'));
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
