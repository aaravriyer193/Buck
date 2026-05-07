// =============================================================================
// Buck — greeting helpers
// =============================================================================
// Time-of-day-aware. Picks from a small pool so the dashboard feels alive.
// Server-rendered, so a refresh = a new greeting. That's intentional.
// =============================================================================

type Bucket = 'lateNight' | 'earlyMorning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

function bucketFor(hour: number): Bucket {
  if (hour < 4)  return 'lateNight';      // 12am – 3:59am
  if (hour < 7)  return 'earlyMorning';   // 4am – 6:59am
  if (hour < 12) return 'morning';        // 7am – 11:59am
  if (hour < 14) return 'midday';         // 12pm – 1:59pm
  if (hour < 18) return 'afternoon';      // 2pm – 5:59pm
  if (hour < 22) return 'evening';        // 6pm – 9:59pm
  return 'night';                         // 10pm – 11:59pm
}

const STAMPS: Record<Bucket, string[]> = {
  lateNight: [
    'witching hour',
    'still up',
    'graveyard shift',
    'small hours',
    'past midnight',
    'the long hours',
  ],
  earlyMorning: [
    'first light',
    'too early',
    'pre-dawn',
    'before the rooster',
    'crack of dawn',
  ],
  morning: [
    'morning',
    'fresh pot',
    'rush hour',
    'inbox o’clock',
    'the daily grind',
    'coffee in hand',
  ],
  midday: [
    'lunch hour',
    'high noon',
    'midday',
    'half past everything',
    'sandwich time',
  ],
  afternoon: [
    'afternoon',
    'post-lunch slump',
    'the long stretch',
    'second wind',
    'three o’clock energy',
  ],
  evening: [
    'evening',
    'happy hour',
    'wind down',
    'after hours',
    'the gloaming',
    'shift change',
  ],
  night: [
    'tonight',
    'almost bedtime',
    'last call',
    'lights out soon',
    'witching hour approaches',
  ],
};

const GREETINGS: Record<Bucket, string[]> = {
  lateNight: [
    'Still up',
    'Burning the candle',
    'Long night',
    'Up late again',
    'You should be sleeping',
  ],
  earlyMorning: [
    'You’re up early',
    'Up with the birds',
    'Early start',
    'Look who’s up',
    'Welcome back, early bird',
  ],
  morning: [
    'Good morning',
    'Morning',
    'Welcome back',
    'Hello again',
    'Hi',
    'Up and at it',
  ],
  midday: [
    'Hey',
    'Hello',
    'Welcome back',
    'Hi there',
    'Good to see you',
  ],
  afternoon: [
    'Hello',
    'Hey',
    'Welcome back',
    'Hi again',
    'Good afternoon',
  ],
  evening: [
    'Good evening',
    'Welcome back',
    'Evening',
    'Hello',
    'Hey',
  ],
  night: [
    'Evening',
    'Late check-in',
    'Welcome back',
    'Still working',
    'Hey night owl',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getStamp(date: Date = new Date()): string {
  return pick(STAMPS[bucketFor(date.getHours())]);
}

export function getGreeting(date: Date = new Date()): string {
  return pick(GREETINGS[bucketFor(date.getHours())]);
} 