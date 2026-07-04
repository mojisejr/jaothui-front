import Image from "next/image";
import { useRouter } from "next/router";
import { BsGem } from "react-icons/bs";
import { FiUsers, FiDatabase, FiActivity, FiShield } from "react-icons/fi";
import { trpc } from "../../utils/trpc";
import {
  V2Layout,
  Button,
  StatCard,
  BuffaloCard,
  RemoteImage,
  formatThaiBirthdate,
} from "../../components/v2";

/** Featured buffalo — same real microchips the legacy Home rail uses (metadata.getBatch). */
const FEATURED_MICROCHIPS = [
  "764040226300035",
  "764040226600001",
  "933004022017321",
  "900115003414178",
  "900115003414472",
  "764040226600008",
];

/* MOCK: aggregate network counts do not exist in data yet — placeholder figures. */
const STATS = [
  { icon: <FiUsers />, value: "1,180+", unit: "ราย", label: "เกษตรกรในเครือข่าย" },
  { icon: <FiDatabase />, value: "1,680+", unit: "ตัว", label: "กระบือในฐานข้อมูล" },
  { icon: <FiActivity />, value: "30+", unit: "รายการ", label: "กิจกรรมร่วม" },
  { icon: <FiShield />, value: "980+", unit: "ตัว", label: "กระบือยืนยันแล้ว" },
];

function Hero() {
  const router = useRouter();
  return (
    <section className="relative overflow-hidden rounded-b-[32px]">
      <div className="absolute inset-0">
        <Image
          src="/images/jaothui-v2-hero-image.png"
          alt="กระบือไทยยามอาทิตย์อัสดง"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        {/* left→right scrim for headline legibility + bottom fade into the page */}
        <div className="absolute inset-0 bg-gradient-hero-scrim" />
        <div className="absolute inset-0 bg-gradient-hero-fade" />
      </div>

      <div className="relative z-10 flex min-h-[460px] flex-col justify-between px-6 pb-8 pt-7">
        <div className="flex items-center gap-2">
          <Image src="/images/thuiLogo.png" alt="เจ้าทุย" width={36} height={36} className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-wide text-accent">JAOTHUI</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Thai Buffalo Platform</p>
          </div>
        </div>

        <div className="max-w-[15rem]">
          <h1 className="text-3xl font-bold leading-tight text-foreground">
            PRESERVING <span className="text-accent">THAI BUFFALO</span> HERITAGE
            <span className="block text-lg font-semibold text-muted">THROUGH TECHNOLOGY</span>
          </h1>
          <p className="mt-3 text-sm text-muted">
            &ldquo;อนุรักษ์สายพันธุ์ไทย<br />ด้วยเทคโนโลยี เพื่ออนาคตที่ยั่งยืน&rdquo;
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="gold-fill" onClick={() => router.push("/v2/buffalo")}>
              ค้นหาควาย
            </Button>
            <Button variant="gold-outline" onClick={() => router.push("/v2/buffalo")}>
              <BsGem className="h-4 w-4" /> NFT เพชรดีกรี
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col overflow-hidden rounded-card border border-border-soft bg-surface"
        >
          <div className="aspect-[4/3] w-full bg-surface-raised" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-2/3 rounded bg-surface-raised" />
            <div className="h-3 w-1/2 rounded bg-surface-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Featured() {
  const router = useRouter();
  const { data, isLoading } = trpc.metadata.getBatch.useQuery(FEATURED_MICROCHIPS);

  return (
    <section className="px-5 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">กระบือแนะนำ</h2>
        <button
          type="button"
          onClick={() => router.push("/v2/buffalo")}
          className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          ดูทั้งหมด ›
        </button>
      </div>

      {isLoading ? (
        <FeaturedSkeleton />
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {data.slice(0, 4).map((item) => (
            <BuffaloCard
              key={item.microchip}
              name={item.name}
              chip={item.microchip}
              birthdate={formatThaiBirthdate(item.birthdate)}
              ageMonths={item.calculatedAge}
              image={
                <RemoteImage
                  src={item.image}
                  alt={item.name}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              }
              onClick={() => router.push(`/cert/${item.microchip}`)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-border-soft px-4 py-8 text-center text-sm text-muted">
          ยังไม่มีข้อมูลกระบือ
        </p>
      )}
    </section>
  );
}

export default function V2HomePage() {
  return (
    <V2Layout activeTab="home">
      <Hero />

      <section className="grid grid-cols-2 gap-3 px-5 py-6">
        {STATS.map((s) => (
          <StatCard key={s.label} icon={s.icon} value={s.value} unit={s.unit} label={s.label} />
        ))}
      </section>

      <Featured />

      {/* TODO(feature): LATEST NEWS & EVENTS — no data source yet, add in a later pass. */}
    </V2Layout>
  );
}
