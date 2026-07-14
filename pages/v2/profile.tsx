import { useCallback, useEffect, useRef, useState } from "react";
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

type LineAccount = {
  accountId: string;
  provider: "line";
  lineUserId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  linkedWallet: {
    walletAddress: string;
    provider: "bitkub-next";
    email: string | null;
  } | null;
};

type LinkStatus = "idle" | "linking" | "linked" | "error";

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
  // Set the post-login return path BEFORE the SDK fires the OAuth redirect. onClickCapture
  // runs in the capture phase (ahead of the SDK's own click handler), and the OAuth callback
  // reads `bkc_post_login` to land back here instead of the legacy /profile.
  const markReturn = () => {
    try {
      localStorage.setItem("bkc_post_login", "/v2/profile");
    } catch {
      /* localStorage unavailable — falls back to /profile */
    }
  };
  const oauth = (
    // @ts-ignore — SDK children/props are loosely typed
    <ReactBitkubNextOauth2 clientId={clientId} redirectURI={redirectURI} mode="redirect">
      <Button variant="gold-fill" block>
        เชื่อมต่อ Bitkub NEXT
      </Button>
    </ReactBitkubNextOauth2>
  );
  return <div onClickCapture={markReturn}>{oauth}</div>;
}

function LineLoginButton() {
  return (
    <Button
      variant="gold-fill"
      block
      onClick={() => {
        window.location.href = "/oauth/web/line/start?returnTo=/v2/profile";
      }}
    >
      เข้าสู่ระบบด้วย LINE
    </Button>
  );
}

function LinkedWalletPanel({
  linkedWalletAddress,
  transientWalletAddress,
  linkStatus,
  linkError,
  onRetry,
}: {
  linkedWalletAddress?: string | null;
  transientWalletAddress?: string | null;
  linkStatus: LinkStatus;
  linkError?: string | null;
  onRetry: () => void;
}) {
  if (linkedWalletAddress) {
    return (
      <WalletCard
        connected
        provider="Bitkub NEXT"
        address={<CopyAddress address={linkedWalletAddress} />}
      />
    );
  }

  const hasTransientWallet = Boolean(transientWalletAddress);
  const isLinking = linkStatus === "linking";
  const isError = linkStatus === "error";

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-accent">Wallet Status</p>
        {isLinking ? (
          <Badge variant="breeding" dot>
            Linking
          </Badge>
        ) : isError ? (
          <Badge variant="for-sale">Retry</Badge>
        ) : (
          <Badge variant="for-sale">Disconnected</Badge>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">
        {isError
          ? linkError ?? "ไม่สามารถผูก Bitkub NEXT กับบัญชี LINE นี้ได้"
          : hasTransientWallet
            ? "พบ Bitkub NEXT แล้ว กำลังผูก wallet นี้กับบัญชี LINE ของคุณ"
            : "ผูก Bitkub NEXT เพื่อดูข้อมูลกระบือ ใบรับรอง และสิทธิ์ที่อ้างอิงจาก wallet"}
      </p>
      {hasTransientWallet && (
        <p className="mt-2 text-sm text-muted">
          Wallet ที่ตรวจพบ: <CopyAddress address={transientWalletAddress!} />
        </p>
      )}
      <div className="mt-4">
        {isError ? (
          <Button variant="gold-outline" block onClick={onRetry}>
            ลองผูกอีกครั้ง
          </Button>
        ) : hasTransientWallet ? (
          <Button variant="gold-fill" block loading={isLinking} disabled>
            กำลังผูก Bitkub NEXT
          </Button>
        ) : (
          <ConnectButton />
        )}
      </div>
    </section>
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
  const { isConnected, walletAddress, disconnect } = useBitkubNext();
  const [lineAccount, setLineAccount] = useState<LineAccount | null>(null);
  const [lineLoading, setLineLoading] = useState(true);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("idle");
  const [linkError, setLinkError] = useState<string | null>(null);
  const linkAttemptKeyRef = useRef<string | null>(null);

  const loadLineSession = useCallback(async () => {
    setLineLoading(true);
    try {
      const response = await fetch("/api/auth/line/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        setLineAccount(null);
        return null;
      }
      const payload = await response.json();
      const account = payload.success ? payload.account : null;
      setLineAccount(account);
      return account as LineAccount | null;
    } catch {
      setLineAccount(null);
      return null;
    } finally {
      setLineLoading(false);
    }
  }, []);

  const linkBitkubWallet = useCallback(
    async (attemptKey: string) => {
      setLinkStatus("linking");
      setLinkError(null);
      try {
        const response = await fetch("/api/auth/line/link-bitkub-next", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          setLinkStatus("error");
          setLinkError(
            payload?.message ??
              (response.status === 409
                ? "Wallet นี้ถูกผูกกับบัญชีอื่นแล้ว"
                : "ไม่สามารถผูก Bitkub NEXT ได้")
          );
          return;
        }
        setLineAccount(payload.account);
        setLinkStatus("linked");
        await loadLineSession();
      } catch {
        setLinkStatus("error");
        setLinkError("ไม่สามารถเชื่อมต่อระบบผูก Bitkub NEXT ได้");
      } finally {
        linkAttemptKeyRef.current = attemptKey;
      }
    },
    [loadLineSession]
  );

  useEffect(() => {
    loadLineSession();
  }, [loadLineSession]);

  useEffect(() => {
    if (
      !lineAccount ||
      lineAccount.linkedWallet ||
      !isConnected ||
      !walletAddress ||
      linkStatus === "linking"
    ) {
      return;
    }

    const attemptKey = `${lineAccount.accountId}:${walletAddress}`;
    if (linkAttemptKeyRef.current === attemptKey) return;

    linkBitkubWallet(attemptKey);
  }, [isConnected, lineAccount, linkBitkubWallet, linkStatus, walletAddress]);

  const retryLink = useCallback(() => {
    if (!lineAccount || !walletAddress) return;
    const attemptKey = `${lineAccount.accountId}:${walletAddress}`;
    linkAttemptKeyRef.current = null;
    linkBitkubWallet(attemptKey);
  }, [lineAccount, linkBitkubWallet, walletAddress]);

  const profileWallet = lineAccount?.linkedWallet?.walletAddress;

  const { data: member, isLoading: memberLoading } = trpc.user.kGetMember.useQuery(
    { wallet: profileWallet! },
    { enabled: !!profileWallet }
  );

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* best-effort local logout */
    }
    setLineAccount(null);
    disconnect();
  };
  const certificates = member?.Certificate ?? [];
  const displayName = member?.name || lineAccount?.displayName || "LINE Member";
  const displayEmail =
    member?.email ||
    lineAccount?.email ||
    shortWallet(profileWallet) ||
    "LINE Account";
  const avatarSrc = member?.avatar || lineAccount?.avatarUrl || "/images/thuiLogo.png";

  return (
    <V2Layout activeTab="profile">
      <div className="px-5 pb-2 pt-6">
        <h1 className="text-center text-2xl font-bold text-foreground">PROFILE</h1>
      </div>

      {/* ── State B: not connected ───────────────────────────── */}
      {lineLoading ? (
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
        </div>
      ) : !lineAccount ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <Avatar
            size="xl"
            image={<RemoteImage src="/images/thuiLogo.png" alt="Jaothui" sizes="112px" className="object-contain p-2" />}
          />
          <h2 className="mt-6 text-xl font-bold text-foreground">ยินดีต้อนรับสู่ Jaothui</h2>
          <p className="mt-2 max-w-xs text-sm text-muted">
            เข้าสู่ระบบด้วย LINE เพื่อจัดการโปรไฟล์ของคุณ แล้วค่อยผูก Bitkub NEXT เมื่อพร้อม
          </p>
          <div className="mt-8 w-full max-w-xs">
            <LineLoginButton />
          </div>
        </div>
      ) : profileWallet && memberLoading ? (
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
                avatarSrc !== "/images/thuiLogo.png" ? (
                  <RemoteImage src={avatarSrc} alt={displayName} sizes="96px" className="object-cover" />
                ) : (
                  <RemoteImage src="/images/thuiLogo.png" alt="Jaothui" sizes="96px" className="object-contain p-2" />
                )
              }
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold text-foreground">
                {displayName}
              </h2>
              <p className="truncate text-sm text-muted">{displayEmail}</p>
              <div className="mt-2">
                {member ? (
                  <Badge variant="champion">{member.farmName ? "เจ้าของฟาร์ม" : "สมาชิก"}</Badge>
                ) : lineAccount ? (
                  <Badge variant="verified">LINE Account</Badge>
                ) : (
                  <Badge variant="for-sale">NFT Holder</Badge>
                )}
              </div>
            </div>
          </section>

          <LinkedWalletPanel
            linkedWalletAddress={profileWallet}
            transientWalletAddress={isConnected ? walletAddress : null}
            linkStatus={linkStatus}
            linkError={linkError}
            onRetry={retryLink}
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
