/**
 * Chat empty state greetings and titles.
 * Greeting is personalized with user's first name.
 * Both are randomly selected on each render.
 */

const GREETINGS: string[] = [
  "Hi {name},",
  "Hello {name},",
  "Good to see you, {name}.",
  "Welcome back, {name}.",
  "Ready when you are, {name}.",
  "At your service, {name}.",
  "{name}, let's review this case.",
  "{name}, your assistant is ready.",
]

const TITLES: string[] = [
  "What would you like to explore?",
  "How can I help with this case?",
  "What's your clinical question?",
  "Let's interpret this together.",
  "Ask me anything about this case.",
  "Ready to assist with interpretation.",
  "Let's make sense of these results.",
]

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getChatPrompt(fullName?: string | null): { greeting: string; title: string } {
  const firstName = fullName?.split(' ')[0] || ''
  const greeting = firstName
    ? pickRandom(GREETINGS).replace('{name}', firstName)
    : ''
  return {
    greeting,
    title: pickRandom(TITLES),
  }
}
