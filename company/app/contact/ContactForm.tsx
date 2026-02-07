"use client"

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
    gdprConsent: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        alert('Something went wrong. Please try again or email us at contact@helena.bio')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit. Please email us directly at contact@helena.bio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (isSuccess) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">Message Sent</h3>
          <p className="text-md text-muted-foreground">
            Thank you for reaching out. We will respond to{' '}
            <span className="font-medium text-foreground">{formData.email}</span>{' '}
            as soon as possible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-base font-medium text-foreground">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-base font-medium text-foreground">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="organization" className="text-base font-medium text-foreground">Organization</label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="subject" className="text-base font-medium text-foreground">Subject *</label>
          <select
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>Select a topic</option>
            <option value="General Inquiry">General Inquiry</option>
            <option value="Partnership">Partnership</option>
            <option value="Investment">Investment</option>
            <option value="Helix Insight">Helix Insight</option>
            <option value="Data Protection">Data Protection</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-base font-medium text-foreground">Message *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="gdprConsent"
          name="gdprConsent"
          required
          checked={formData.gdprConsent}
          onChange={handleChange}
          className="mt-1"
        />
        <label htmlFor="gdprConsent" className="text-md text-muted-foreground">
          I agree to the processing of my personal data in accordance with the{' '}
          <a href="https://helixinsight.bio/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>. *
        </label>
      </div>

      <button
        type="submit"
        disabled={!formData.gdprConsent || isSubmitting}
        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
