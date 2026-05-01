import {App} from "./app.js";

let app = new App({ urlBase: import.meta.url });
await app.toStart();
