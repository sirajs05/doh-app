export const MOODS = [
	{ value: 'great', emoji: '😄', label: 'Great', color: 'var(--gold)' },
	{ value: 'good', emoji: '🙂', label: 'Good', color: 'var(--green)' },
	{ value: 'okay', emoji: '😐', label: 'Okay', color: 'var(--blue)' },
	{ value: 'stressed', emoji: '😟', label: 'Stressed', color: 'var(--purple)' },
	{ value: 'overwhelmed', emoji: '😣', label: 'Overwhelmed', color: 'var(--red)' }
] as const;

export type MoodValue = (typeof MOODS)[number]['value'];
