import { buildDonationOptions, PROMPTPAY_ID, SATANG } from '$lib/support';

export const prerender = true;

// QR images are generated here at build time, so promptparse/qrcode never reach
// the client bundle — the page only receives ready-made PNG data URLs.
export const load = async () => {
	const options = await buildDonationOptions(PROMPTPAY_ID);
	return { options, satang: SATANG, configured: PROMPTPAY_ID !== '0000000000' };
};
