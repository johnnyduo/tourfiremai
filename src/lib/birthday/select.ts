import type { BirthdayPromo, PromoCategory } from './types';
import { CATEGORY_ORDER, CATEGORY_LABELS } from './types';

export function currentMonth(now: Date): number {
	return now.getMonth() + 1; // local month — matches the user's "today"
}

export function promosForBirthMonth(promos: BirthdayPromo[], month: number): BirthdayPromo[] {
	return promos.filter((x) => x.evergreen || (x.months?.includes(month) ?? false));
}

/** Promos pinned to this calendar month (month-specific campaigns), excluding pure evergreen. */
export function monthSpecific(promos: BirthdayPromo[], month: number): BirthdayPromo[] {
	return promos.filter((x) => !x.evergreen && (x.months?.includes(month) ?? false));
}

/** Promos valid in any birth month (evergreen). Order preserved. */
export function evergreenPromos(promos: BirthdayPromo[]): BirthdayPromo[] {
	return promos.filter((x) => x.evergreen);
}

export function promosForCalendarMonth(
	promos: BirthdayPromo[],
	month: number,
	now: Date
): BirthdayPromo[] {
	return promos.filter((x) => {
		if (!x.months?.includes(month)) return false;
		if (x.validUntilISO && new Date(x.validUntilISO).getTime() < now.getTime()) return false;
		return true;
	});
}

export function groupByCategory(
	promos: BirthdayPromo[]
): Array<{ category: PromoCategory; label: string; items: BirthdayPromo[] }> {
	return CATEGORY_ORDER.map((category) => ({
		category,
		label: CATEGORY_LABELS[category],
		items: promos.filter((x) => x.category === category)
	})).filter((g) => g.items.length > 0);
}
