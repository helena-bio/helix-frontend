import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)
    const body = await request.json()
    const { name, email, organization, subject, message } = body

    const { data, error } = await resend.emails.send({
      from: 'Helix Insight <dev@helixinsight.bio>',
      to: 'contact@helena.bio',
      replyTo: email,
      subject: `[${subject}] Contact from ${name}${organization ? ` - ${organization}` : ''}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Organization:</strong> ${organization || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><small>Submitted: ${new Date().toISOString()}</small></p>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      emailId: data?.id
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
