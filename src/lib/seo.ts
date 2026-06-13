import type { Tour } from './types';

export function tourJsonLd(t: Tour, base: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'TouristTrip',
		name: t.title,
		description: t.description,
		url: `${base}/tour/${t.slug}`,
		image: t.image,
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

/**
 * Serialize a JSON-LD object safely for embedding in a <script> tag.
 * Escapes `<` so a scraped string containing `</script>` cannot break out
 * of the script element (XSS). Use with {@html `<script ...>${ldJson(obj)}</script>`}.
 */
export function ldJson(obj: unknown): string {
	return JSON.stringify(obj).replace(/</g, '\\u003c');
}
