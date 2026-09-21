const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Sends an email using Brevo HTTP API, Gmail SMTP, or Custom SMTP with strict timeouts.
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

  // 1. Try Brevo HTTP API if BREVO_API_KEY is configured (Fast 7s timeout)
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
          timeout: 7000,
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

      // If no alternative SMTP is configured, throw Brevo error directly without trying slow/blocked SMTP
      if (!process.env.GMAIL_APP_PASSWORD && !process.env.SMTP_HOST) {
        throw new Error(`Brevo API Error (${err.response?.status || 'Network'}): ${brevoErrMsg}`);
      }
    }
  }

  // 2. Try Gmail SMTP if GMAIL_APP_PASSWORD is set (100% reliable on port 465 SSL)
  const gmailUser = process.env.GMAIL_USER || senderEmail;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${gmailUser}>`,
        to: cleanTo,
        subject,
        html: htmlContent,
      });
      return info;
    } catch (gmailErr) {
      console.error('Gmail SMTP Error:', gmailErr);
      throw new Error(`Gmail SMTP Error: ${gmailErr.message}`);
    }
  }

  // 3. Try custom SMTP if explicitly provided (with strict 5s timeouts)
  if (process.env.SMTP_HOST) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '465');
    const user = process.env.SMTP_USER || process.env.BREVO_USER;
    const pass = process.env.SMTP_PASS || process.env.BREVO_PASS;

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
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
      throw new Error(`SMTP Error (${smtpErr.code || 'FAIL'}): ${smtpErr.message}`);
    }
  }

  throw new Error('Email delivery failed: BREVO_API_KEY is invalid/disabled in Brevo dashboard, and no secondary SMTP (Gmail App Password) is configured.');
}

module.exports = { sendEmail };
