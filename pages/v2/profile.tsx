import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  FiChevronRight,
  FiCopy,
  FiCheck,
  FiLogOut,
  FiUser,
  FiShield,
  FiHelpCircle,
  FiInfo,
  FiMoon,
} from "react-icons/fi";
import { ReactBitkubNextOauth2 } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { trpc } from "../../utils/trpc";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { calculateBuffaloAge } from "../../utils/age-calculator";
import {
  V2Layout,
  Avatar,
  WalletCard,
  SettingsRow,
  Badge,
  Button,
  BuffaloCard,
  RemoteImage,
  formatThaiBirthdate,
} from "../../components/v2";

const clientId =
  process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_client_id_prod as string)
    : (process.env.NEXT_PUBLIC_client_id_dev as string);
const redirectURI =
  process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_redirect_prod as string)
    : (process.env.NEXT_PUBLIC_redirect_dev as string);

function shortWallet(w?: string) {
  if (!w || w.length < 12) return w ?? "";
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

/** Tap-to-copy truncated wallet address (real value from useBitkubNext). */
function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      aria-label="คัดลอกที่อยู่กระเป๋า"
    >
      <span className="tabular-nums">{shortWallet(address)}</span>
      {copied ? (
        <FiCheck className="h-3.5 w-3.5 text-success" />
      ) : (
        <FiCopy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/** Reusable "เร็วๆ นี้" tag for settings rows that aren't shipped yet. */
function SoonTag() {
  return (
    <span className="flex items-center gap-1 rounded-pill bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-muted">
      เร็วๆ นี้
      <FiChevronRight className="h-3.5 w-3.5" />
    </span>
  );
}

/** Bitkub NEXT OAuth connect button, restyled to the v2 gold theme (reuses the SDK, no rebuild). */
function ConnectButton() {
  return (
    // @ts-ignore — SDK children/props are loosely typed
    <ReactBitkubNextOauth2 clientId={clientId} redirectURI={redirectURI} mode="redirect">
      <Button variant="gold-fill" block>
        เชื่อมต่อ Bitkub NEXT
      </Button>
    </ReactBitkubNextOauth2>
  );
}

/** Settings list shared by connected states — app settings not shipped yet (disabled). */
function SettingsList({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-card border border-border-soft bg-surface">
        <SettingsRow
          icon={<FiMoon className="h-5 w-5" />}
          label="ธีมสี Dark / Light"
          disabled
          right={
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-9 items-center rounded-pill bg-surface-raised p-0.5">
                <span className="h-4 w-4 rounded-pill bg-muted" />
              </span>
              <span className="text-[10px] font-medium text-muted">เร็วๆ นี้</span>
            </span>
          }
        />
        <div className="border-t border-border-soft" />
        <SettingsRow icon={<FiUser className="h-5 w-5" />} label="แก้ไขโปรไฟล์" disabled right={<SoonTag />} />
        <div className="border-t border-border-soft" />
        <SettingsRow icon={<FiShield className="h-5 w-5" />} label="ความปลอดภัย" disabled right={<SoonTag />} />
        <div className="border-t border-border-soft" />
        <SettingsRow icon={<FiHelpCircle className="h-5 w-5" />} label="ช่วยเหลือ" disabled right={<SoonTag />} />
        <div className="border-t border-border-soft" />
        <SettingsRow icon={<FiInfo className="h-5 w-5" />} label="เกี่ยวกับเรา" disabled right={<SoonTag />} />
      </div>

      <div className="overflow-hidden rounded-card border border-border-soft bg-surface">
        <SettingsRow
          variant="danger"
          icon={<FiLogOut className="h-5 w-5" />}
          label="ออกจากระบบ"
          onClick={onLogout}
        />
      </div>
    </div>
  );
}

export default function V2ProfilePage() {
  const router = useRouter();
  const { isConnected, walletAddress, email, disconnect } = useBitkubNext();
  const [wallet, setWallet] = useState<string>();

  useEffect(() => {
    if (!isConnected) setWallet(undefined);
    else if (walletAddress) setWallet(walletAddress);
  }, [isConnected, walletAddress]);

  const { data: member, isLoading: memberLoading } = trpc.user.kGetMember.useQuery(
    { wallet: wallet! },
    { enabled: !!wallet }
  );

  const logout = () => disconnect();
  const certificates = member?.Certificate ?? [];

  return (
    <V2Layout activeTab="profile">
      <div className="px-5 pb-2 pt-6">
        <h1 className="text-center text-2xl font-bold text-foreground">PROFILE</h1>
      </div>

      {/* ── State B: not connected ───────────────────────────── */}
      {!isConnected ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <Avatar
            size="xl"
            image={<RemoteImage src="/images/thuiLogo.png" alt="Jaothui" sizes="112px" className="object-contain p-2" />}
          />
          <h2 className="mt-6 text-xl font-bold text-foreground">ยินดีต้อนรับสู่ Jaothui</h2>
          <p className="mt-2 max-w-xs text-sm text-muted">
            เชื่อมต่อ Bitkub NEXT เพื่อดูโปรไฟล์และกระบือของคุณ
          </p>
          <div className="mt-8 w-full max-w-xs">
            <ConnectButton />
          </div>
        </div>
      ) : memberLoading ? (
        /* ── loading skeleton (CSR) ─────────────────────────── */
        <div className="space-y-6 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-pill bg-surface-raised" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded bg-surface-raised" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-raised" />
              <div className="h-6 w-24 animate-pulse rounded-pill bg-surface-raised" />
            </div>
          </div>
          <div className="h-28 animate-pulse rounded-card bg-surface-raised" />
          <div className="h-64 animate-pulse rounded-card bg-surface-raised" />
        </div>
      ) : (
        /* ── State A (member) / State C (NFT holder, member==null) ── */
        <div className="space-y-6 px-5 pb-4">
          <section className="flex items-center gap-4">
            <Avatar
              size="lg"
              image={
                member?.avatar ? (
                  <RemoteImage src={member.avatar} alt={member.name ?? "profile"} sizes="96px" className="object-cover" />
                ) : (
                  <RemoteImage src="/images/thuiLogo.png" alt="Jaothui" sizes="96px" className="object-contain p-2" />
                )
              }
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold text-foreground">
                {member?.name || "NFT Holder"}
              </h2>
              <p className="truncate text-sm text-muted">{member?.email || email || shortWallet(walletAddress)}</p>
              <div className="mt-2">
                {member ? (
                  <Badge variant="champion">{member.farmName ? "เจ้าของฟาร์ม" : "สมาชิก"}</Badge>
                ) : (
                  <Badge variant="for-sale">NFT Holder</Badge>
                )}
              </div>
            </div>
          </section>

          <WalletCard
            connected
            provider="Bitkub NEXT"
            address={<CopyAddress address={walletAddress} />}
          />

          {member && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">
                  ควายของฉัน{" "}
                  <span className="text-sm font-normal text-muted">({certificates.length})</span>
                </h3>
                {certificates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => router.push("/v2/buffalo")}
                    className="flex items-center text-sm text-accent hover:underline"
                  >
                    ดูทั้งหมด
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {certificates.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 tabletS:grid-cols-3">
                  {certificates.map((cert) => (
                    <BuffaloCard
                      key={cert.microchip}
                      name={cert.name}
                      chip={cert.microchip}
                      birthdate={formatThaiBirthdate(cert.birthdate)}
                      ageMonths={calculateBuffaloAge(cert.birthdate)}
                      image={<RemoteImage src={cert.image} alt={cert.name} className="object-cover" />}
                      onClick={() => router.push(`/cert/${cert.microchip}`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-card border border-dashed border-border-soft px-4 py-10 text-center text-sm text-muted">
                  ยังไม่มีกระบือในบัญชีนี้
                </p>
              )}
            </section>
          )}

          <SettingsList onLogout={logout} />
        </div>
      )}
    </V2Layout>
  );
}
