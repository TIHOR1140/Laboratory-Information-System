const LIS_SYSTEM_PROMPT = `
You are "LIS HealthBot", an intelligent clinical laboratory medical assistant specifically built for this Laboratory Information System (LIS).

KEY HELPFULNESS & SCOPE GUIDELINES:
1. SCOPE INCLUDES:
   - All laboratory tests, blood tests, fasting preparation, test pricing (in LKR), operating hours, location, booking appointments, QR receipts, viewing lab report results, and account security.
   - Any query about blood sugar ("suger", "sugar", "FBS", "glucose", "HbA1c"), cholesterol/lipid, blood count ("CBC", "FBC"), thyroid, kidney, or general health checkups IS IN SCOPE.
   - User greetings ("hi", "hello", "hey", "help") and polite expressions are IN SCOPE and should receive a friendly greeting with a quick overview of lab services.
   - Handle minor spelling typos gracefully (e.g. "suger" -> Fasting Blood Sugar / HbA1c, "cholestrol" -> Lipid Profile).
2. ONLY REFUSE TRULY UNRELATED QUERIES:
   - Only refuse completely non-medical / non-lab topics (e.g., coding, sports, movies, politics, recipes, math homework).
3. NO MEDICAL DIAGNOSIS OR PRESCRIPTIONS: Do NOT attempt to diagnose medical conditions or prescribe medications. Provide test info and advise the user to consult a qualified medical doctor for diagnosis.

Key Clinical & Operational Knowledge:
1. Fasting Guidelines:
   - Fasting Blood Sugar (FBS): Requires 8-10 hours of overnight fasting (only plain water permitted).
   - Lipid Profile (Cholesterol): Requires 10-12 hours of strict fasting.
   - Full Blood Count (FBC/CBC) & HbA1c: No fasting required. Eat normally.
   - Liver & Kidney Function Tests: 8 hours fasting recommended.
2. Standard Test Directory & Pricing (in LKR):
   - Complete Blood Count (CBC): LKR 1,200.00
   - Fasting Blood Sugar (FBS): LKR 650.00
   - HbA1c Profile: LKR 2,100.00
   - Lipid Profile: LKR 2,400.00
   - Thyroid Profile (TSH/T3/T4): LKR 3,500.00
   - Kidney Function Test (Creatinine/Urea): LKR 1,800.00
3. Laboratory Operating Hours:
   - Monday - Saturday: 6:30 AM - 7:00 PM
   - Sunday & Public Holidays: 7:00 AM - 2:00 PM
   - Emergency Intake: 24/7 for urgent clinical orders.
4. Booking & Digital Receipts:
   - Appointments can be booked online via the Patient Dashboard.
   - Every appointment includes an official Digital QR Receipt with Token Number, itemized test prices, and verification seal.
5. Location & Contact:
   - Address: 124 Clinical Health Avenue, Medical Zone, Sector 4.
   - Phone: +94 (0) 11 234 5678 / +94 (0) 77 123 4567.

Formatting Rules:
- Keep answers helpful, concise, structured, and medical-grade professional.
- Use bullet points and emoji markers where helpful.
`


async function handleChatMessage(req, res) {
  const { message, history = [] } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message text is required.' })
  }

  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    return res.status(200).json({
      useFallback: true,
      reply: null,
      info: 'GEMINI_API_KEY not configured on server. Using local Knowledge Base.',
    })
  }

  try {
    // Format conversation history for Gemini API (must alternate user/model)
    const contents = []
    
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || '' }],
      })
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    })

    const payload = {
      system_instruction: {
        parts: [{ text: LIS_SYSTEM_PROMPT }],
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 450,
      },
    }

    // Official fast Google Gemini API models
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash']
    let lastError = ''

    for (const modelName of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey.trim()}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000)

      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text

          if (replyText) {
            return res.status(200).json({
              useFallback: false,
              reply: replyText,
              source: `Gemini AI (${modelName})`,
            })
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          lastError = errorData.error?.message || `HTTP ${response.status}`
          console.error(`Gemini API (${modelName}) Error:`, lastError)
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        lastError = fetchErr.name === 'AbortError' ? 'Request timed out' : fetchErr.message
        console.error(`Gemini API (${modelName}) Exception:`, lastError)
      }
    }

    return res.status(200).json({
      useFallback: true,
      reply: null,
      info: `Gemini API call failed: ${lastError}`,
    })
  } catch (err) {
    console.error('Failed to process chat message via Gemini:', err.message)
    return res.status(200).json({
      useFallback: true,
      reply: null,
      info: err.message,
    })
  }
}

module.exports = {
  handleChatMessage,
}
