import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, organization, subject, message, gdprConsent } = body

    if (!name || !email || !subject || !message || !gdprConsent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send email via Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Helena Bioinformatics <noreply@helena.bio>',
      to: ['contact@helena.bio'],
      replyTo: email,
      subject: `[helena.bio] ${subject} - ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organization || 'Not provided'}`,
        `Subject: ${subject}`,
        '',
        'Message:',
        message,
        '',
        `GDPR Consent: ${gdprConsent ? 'Yes' : 'No'}`,
        `Submitted: ${new Date().toISOString()}`,
      ].join('\n'),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
