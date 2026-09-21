const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Sends an email using Gmail SMTP, Brevo API, or Generic SMTP with fast timeouts.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - Email HTML body content
 * @param {string} [options.senderName='SRM_KITCHEN App'] - Sender name
 */
async function sendEmail({ to, subject, htmlContent, senderName = 'SRM_KITCHEN App' }) {
  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo) {
    throw new Error('Recipient email is required');
  }

  let lastError = null;

  // Option 1: Gmail SMTP (If GMAIL_USER and GMAIL_APP_PASSWORD are provided)
  const gmailUser = process.env.GMAIL_USER || process.env.GMAIL_EMAIL;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (gmailUser && gmailPass) {
    try {
      console.log(`[mailer] Attempting Gmail SMTP for ${cleanTo}...`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
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
      console.log(`[mailer] Email sent via Gmail SMTP: ${info.messageId}`);
      return info;
    } catch (gmailErr) {
      console.error('[mailer] Gmail SMTP Error:', gmailErr.message);
      lastError = new Error(`Gmail SMTP Error: ${gmailErr.message}`);
    }
  }

  // Option 2: Brevo HTTP API (If BREVO_API_KEY is provided)
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.SENDER_EMAIL || process.env.BREVO_USER || 'aryamanyadav19@gmail.com';
    try {
      console.log(`[mailer] Attempting Brevo API for ${cleanTo}...`);
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
          timeout: 6000, // 6 seconds
        }
      );
      console.log(`[mailer] Email sent via Brevo API`);
      return response.data;
    } catch (err) {
      const brevoErrMsg = err.response?.data?.message || err.response?.data?.code || err.message;
      console.error('[mailer] Brevo API Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: brevoErrMsg,
      });
      lastError = new Error(`Brevo API Error (${err.response?.status || 'Network'}): ${brevoErrMsg}`);
    }
  }

  // Option 3: Generic SMTP (Brevo SMTP or Custom SMTP)
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.BREVO_USER;
  const pass = process.env.SMTP_PASS || process.env.BREVO_PASS;
  const senderEmail = process.env.SENDER_EMAIL || user || 'aryamanyadav19@gmail.com';

  if (user && pass) {
    try {
      console.log(`[mailer] Attempting SMTP (${host}:${port}) for ${cleanTo}...`);
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
      console.log(`[mailer] Email sent via SMTP: ${info.messageId}`);
      return info;
    } catch (smtpErr) {
      console.error('[mailer] SMTP Error:', smtpErr.message);
      lastError = new Error(`SMTP Error (${smtpErr.code || 'FAIL'}): ${smtpErr.message}`);
    }
  }

  // If all methods fail or no credentials configured
  if (lastError) {
    throw lastError;
  }

  throw new Error('Email delivery failed: No valid email credentials (Gmail, Brevo API, or SMTP) configured in environment variables.');
}

module.exports = { sendEmail };
