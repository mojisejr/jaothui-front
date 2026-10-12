import assert from "node:assert/strict";
import { shareDownload } from "../utils/share-download.ts";
import { DOWNLOAD_URL } from "../utils/download-routing.ts";

let copies = 0;
const copy = async (url) => { assert.equal(url, DOWNLOAD_URL); copies++; };
assert.equal(await shareDownload({ share: async (data) => assert.equal(data.url, DOWNLOAD_URL), copy }), "shared");
assert.equal(copies, 0);
assert.equal(await shareDownload({ share: async () => { throw { name: "AbortError" }; }, copy }), "cancelled");
assert.equal(copies, 0, "cancelling must not copy");
assert.equal(await shareDownload({ share: async () => { throw { name: "NotAllowedError" }; }, copy }), "copied");
assert.equal(await shareDownload({ copy }), "copied");
assert.equal(copies, 2);
assert.equal(await shareDownload({ copy: async () => { throw new Error("blocked"); } }), "manual");
assert.equal(await shareDownload({}), "manual");
console.log("HOME_APP_SHARE_OK: native share, cancellation, denied/unsupported copy and manual URL fallback");
