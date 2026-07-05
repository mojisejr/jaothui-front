import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { BsGem } from "react-icons/bs";
import {
  V2Layout,
  Avatar,
  Button,
  Badge,
  StatCard,
  BuffaloCard,
  WalletCard,
  FilterChip,
  SettingsRow,
  SearchInput,
  Pagination,
} from "../components/v2";

/**
 * /design — dev-only showcase of the v2 (dark-gold-green) primitives.
 * The surface /design-verify opens to audit computed CSS against DESIGN.md verify_tokens.
 * `?static=1` freezes animations for a stable screenshot baseline.
 * Gated to non-production by getServerSideProps (404 in prod).
 */
export const getServerSideProps: GetServerSideProps = async () => {
  if (process.env.NODE_ENV === "production") return { notFound: true };
  return { props: {} };
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

const SWATCHES: Array<{ name: string; className: string }> = [
  { name: "background", className: "bg-background" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-raised", className: "bg-surface-raised" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-hover", className: "bg-accent-hover" },
  { name: "success", className: "bg-success" },
  { name: "info", className: "bg-info" },
  { name: "danger", className: "bg-danger" },
];

const GRADIENTS: Array<{ name: string; className: string }> = [
  { name: "gradient-ring", className: "bg-gradient-ring" },
  { name: "gradient-gold", className: "bg-gradient-gold" },
  { name: "gradient-hero", className: "bg-gradient-hero" },
];

export default function DesignShowcase() {
  const router = useRouter();
  const isStatic = router.query.static === "1";

  return (
    <div data-static={isStatic ? "1" : undefined}>
      <V2Layout activeTab="home">
        <div data-testid="design-showcase" className="bg-background">
          <div className="px-5 pt-8 pb-2">
            <h1 className="text-3xl font-bold text-accent">JAOTHUI v2</h1>
            <p className="text-sm text-muted">Design showcase · dark · gold · green</p>
          </div>

          <Section title="Profile header (avatar + gradient ring)">
            <div className="flex items-center gap-4">
              <Avatar
                size="xl"
                onEdit={() => {}}
                image={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/images/thuiLogo.png" alt="เจ้าทุย ฟาร์ม" className="h-full w-full object-contain p-2" />
                }
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold text-foreground">เจ้าทุย ฟาร์ม</h2>
                  <span className="text-success" title="verified">&#10004;</span>
                </div>
                <p className="text-sm text-muted">jaothuifarm@gmail.com</p>
                <span className="mt-2 inline-block">
                  <Badge variant="champion">เจ้าของฟาร์ม</Badge>
                </span>
              </div>
            </div>
          </Section>

          <Section title="Gradients">
            <div className="grid grid-cols-3 gap-3">
              {GRADIENTS.map((g) => (
                <div key={g.name} className="flex flex-col gap-1">
                  <div className={`h-12 rounded-card border border-border-soft ${g.className}`} />
                  <span className="text-[10px] text-muted">{g.name}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Color tokens">
            <div className="grid grid-cols-4 gap-3">
              {SWATCHES.map((s) => (
                <div key={s.name} className="flex flex-col gap-1">
                  <div className={`h-12 rounded-card border border-border-soft ${s.className}`} />
                  <span className="text-[10px] text-muted">{s.name}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button data-testid="v2-gold-button" variant="gold-fill">
                ค้นหาควาย
              </Button>
              <Button variant="gold-gradient">ค้นหาควาย (gradient)</Button>
              <Button variant="gold-outline">
                <BsGem className="h-4 w-4" /> NFT เพชรดีกรี
              </Button>
              <Button variant="gold-fill" loading={!isStatic}>
                กำลังโหลด
              </Button>
              <Button variant="gold-outline" disabled>
                ปิดใช้งาน
              </Button>
            </div>
          </Section>

          <Section title="Status badges">
            <div className="flex flex-wrap gap-2">
              <Badge variant="champion">Champion</Badge>
              <Badge variant="breeding" dot>
                Breeding
              </Badge>
              <Badge data-testid="v2-verified-badge" variant="verified" dot>
                Verified
              </Badge>
              <Badge variant="for-sale">For Sale</Badge>
            </div>
          </Section>

          <Section title="Filter chips">
            <div className="flex gap-2 overflow-x-auto">
              <FilterChip active>ทั้งหมด</FilterChip>
              <FilterChip>Champion</FilterChip>
              <FilterChip>Breeding</FilterChip>
              <FilterChip>Verified</FilterChip>
              <FilterChip>For Sale</FilterChip>
            </div>
          </Section>

          <Section title="Search">
            <SearchInput placeholder="ค้นหาเลขชิป, ชื่อควาย, Certificate" />
          </Section>

          <Section title="Stat cards">
            <div className="grid grid-cols-2 gap-3">
              <StatCard value="1,180+" unit="ราย" label="เกษตรกรในเครือข่าย" />
              <StatCard value="1,680+" unit="ตัว" label="กระบือในฐานข้อมูล" />
              <StatCard value="30+" unit="รายการ" label="กิจกรรมร่วม" />
              <StatCard value="980+" unit="ตัว" label="กระบือยืนยันแล้ว" />
            </div>
          </Section>

          <Section title="Buffalo cards (age badge = real calculatedAge)">
            <div className="grid grid-cols-2 gap-3">
              <BuffaloCard
                name="เพชรอุดร"
                chip="123456789012345"
                birthdate="12/05/2566"
                ageMonths={14}
              />
              <BuffaloCard
                name="พญาเพชร"
                chip="741852963852741"
                birthdate="03/06/2567"
                ageMonths={0}
                verified
              />
            </div>
          </Section>

          <Section title="Pagination">
            <Pagination page={1} totalPages={10} onChange={() => {}} />
          </Section>

          <Section title="Wallet card">
            <div className="flex flex-col gap-3">
              <WalletCard connected provider="Bitkub NEXT" address="0xAbc...1234ef" />
              <WalletCard connected={false} provider="Bitkub NEXT" />
            </div>
          </Section>

          <Section title="Settings rows">
            <div className="overflow-hidden rounded-card border border-border-soft bg-surface">
              <SettingsRow label="แก้ไขโปรไฟล์" />
              <SettingsRow label="ข้อมูลฟาร์ม" />
              <SettingsRow label="ธีมสี" right={<span className="text-sm text-muted">Dark</span>} />
              <SettingsRow variant="danger" label="ออกจากระบบ" />
            </div>
          </Section>

          <Section title="Verify anchors">
            <div className="flex flex-col gap-2">
              <div
                data-testid="v2-surface"
                className="rounded-card border border-border-soft bg-surface p-4 text-foreground"
              >
                surface + foreground text
              </div>
              <p data-testid="v2-success-text" className="text-success">
                Connected / Verified (success)
              </p>
            </div>
          </Section>
        </div>
      </V2Layout>
    </div>
  );
}
