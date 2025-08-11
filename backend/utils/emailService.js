const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail app password here
  },
});

async function sendCounselingUpdateEmails(subject, message) {
  const users = await User.find({});

  const emailPromises = users.map(user =>
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html: `<p>Hi ${user.username},</p><p>${message}</p>`,
    })
  );

  await Promise.all(emailPromises);
  console.log(`✅ Sent "${subject}" update emails to all users.`);
}

module.exports = { sendCounselingUpdateEmails };
