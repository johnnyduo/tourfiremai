import { anyId } from 'promptparse/generate';
import QRCode from 'qrcode';

/**
 * Donation config for the /support page.
 *
 * PROMPTPAY_ID is the recipient's PromptPay target. For a mobile number use the
 * 10-digit MSISDN (e.g. "0812345678"). Replace the placeholder before launch.
 *
 * Each preset amount carries a fixed ".88" satang signature so that incoming
 * transfers can be recognised as coming from TionPromo when reviewing the bank
 * statement (a lightweight, gateway-free way to attribute the channel).
 */
export const PROMPTPAY_ID = '0828886624'; // PromptPay mobile number (public, for receiving transfers)
export const SATANG = 0.88;

export const PRESET_BASES = [50, 100, 200, 500] as const;

/** Amounts actually charged, e.g. 50.88, 100.88, ... */
export const PRESET_AMOUNTS = PRESET_BASES.map((b) => +(b + SATANG).toFixed(2));

/** EMVCo PromptPay payload string for a mobile number + amount. */
export function promptPayPayload(mobile: string, amount: number): string {
	return anyId({ type: 'MSISDN', target: mobile, amount });
}

/** Render a payload to a PNG data URL (done at build time, never shipped to the client). */
export async function qrDataUrl(payload: string): Promise<string> {
	return QRCode.toDataURL(payload, { margin: 1, width: 320 });
}

export interface DonationOption {
	amount: number; // e.g. 200.88
	label: string; // e.g. "200"
	qr: string; // PNG data URL
}

/** Build all preset donation options (payload + QR image) for the given PromptPay id. */
export async function buildDonationOptions(promptpayId: string): Promise<DonationOption[]> {
	return Promise.all(
		PRESET_AMOUNTS.map(async (amount, i) => ({
			amount,
			label: String(PRESET_BASES[i]),
			qr: await qrDataUrl(promptPayPayload(promptpayId, amount))
		}))
	);
}
