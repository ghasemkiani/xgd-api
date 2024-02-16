import {env} from "node:process";

import {cutil} from "@ghasemkiani/base";
import {Obj} from "@ghasemkiani/base";

class Client extends Obj {
	static {
		cutil.extend(this.prototype, {
			_apiKey: null,
		});
	}
	get apiKey() {
		if (cutil.na(this._apiKey)) {
			this._apiKey = env["XGD_API_Key"];
		}
		return this._apiKey;
	}
	set apiKey(apiKey) {
		this._apiKey = apiKey;
	}
	async toShorten({url, shortid, analytics, filterbots, verbose}) {
		let client = this;
		let {apiKey: key} = client;
		console.log({url, shortid, analytics, filterbots, key});
		let uRL = new URL(` https://xgd.io/V1/shorten`);
		uRL.search = new URLSearchParams({
			url,
			...(cutil.a(shortid) ? {shortid} : {}),
			...(cutil.a(analytics) ? {analytics} : {}),
			...(cutil.a(filterbots) ? {filterbots} : {}),
			key,
		});
		let result = await (await fetch(uRL)).json();
		if (result.status !== 200) {
			throw new Error(result.message);
		}
		if (verbose) {
			console.log(result);
		}
		return result.shorturl;
	}
}

export {Client};
