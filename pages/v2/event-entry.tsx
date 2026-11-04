import type { GetServerSideProps } from "next";
import Link from "next/link";
import { recordEventSsoFailure } from "../../server/auth/event-sso-diagnostics";
import { activeBrowser, EventSsoError, freshAccount, noStore, ssoConfig, validEventId } from "../../server/auth/event-sso";
import { beginLineAttach } from "../../server/auth/event-sso-line-attach";
import { eventEntryParams } from "../../utils/event-entry-intent";
type Props = { message: string; history?: boolean; loginTo?: string; linkTo?: string; retryTo?: string; supportReference?: string };
function entryIntent(query: Record<string, string | string[] | undefined>) {
  validEventId(query.eventId);
  try { return eventEntryParams(query); } catch { throw new EventSsoError(400, "INVALID_AUTHORIZATION_REQUEST"); }
}
export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, query }) => {
  noStore(res);
  let stage = "entry_configuration";
  try {
    stage = "entry_intent";
    const params = entryIntent(query); const eventId = params.get("eventId")!;
    // A public history tap still reaches Event's normal authentication during SSO rollback.
    if (params.get("intent") === "history" && process.env.JAOTHUI_EVENT_SSO_ENABLED !== "true") {
      const origin = process.env.JAOTHUI_EVENT_ORIGIN;
      const url = new URL(origin ?? "");
      if (url.origin !== origin || url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new EventSsoError(503, "SSO_CONFIGURATION_UNAVAILABLE");
      return { redirect: { destination: `${url.origin}/profile/my-events?${new URLSearchParams({ eventId })}`, permanent: false } };
    }
    const config = ssoConfig();
    const returnTo = `/v2/event-entry?${params}`;
    stage = "entry_principal";
    let browser;
    try { browser = await activeBrowser({ req, res }); }
    catch (error) {
      if (error instanceof EventSsoError && ["LOGIN_REQUIRED", "BROWSER_SESSION_INVALID"].includes(error.code)) {
        recordEventSsoFailure({ req, res }, stage, error, true);
        return { props: { history: params.get("intent") === "history", message: params.get("intent") === "history" ? "กรุณาเข้าสู่ระบบเพื่อดูใบสมัครของคุณ" : "กรุณาเข้าสู่ระบบเพื่อสมัครงานประกวด", loginTo: `/oauth/web/line/start?${new URLSearchParams({ returnTo })}`, retryTo: returnTo } };
      }
      throw error;
    }
    stage = "entry_identity";
    const account = await freshAccount(browser.accountId);
    if (!account.lineId) {
      stage = "line_attach";
      if (query.attach === "line") return { redirect: { destination: await beginLineAttach({ req, res }, returnTo), permanent: false } };
      return { props: { history: params.get("intent") === "history", message: "เชื่อม LINE กับบัญชีปัจจุบันเพื่อใช้ข้อมูลผู้สมัครเดิม", linkTo: `${returnTo}&attach=line` } };
    }
    stage = "handoff";
    if (params.has("state")) {
      params.set("code_challenge_method", "S256");
      return { redirect: { destination: `/api/auth/event-sso/authorize?${params}`, permanent: false } };
    }
    return { redirect: { destination: `${config.eventOrigin}/api/auth/front/start?${new URLSearchParams({ eventId, ...(params.get("intent") === "history" ? { intent: "history" } : {}) })}`, permanent: false } };
  } catch (error) {
    const { failure, requestId } = recordEventSsoFailure({ req, res }, stage, error); res.statusCode = failure.status;
    const message = failure.code === "SSO_DISABLED" ? "ยังไม่เปิดใช้การสมัครจากเว็บไซต์" : failure.status === 409 ? "บัญชีหรือ LINE มีข้อมูลขัดแย้ง กรุณาตรวจสอบบัญชีที่เข้าสู่ระบบ" : "ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง";
    if (failure.code === "SSO_DISABLED") return { props: { message } };
    let retryTo: string | undefined;
    try { retryTo = `/v2/event-entry?${entryIntent(query)}`; } catch { /* Invalid intent has no recovery redirect. */ }
    return { props: { message, history: query.intent === "history", supportReference: requestId, ...(retryTo ? { retryTo } : {}) } };
  }
};
export default function EventEntry({ message, history, loginTo, linkTo, retryTo, supportReference }: Props) {
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"><div className="max-w-md text-center space-y-6"><h1 className="text-xl font-semibold">{history ? "ดูใบสมัครของฉัน" : "สมัครงานประกวด"}</h1><p>{message}</p>{supportReference && <p className="text-sm text-muted">หากยังพบปัญหา กรุณาแจ้งเลขอ้างอิงนี้แก่ผู้ดูแล: <span>{supportReference}</span></p>}{loginTo && <Link href={loginTo} className="inline-flex min-h-[44px] items-center underline">เข้าสู่ระบบด้วย LINE</Link>}{linkTo && <a href={linkTo} className="inline-flex min-h-[44px] items-center underline">เชื่อม LINE กับบัญชีนี้</a>}{retryTo && <Link href={retryTo} className="block underline">{supportReference ? "ลองอีกครั้งสำหรับงานนี้" : "ลองอีกครั้งหลังเข้าสู่ระบบ"}</Link>}<Link href="/v2/profile" className="block underline">ตรวจสอบบัญชีของฉัน</Link></div></main>;
}

// Initial handoff/error HTML must render without client wallet gates.
EventEntry.publicPage = true;
