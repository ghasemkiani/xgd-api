import process from "node:process";

import { cutil } from "@ghasemkiani/base";
import { App as AppBase } from "@ghasemkiani/base-app";
import { dumper } from "@ghasemkiani/base-app";
import { infoer } from "@ghasemkiani/base-app";
import { pathable } from "@ghasemkiani/base-app";
import { iwdbApp } from "@ghasemkiani/sqlite";

import { Client } from "./client.js";

class App extends cutil.mixin(AppBase, infoer, dumper, pathable, iwdbApp) {
	static {
		cutil.extend(this.prototype, {
			prefsId: "gkxgd",
			defaultPrefs: {
				apiKey: null,
				...infoer.defaultPrefsInfoer,
				...iwdbApp.defaultPrefsIWDbApp,
			},
      sqlCreate: `@create.sql`,
			_client: null,
		});
	}
	get client() {
		if (cutil.na(this._client)) {
			this._client = new Client({ apiKey: this.prefs.apiKey });
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
		await app.toDefineInitOptionsInfoer();
		await app.toDefineInitOptionsIWDbApp();
		app.commander.option("-k, --key", "API key for x.gd");
		app.commander.option("--set-key", "set API key for x.gd persistently");
		app.commander.command("run");
		app.commander.command("do")
			.alias("create")
			.alias("c")
      .description("Shorten a URL")
			.argument("<url>", "url to shorten")
			.option("-i, --shortid <shortid>", "shortid")
			.option("-a, --analytics", "opt in for analytics (default: true)")
			.option("-b, --filterbots", "opt in for filtering bots (default: false)")
			.option("-v, --verbose", "show verbose info")
			.action(async (url, { shortid, analytics, filterbots, verbose }) => {
				app.sub("run", async () => {
					await app.toShortenUrl({
						url,
						shortid,
						analytics,
						filterbots,
						verbose,
					});
				});
			});
		app.commander
			.command("search")
			.alias("s")
			.description("search for urls")
			.argument("<query>", "search query")
			.action(async (query) => {
				app.sub("run", async () => {
					await app.toSearch({ query });
				});
			});
	}
	async toApplyInitOptions() {
		await super.toApplyInitOptions();
		let app = this;
		await app.toApplyInitOptionsDumper();
		await app.toApplyInitOptionsInfoer();
		await app.toApplyInitOptionsIWDbApp();
		let opts = app.commander.opts();
		if (cutil.a(opts.key)) {
			app.apiKey = opts.key;
		}
		if (cutil.a(opts.setKey)) {
			app.prefs.apiKey = opts.setKey;
		}
	}
	async toShowInfo() {
		await super.toShowInfo();
		let app = this;
		// await app.toShowInfoInfoer();
		await app.toShowInfoIWDbApp();
	}
  async toAddToDb({ url, u }) {
    let app = this;
    try {
      let stmt = app.db.prepare(`
        INSERT INTO urls (url, u) 
        VALUES (?, ?)
      `);
      let result = stmt.run(url, u);
      let id = result.lastInsertRowid;
      console.log(`db id: ${id}`);
    } catch (e) {
      console.error("Error during operation:", e);
      throw e;
    }
  }
	async toShortenUrl({ url, shortid, analytics, filterbots, verbose }) {
		let app = this;
		let { client } = app;
		let { prefs } = app;
		if (cutil.a(prefs.key)) {
			client.apiKey = prefs.key;
		}
		try {
			let u = await client.toShorten({
				url,
				shortid,
				analytics,
				filterbots,
				verbose,
			});
			console.log(u);
      await app.toAddToDb({ url, u });
		} catch (e) {
			console.log(e.message);
			process.exit(1);
		}
	}
  async toSearch({ query }) {
    let app = this;
    let sql = "SELECT * FROM urls WHERE url LIKE ? OR u LIKE ?";
    query = `%${query}%`;
    let items = app.db.prepare(sql).all(query, query);
    console.log(`Items found: ${items.length}`);
    for (let item of items) {
      console.log([
        cutil.asString(item.id).padStart(7),
        cutil.df(new Date(item.dt + "Z")).padStart(23),
        cutil.asString(item.u).padEnd(31),
        item.url,
      ].join(" "));
    }
  }
}

export { App };
