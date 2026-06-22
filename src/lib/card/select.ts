import type { CardPromo, SpendCategory } from './types';
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_ICONS } from './types';

/** A dated promo is expired when its validUntil is strictly before `now`. */
export function isExpired(promo: CardPromo, now: Date): boolean {
	if (!promo.validUntilISO) return false;
	return new Date(promo.validUntilISO).getTime() < now.getTime();
}

/** Drop expired dated promos (evergreen + still-valid dated ones survive). */
export function activePromos(promos: CardPromo[], now: Date): CardPromo[] {
	return promos.filter((p) => !isExpired(p, now));
}

/**
 * Days left until a dated promo expires. Returns null for evergreen promos or when
 * the end date has passed. Used to show a "เหลือ X วัน" badge for soon-ending deals.
 */
export function daysLeft(promo: CardPromo, now: Date): number | null {
	if (!promo.validUntilISO) return null;
	const ms = new Date(promo.validUntilISO).getTime() - now.getTime();
	if (ms < 0) return null;
	return Math.ceil(ms / 86_400_000);
}

export function groupByCategory(
	promos: CardPromo[]
): Array<{ category: SpendCategory; label: string; icon: string; items: CardPromo[] }> {
	return CATEGORY_ORDER.map((category) => ({
		category,
		label: CATEGORY_LABELS[category],
		icon: CATEGORY_ICONS[category],
		items: promos.filter((p) => p.category === category)
	})).filter((g) => g.items.length > 0);
}
