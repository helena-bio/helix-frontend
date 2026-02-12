/**
 * Time-aware dashboard greetings.
 * Randomly selected based on local hour.
 * {name} is replaced with user's first name at runtime.
 */

interface GreetingSet {
  titles: string[]
  subtitles: string[]
}

const MORNING: GreetingSet = {
  titles: [
    "Good morning, {name}",
    "Morning, {name}",
    "Rise and shine, {name}",
    "Fresh start, {name}",
    "Ready for a productive morning, {name}?",
  ],
  subtitles: [
    "Your cases are waiting. Coffee first?",
    "Let's make today count.",
    "Early hours, sharp analysis.",
    "A new day, new variants to explore.",
    "The lab is quiet. Perfect time to review.",
  ],
}

const AFTERNOON: GreetingSet = {
  titles: [
    "Good afternoon, {name}",
    "Afternoon, {name}",
    "Welcome back, {name}",
    "How's the day going, {name}?",
    "Back at it, {name}?",
  ],
  subtitles: [
    "Halfway through the day. Let's keep the momentum.",
    "Your cases are ready for review.",
    "Steady progress, one variant at a time.",
    "The best discoveries happen after lunch.",
    "Pick up where you left off.",
  ],
}

const EVENING: GreetingSet = {
  titles: [
    "Good evening, {name}",
    "Evening, {name}",
    "Still going strong, {name}?",
    "Wrapping up the day, {name}?",
    "Evening shift, {name}?",
  ],
  subtitles: [
    "A few more cases before calling it a day?",
    "The quiet hours produce the best insights.",
    "Winding down or just getting started?",
    "Your variants will still be here tomorrow. But so will you.",
    "End the day with one more review.",
  ],
}

const NIGHT: GreetingSet = {
  titles: [
    "Hey night owl, {name}",
    "Burning the midnight oil, {name}?",
    "Late night session, {name}?",
    "Can't sleep either, {name}?",
    "The night shift, {name}",
  ],
  subtitles: [
    "Great discoveries happen at unusual hours.",
    "The genome never sleeps. Neither do you, apparently.",
    "Quiet hours, focused work.",
    "Just you, your data, and the silence.",
    "Tomorrow's breakthroughs start tonight.",
  ],
}

function getGreetingSet(hour: number): GreetingSet {
  if (hour >= 5 && hour < 12) return MORNING
  if (hour >= 12 && hour < 17) return AFTERNOON
  if (hour >= 17 && hour < 22) return EVENING
  return NIGHT
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getDashboardGreeting(fullName?: string): { title: string; subtitle: string } {
  const hour = new Date().getHours()
  const set = getGreetingSet(hour)

  const firstName = fullName?.split(' ')[0] ?? ''
  const title = firstName
    ? pickRandom(set.titles).replace('{name}', firstName)
    : 'Dashboard'
  const subtitle = pickRandom(set.subtitles)

  return { title, subtitle }
}
