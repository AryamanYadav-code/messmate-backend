const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Sends an email using Brevo HTTP API or Nodemailer SMTP fallback.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - Email HTML body content
 * @param {string} [options.senderName='SRM_KITCHEN App'] - Sender name
 */
async function sendEmail({ to, subject, htmlContent, senderName = 'SRM_KITCHEN App' }) {
  const senderEmail = process.env.SENDER_EMAIL || process.env.BREVO_USER || 'aryamanyadav19@gmail.com';
  const cleanTo = (to || '').trim().toLowerCase();

  if (!cleanTo) {
    throw new Error('Recipient email is required');
  }

  let lastError = null;

  // 1. Try Brevo HTTP API if BREVO_API_KEY is configured
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: cleanTo }],
          subject: subject,
          htmlContent: htmlContent,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return response.data;
    } catch (err) {
      const brevoErrMsg = err.response?.data?.message || err.response?.data?.code || err.message;
      console.error('Brevo API Email Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: brevoErrMsg,
      });
      lastError = new Error(`Brevo API Error (${err.response?.status || 'Network'}): ${brevoErrMsg}`);
    }
  }

  // 2. Try Nodemailer SMTP (Brevo SMTP, Gmail SMTP, or Custom SMTP)
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.BREVO_USER;
  const pass = process.env.SMTP_PASS || process.env.BREVO_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: cleanTo,
        subject,
        html: htmlContent,
      });
      return info;
    } catch (smtpErr) {
      console.error('SMTP Email Error:', smtpErr);
      lastError = new Error(`SMTP Error (${smtpErr.code || 'FAIL'}): ${smtpErr.message}`);
    }
  }

  // If both methods fail or credentials missing
  if (lastError) {
    throw lastError;
  }

  throw new Error('Email delivery failed: Neither Brevo API key nor valid SMTP credentials are configured in environment variables.');
}

module.exports = { sendEmail };
