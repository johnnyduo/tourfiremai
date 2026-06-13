import type { Tour } from './types';

// keep the highest-fireScore entry per id, then sort by fireScore desc.
export function dedupe(tours: Tour[]): Tour[] {
	const byId = new Map<string, Tour>();
	for (const t of tours) {
		const ex = byId.get(t.id);
		if (!ex || t.fireScore > ex.fireScore) byId.set(t.id, t);
	}
	return [...byId.values()].sort((a, b) => b.fireScore - a.fireScore);
}
