const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Sends an email using Brevo HTTP API, Gmail SMTP, or Brevo/Custom SMTP.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - Email HTML body content
 * @param {string} [options.senderName='SRM_KITCHEN App'] - Sender name
 */
async function sendEmail({ to, subject, htmlContent, senderName = 'SRM_KITCHEN App' }) {
  const senderEmail = process.env.SENDER_EMAIL || 'aryamanyadav19@gmail.com';
  const cleanTo = (to || '').trim().toLowerCase();

  if (!cleanTo) {
    throw new Error('Recipient email is required');
  }

  let brevoApiError = null;

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
      brevoApiError = `Brevo API Error (${err.response?.status || 'Network'}): ${brevoErrMsg}`;
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
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 6000,
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

  // 3. Try Brevo SMTP / Custom SMTP if BREVO_USER / SMTP_USER and BREVO_PASS / SMTP_PASS are set
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER || process.env.BREVO_USER;
  const pass = process.env.SMTP_PASS || process.env.BREVO_PASS;

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 7000,
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

  if (brevoApiError) {
    throw new Error(brevoApiError);
  }

  throw new Error('Email delivery failed: Neither Brevo API key nor SMTP credentials are valid/configured.');
}

module.exports = { sendEmail };
