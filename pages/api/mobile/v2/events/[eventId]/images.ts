import { eventHandler } from "../../../../../../server/mobile/events/http";
export const config = { api: { bodyParser: false } };
export default eventHandler("upload");
