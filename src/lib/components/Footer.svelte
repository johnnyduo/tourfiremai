<script lang="ts">
	import { SOURCE_LABELS } from '$lib/sources-meta';
</script>

<footer>
	<div class="container">
		<p class="big fire-text">TourFireMai 🔥</p>
		<p>
			รวมทัวร์ไฟไหม้ ทัวร์ราคาถูก ที่นั่งเหลือน้อย จากบริษัททัวร์ชั้นนำของไทย —
			อัปเดตอัตโนมัติทุกวัน เราเป็นเพียงผู้รวบรวมข้อมูลและลิงก์ไปยังผู้ขายโดยตรง
			การจองและชำระเงินทำกับบริษัททัวร์ต้นทาง
		</p>
		<p class="sources">แหล่งข้อมูล: {Object.values(SOURCE_LABELS).join(' · ')}</p>
		<p class="fine">© {new Date().getFullYear()} TourFireMai · ราคาและที่นั่งอาจเปลี่ยนแปลง โปรดยืนยันกับผู้ขาย</p>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--line);
		margin-top: 64px;
		padding: 40px 0;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.big {
		font-size: 1.4rem;
		font-weight: 800;
		margin: 0 0 8px;
	}
	footer p {
		max-width: 720px;
		margin: 0 0 10px;
	}
	.fine {
		font-size: 0.8rem;
	}
</style>
