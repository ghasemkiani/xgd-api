import process from "node:process";

import {cutil} from "@ghasemkiani/base";
import {App as AppBase} from "@ghasemkiani/base-app";
import {dumper} from "@ghasemkiani/base-app";

import {Client} from "./client.js";

class App extends cutil.mixin(AppBase, dumper) {
	static {
		cutil.extend(this.prototype, {
			prefsId: "gkxgd",
			defaultPrefs: {
				apiKey: null,
			},
			_client: null,
		});
	}
	get client() {
		if (cutil.na(this._client)) {
			this._client = new Client({apiKey: this.prefs.apiKey});
		}
		return this._client;
	}
	set client(client) {
		this._client = client;
	}
	get apiKey() {
		return this.client.apiKey;
	}
	set apiKey(apiKey) {
		this.client.apiKey = apiKey;
	}
	async toDefineInitOptions() {
		await super.toDefineInitOptions();
		let app = this;
		await app.toDefineInitOptionsDumper();
		app.commander.option("-k, --key", "API key for x.gd");
		app.commander.option("--set-key", "set API key for x.gd persistently");
		app.commander.command("run");
		app.commander.command("do")
			.description("Shorten a URL")
			.argument("<url>", "url to shorten")
			.option("-i, --shortid <shortid>", "shortid")
			.option("-a, --analytics", "opt in for analytics (default: true)")
			.option("-b, --filterbots", "opt in for filtering bots (default: false)")
			.option("-v, --verbose", "show verbose info")
			.action(async (url, {shortid, analytics, filterbots, verbose}) => {
				app.sub("run", async () => {
					await app.toShortenUrl({url, shortid, analytics, filterbots});
				})
			});
	}
	async toApplyInitOptions() {
		await super.toApplyInitOptions();
		let app = this;
		await app.toApplyInitOptionsDumper();
		let opts = app.commander.opts();
		if (cutil.a(opts.key)) {
			app.apiKey = opts.key;
		}
		if (cutil.a(opts.setKey)) {
			app.prefs.apiKey = opts.setKey;
		}
	}
	async toShortenUrl({url, shortid, analytics, filterbots}) {
		let app = this;
		let {client} = app;
		let {prefs} = app;
		if (cutil.a(prefs.key)) {
			client.apiKey = prefs.key;
		}
		try {
			let u = await client.toShorten({url, shortid, analytics, filterbots});
			console.log(u);
		} catch (e) {
			console.log(e.message);
			process.exit(1);
		}
	}
}

export {App};
