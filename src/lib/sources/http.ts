import iconv from 'iconv-lite';

const UA = 'TourFireMaiBot/1.0 (+https://tourfiremai.com; tour deal aggregator)';

export async function getText(
	url: string,
	opts: { encoding?: string; retries?: number } = {}
): Promise<string> {
	const { encoding, retries = 2 } = opts;
	for (let i = 0; i <= retries; i++) {
		try {
			const res = await fetch(url, {
				headers: { 'user-agent': UA },
				signal: AbortSignal.timeout(15000)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			if (encoding) return iconv.decode(Buffer.from(await res.arrayBuffer()), encoding);
			return await res.text();
		} catch (e) {
			if (i === retries) throw e;
			await new Promise((r) => setTimeout(r, 400 * (i + 1)));
		}
	}
	throw new Error('unreachable');
}

// run async tasks with a concurrency cap, preserving order
export async function mapLimit<T, R>(
	items: T[],
	limit: number,
	fn: (t: T) => Promise<R>
): Promise<R[]> {
	const out: R[] = [];
	let i = 0;
	const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
		while (i < items.length) {
			const idx = i++;
			out[idx] = await fn(items[idx]);
		}
	});
	await Promise.all(workers);
	return out;
}
