const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function urgencyScore(
	t: { nextDepartISO?: string; minSeats?: number },
	now = new Date()
): number {
	if (!t.nextDepartISO) return 0;
	const days = (new Date(t.nextDepartISO).getTime() - now.getTime()) / 86_400_000;
	if (days < 0) return 0;
	// 0 days -> ~100, 60 days -> ~0
	const base = clamp(100 - (days / 60) * 100);
	const seatBonus =
		t.minSeats != null && t.minSeats <= 5 ? (6 - Math.max(t.minSeats, 0)) * 4 : 0;
	return clamp(base + seatBonus);
}

export function dealScore(t: {
	priceFrom: number;
	countryMedian?: number;
	discountPct?: number;
}): number {
	const med = t.countryMedian && t.countryMedian > 0 ? t.countryMedian : t.priceFrom;
	// ratio 0.5 (half median) -> ~100, ratio 1.5 -> ~0
	const ratio = t.priceFrom / med;
	const base = clamp(100 - (ratio - 0.5) * 100);
	const discountBonus = t.discountPct ? clamp(t.discountPct * 0.5, 0, 30) : 0;
	return clamp(base + discountBonus);
}

export function fireScore(urgency: number, deal: number): number {
	return clamp(0.55 * urgency + 0.45 * deal);
}
