import { refresh } from './refresh';

refresh()
	.then((p) => {
		console.log(`deals: ${p.count} @ ${p.generatedAt}`);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
