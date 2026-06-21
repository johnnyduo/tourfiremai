<script lang="ts">
	import { SOURCE_LABELS } from '$lib/sources-meta';
	import { SITE } from '$lib/site';
</script>

<footer>
	<div class="container">
		<p class="big fire-text">{SITE.name} 🔥</p>
		<p>
			{SITE.name} รวมโปรโมชันเด็ดจากทั่วไทย — 🔥 ทัวร์ไฟไหม้ ทัวร์ราคาถูกที่นั่งเหลือน้อย
			และ 🎂 โปรเดือนเกิด สิทธิ์วันเกิดจากแบรนด์ดัง อัปเดตทุกวัน
			เราเป็นเพียงผู้รวบรวมข้อมูลและลิงก์ไปยังผู้ขายโดยตรง การจองและรับสิทธิ์ทำกับร้านค้าต้นทาง
		</p>
		<p class="sources">แหล่งข้อมูลทัวร์: {Object.values(SOURCE_LABELS).join(' · ')}</p>
		<p class="support"><a href="/support">💝 สนับสนุนเรา — ช่วยค่าเซิร์ฟเวอร์</a></p>
		<p class="fine">
			© {new Date().getFullYear()}
			{SITE.name} · ราคา ที่นั่ง และสิทธิ์โปรโมชันอาจเปลี่ยนแปลง โปรดยืนยันกับร้านค้า
		</p>
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
	.support a {
		color: var(--fire2);
		font-weight: 700;
		text-decoration: none;
	}
	.support a:hover {
		text-decoration: underline;
	}
</style>
