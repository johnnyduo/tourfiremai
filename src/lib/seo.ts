import type { Tour } from './types';

export function tourJsonLd(t: Tour, base: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'TouristTrip',
		name: t.title,
		url: `${base}/tour/${t.slug}`,
		touristType: 'leisure',
		offers: {
			'@type': 'Offer',
			price: t.priceFrom,
			priceCurrency: 'THB',
			availability: t.nextDepartISO
				? 'https://schema.org/InStock'
				: 'https://schema.org/SoldOut',
			validThrough: t.nextDepartISO,
			url: t.sourceUrl
		}
	};
}

export function itemListJsonLd(tours: Tour[], base: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		numberOfItems: tours.length,
		itemListElement: tours.map((t, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			url: `${base}/tour/${t.slug}`,
			name: t.title
		}))
	};
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((it) => ({
			'@type': 'Question',
			name: it.q,
			acceptedAnswer: { '@type': 'Answer', text: it.a }
		}))
	};
}
