import type { GetServerSideProps } from "next";
import Link from "next/link";
import { recordEventSsoFailure } from "../../server/auth/event-sso-diagnostics";
import { activeBrowser, EventSsoError, freshAccount, noStore, ssoConfig, validEventId } from "../../server/auth/event-sso";
import { beginLineAttach } from "../../server/auth/event-sso-line-attach";
type Props = { message: string; loginTo?: string; linkTo?: string; retryTo?: string; supportReference?: string };
function entryIntent(query: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams({ eventId: validEventId(query.eventId) });
  if (query.state !== undefined || query.code_challenge !== undefined) {
    if (typeof query.state !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(query.state) || typeof query.code_challenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(query.code_challenge)) throw new EventSsoError(400, "INVALID_AUTHORIZATION_REQUEST");
    params.set("state", query.state); params.set("code_challenge", query.code_challenge);
  }
  return params;
}
export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, query }) => {
  noStore(res);
  let stage = "entry_configuration";
  try {
    const config = ssoConfig();
    stage = "entry_intent";
    const params = entryIntent(query); const eventId = params.get("eventId")!;
    const returnTo = `/v2/event-entry?${params}`;
    stage = "entry_principal";
    let browser;
    try { browser = await activeBrowser({ req, res }); }
    catch (error) {
      if (error instanceof EventSsoError && ["LOGIN_REQUIRED", "BROWSER_SESSION_INVALID"].includes(error.code)) {
        recordEventSsoFailure({ req, res }, stage, error, true);
        return { props: { message: "กรุณาเข้าสู่ระบบเพื่อสมัครงานประกวด", loginTo: `/oauth/web/line/start?${new URLSearchParams({ returnTo })}`, retryTo: returnTo } };
      }
      throw error;
    }
    stage = "entry_identity";
    const account = await freshAccount(browser.accountId);
    if (!account.lineId) {
      stage = "line_attach";
      if (query.attach === "line") return { redirect: { destination: await beginLineAttach({ req, res }, returnTo), permanent: false } };
      return { props: { message: "เชื่อม LINE กับบัญชีปัจจุบันเพื่อใช้ข้อมูลผู้สมัครเดิม", linkTo: `${returnTo}&attach=line` } };
    }
    stage = "handoff";
    if (params.has("state")) {
      params.set("code_challenge_method", "S256");
      return { redirect: { destination: `/api/auth/event-sso/authorize?${params}`, permanent: false } };
    }
    return { redirect: { destination: `${config.eventOrigin}/api/auth/front/start?${new URLSearchParams({ eventId })}`, permanent: false } };
  } catch (error) {
    const { failure, requestId } = recordEventSsoFailure({ req, res }, stage, error); res.statusCode = failure.status;
    const message = failure.code === "SSO_DISABLED" ? "ยังไม่เปิดใช้การสมัครจากเว็บไซต์" : failure.status === 409 ? "บัญชีหรือ LINE มีข้อมูลขัดแย้ง กรุณาตรวจสอบบัญชีที่เข้าสู่ระบบ" : "ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง";
    if (failure.code === "SSO_DISABLED") return { props: { message } };
    let retryTo: string | undefined;
    try { retryTo = `/v2/event-entry?${entryIntent(query)}`; } catch { /* Invalid intent has no recovery redirect. */ }
    return { props: { message, supportReference: requestId, ...(retryTo ? { retryTo } : {}) } };
  }
};
export default function EventEntry({ message, loginTo, linkTo, retryTo, supportReference }: Props) {
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"><div className="max-w-md text-center space-y-6"><h1 className="text-xl font-semibold">สมัครงานประกวด</h1><p>{message}</p>{supportReference && <p className="text-sm text-muted">หากยังพบปัญหา กรุณาแจ้งเลขอ้างอิงนี้แก่ผู้ดูแล: <span>{supportReference}</span></p>}{loginTo && <Link href={loginTo} className="inline-flex min-h-[44px] items-center underline">เข้าสู่ระบบด้วย LINE</Link>}{linkTo && <a href={linkTo} className="inline-flex min-h-[44px] items-center underline">เชื่อม LINE กับบัญชีนี้</a>}{retryTo && <Link href={retryTo} className="block underline">{supportReference ? "ลองอีกครั้งสำหรับงานนี้" : "ลองอีกครั้งหลังเข้าสู่ระบบ"}</Link>}<Link href="/v2/profile" className="block underline">ตรวจสอบบัญชีของฉัน</Link></div></main>;
}

// Initial handoff/error HTML must render without client wallet gates.
EventEntry.publicPage = true;
