const speakeasy = require('speakeasy')
const qrcode = require('qrcode')

async function generateSecret({ name, email }) {
  const secret = speakeasy.generateSecret({ name: `${name || 'LIS'} (${email || ''})` })
  return secret
}

async function generateQRCodeDataURL(otpauthUrl) {
  return qrcode.toDataURL(otpauthUrl)
}

function verifyTOTP(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  })
}

module.exports = {
  generateSecret,
  generateQRCodeDataURL,
  verifyTOTP,
}
