const qrcode = require('qrcode')

/**
 * Generates a base64 Data URL QR Code containing formatted receipt info (Tests, Prices, Patient ID, Billing)
 * @param {Object} data
 * @param {string} data.patientName
 * @param {string} data.patientCode
 * @param {string} data.barcode
 * @param {string} data.appointmentDate
 * @param {Array} data.tests - [{ name, code, price }]
 * @param {number|string} data.totalAmount
 * @param {string} data.paymentStatus
 * @returns {Promise<string>} Base64 Data URL string
 */
async function generateReceiptQRCodeDataURL(data) {
  const {
    patientName = 'Patient',
    patientCode = 'N/A',
    barcode = 'N/A',
    appointmentDate = new Date().toLocaleDateString(),
    tests = [],
    totalAmount = '0.00',
    paymentStatus = 'PENDING'
  } = data

  const dateFormatted = new Date(appointmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // Format list of tests & individual prices
  const testLines = tests.length > 0
    ? tests.map(t => `• ${t.name || 'Lab Test'} (${t.code || 'TEST'}): LKR ${parseFloat(t.price || 0).toFixed(2)}`).join('\n')
    : '• General Laboratory Testing: LKR ' + parseFloat(totalAmount || 0).toFixed(2)

  // Construct text receipt payload for QR Code
  const qrText = [
    '====================================',
    '🏥 CLINICAL LIS OFFICIAL RECEIPT',
    '====================================',
    `Patient Name   : ${patientName}`,
    `Token Number   : ${patientCode}`,
    `Sample Barcode : ${barcode}`,
    `Date           : ${dateFormatted}`,
    '------------------------------------',
    'ORDERED TESTS & PRICES:',
    testLines,
    '------------------------------------',
    `TOTAL BILLING: LKR ${parseFloat(totalAmount || 0).toFixed(2)}`,
    `PAYMENT ST   : ${String(paymentStatus || 'PENDING').toUpperCase()}`,
    '====================================',
    'Verified by LIS Security Gateway'
  ].join('\n')

  try {
    const qrDataUrl = await qrcode.toDataURL(qrText, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
    return qrDataUrl
  } catch (err) {
    console.error('Failed to generate Receipt QR Code:', err.message)
    return ''
  }
}

module.exports = {
  generateReceiptQRCodeDataURL
}
