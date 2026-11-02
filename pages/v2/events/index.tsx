import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { V2Layout } from "../../../components/v2/V2Layout";
import { EventList } from "../../../components/v2/EventList";

export const getStaticProps: GetStaticProps<{ eventsEnabled: boolean }> = async () => ({
  props: { eventsEnabled: process.env.JAOTHUI_EVENT_SSO_ENABLED === "true" },
  revalidate: 60,
});

export default function EventsPage({ eventsEnabled }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <V2Layout activeTab="home">
    <section className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8">
      <h1 className="text-2xl font-bold text-foreground">งานประกวดที่เปิดรับสมัคร</h1>
      {eventsEnabled ? <EventList /> : <p className="text-muted">ระบบกิจกรรมยังไม่พร้อมใช้งาน</p>}
    </section>
  </V2Layout>;
}

// Public discovery renders its initial HTML without the wallet/auth provider gate.
EventsPage.publicPage = true;
