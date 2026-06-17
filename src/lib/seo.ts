import type { Tour } from './types';
import { SOURCE_LABELS } from './sources-meta';
import { SITE } from './site';

export function tourJsonLd(t: Tour, base: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'TouristTrip',
		name: t.title,
		description: t.description,
		url: `${base}/tour/${t.slug}`,
		image: t.image,
		touristType: 'leisure',
		itinerary: t.highlights?.length
			? {
					'@type': 'ItemList',
					itemListElement: t.highlights.map((h, i) => ({
						'@type': 'ListItem',
						position: i + 1,
						name: h
					}))
				}
			: undefined,
		provider: {
			'@type': 'TravelAgency',
			name: SOURCE_LABELS[t.source] ?? t.source
		},
		offers: {
			'@type': 'Offer',
			price: t.priceFrom,
			priceCurrency: 'THB',
			availability: t.nextDepartISO
				? 'https://schema.org/InStock'
				: 'https://schema.org/SoldOut',
			validThrough: t.nextDepartISO,
			url: `${base}/go/${t.id}`
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

export function organizationJsonLd(base: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: SITE.name,
		url: base,
		logo: `${base}/icon-512.png`,
		description:
			'TionPromo รวมโปรโมชันทั่วไทย — ทัวร์ไฟไหม้ ทัวร์ราคาถูกที่นั่งเหลือน้อย และโปรเดือนเกิด สิทธิ์วันเกิดจากแบรนด์ดัง',
		sameAs: []
	};
}

export function webSiteJsonLd(base: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE.name,
		url: base,
		inLanguage: 'th-TH',
		potentialAction: {
			'@type': 'SearchAction',
			target: { '@type': 'EntryPoint', urlTemplate: `${base}/search?q={query}` },
			'query-input': 'required name=query'
		}
	};
}

export function breadcrumbJsonLd(crumbs: Array<{ name: string; url: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: crumbs.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: c.url
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
