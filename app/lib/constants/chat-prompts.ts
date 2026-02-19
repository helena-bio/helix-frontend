/**
 * Chat empty state titles and subtitles.
 * Randomly selected on each render.
 */

const TITLES: string[] = [
  "Let's interpret this together",
  "What's your clinical question?",
  "Ready to assist with interpretation",
  "How can I help with this analysis?",
  "Let's make sense of this case",
  "What would you like to explore?",
  "Ask me anything about this case",
]

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getChatPrompt(): { title: string } {
  return {
    title: pickRandom(TITLES),
  }
}
