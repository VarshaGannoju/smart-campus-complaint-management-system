let nodemailer;

const getNodemailer = () => {
  if (!nodemailer) {
    try {
      nodemailer = require('nodemailer');
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          'Email service dependency is missing. Run "npm install" in backend/ to install nodemailer.'
        );
      }

      throw error;
    }
  }

  return nodemailer;
};

const buildTransport = () => {
  const nodemailerLib = getNodemailer();
  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env.');
  }

  return nodemailerLib.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

const sendRegistrationOtpEmail = async ({ to, otp, name, rollNumber }) => {
  const transporter = buildTransport();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject: 'CVR Campus Complaint System OTP',
    text: [
      `Hello ${name},`,
      '',
      `Your OTP for CVR Campus Complaint System registration is: ${otp}`,
      '',
      `Roll Number: ${rollNumber}`,
      'This OTP is valid for 10 minutes.',
      'If you did not request this, you can ignore this email.'
    ].join('\n')
  });
};

module.exports = { sendRegistrationOtpEmail };
