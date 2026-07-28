const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

const resendApiKey = process.env.RESEND_API_KEY
const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev'

let resendClient
if (resendApiKey) {
  try {
    const { Resend } = require('resend')
    resendClient = new Resend(resendApiKey)
    console.log('✔ Resend client initialized successfully.')
  } catch (err) {
    console.error('Failed to load Resend SDK:', err.message)
  }
}

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || 'no-reply@lis.local'

let transporter
if (smtpHost && !resendClient) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort) || 587,
    secure: smtpPort == 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
}

async function sendOTPEmail(toEmail, code, userName) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">LIS 2-Step Verification</h2>
      <p>Hello ${userName || 'User'},</p>
      <p>Your one-time passcode for Laboratory Information System access is:</p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 24px 0; color: #0f172a; border-radius: 8px;">
        ${code}
      </div>
      <p style="color: #64748b; font-size: 14px;">This passcode is valid for 10 minutes. If you did not request this code, please secure your credentials immediately.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">Clinical LIS Workspace © 2026</p>
    </div>
  `

  // 1. Try Resend if configured
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: resendFrom,
        to: toEmail,
        subject: 'Your LIS 2-Step Verification Code',
        html: htmlContent,
      })
      if (response.error) {
        throw new Error(response.error.message || 'Resend API Error')
      }
      console.log(`[Resend] Verification email successfully sent to ${toEmail}`)
      return
    } catch (error) {
      console.error('[Resend] Failed to send email via Resend:', error.message)
    }
  }

  // 2. Try SMTP transporter if configured
  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject: 'Your LIS 2-Step Verification Code',
        text: `Your LIS 2-Step Verification Code is: ${code}. Valid for 10 minutes.`,
        html: htmlContent,
      })
      console.log(`[SMTP] Verification email successfully sent to ${toEmail}`)
      return
    } catch (error) {
      console.error('[SMTP] Failed to send mail, falling back:', error.message)
    }
  }

  // Fallback: Log to files
  const logDir = path.join(__dirname, '../../tmp')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  const logPath = path.join(logDir, 'sent_emails.log')
  const logMessage = `[${new Date().toISOString()}] To: ${toEmail} | Code: ${code} | Subject: Your LIS 2-Step Verification Code\n`
  fs.appendFileSync(logPath, logMessage)

  console.log(`\n======================================================`)
  console.log(`[EMAIL SERVICE MOCK] Sent to: ${toEmail}`)
  console.log(`[EMAIL SERVICE MOCK] OTP Verification Code: ${code}`)
  console.log(`[EMAIL SERVICE MOCK] Details logged to: ${logPath}`)
  console.log(`======================================================\n`)
}

module.exports = {
  sendOTPEmail,
}
