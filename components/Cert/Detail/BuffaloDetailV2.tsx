import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FacebookIcon,
  FacebookShareButton,
  LineIcon,
  LineShareButton,
} from "react-share";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FiArrowLeft, FiExternalLink, FiCheck, FiCopy } from "react-icons/fi";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { BiRfid, BiRuler } from "react-icons/bi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { BsGenderAmbiguous, BsFileEarmarkBinary } from "react-icons/bs";
import { MdColorLens } from "react-icons/md";
import { GiTrophyCup } from "react-icons/gi";
import { RiMedalFill } from "react-icons/ri";
import { FaStamp, FaHeart } from "react-icons/fa";

import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { trpc } from "../../../utils/trpc";
import { parseThaiDate } from "../../../helpers/parseThaiDate";
import CountryFlag from "../../Shared/CountryFlag";
import { RewardData } from "../../../interfaces/iReward";
import {
  V2Layout,
  StatRow,
  RemoteImage,
  Badge,
  Button,
  formatBuffaloAge,
  cn,
} from "../../v2";

export interface BuffaloDetailV2Props {
  tokenId: string;
  certNft: any;
  rewards: RewardData[];
  vote: boolean;
  eventId: string;
}

const OG = (mc: string) => `https://jaothui.com/api/seo/og?microchip=${mc || ""}`;
const hasParent = (id: unknown) => !!id && id !== 0 && id !== '""' && id !== "";

/** Buffalo certificate detail — v2 (dark-gold) reskin of the legacy ProfileBoxV2. Same data,
 *  same vote/share/lineage functions, re-skinned onto V2Layout + StatRow. */
export default function BuffaloDetailV2({ tokenId, certNft, rewards, vote, eventId }: BuffaloDetailV2Props) {
  const { back } = useRouter();
  const { isConnected, walletAddress } = useBitkubNext();
  const [copied, setCopied] = useState(false);

  const { data: event, refetch: fetchEvent } = trpc.voteEvent.getVoteEventByUser.useQuery(
    { eventId, wallet: walletAddress! },
    { enabled: false }
  );
  const { mutate: doVote, isLoading, isSuccess, isError } = trpc.voteEvent.voteFor.useMutation();

  useEffect(() => {
    if (isSuccess) {
      alert("voting success!");
      fetchEvent();
    } else if (isError) {
      alert("voting failed!");
      fetchEvent();
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    if (vote && isConnected && walletAddress) fetchEvent();
  }, [event, isConnected, walletAddress]);

  const handleVote = () => {
    const microchip = certNft?.certify?.microchip;
    if (!microchip) return;
    doVote({ microchip, wallet: walletAddress, eventId });
  };

  // not-found guard
  if (!certNft || Object.keys(certNft).length === 0) {
    return (
      <V2Layout activeTab="buffalo">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-5 text-center">
          <p className="text-lg font-semibold text-foreground">ไม่พบข้อมูลกระบือ</p>
          <Link href={isConnected ? "/v2/buffalo" : "/v2"}>
            <Button variant="gold-outline">
              <FiArrowLeft className="h-4 w-4" /> กลับ
            </Button>
          </Link>
        </div>
      </V2Layout>
    );
  }

  const mc = certNft?.certify?.microchip || "";
  const thai = parseThaiDate(certNft.birthdate);
  const isCute = typeof certNft?.name === "string" && certNft.name.includes("คุณ");
  const hasDna = certNft?.certify?.dna && certNft.certify.dna !== "N/A";
  const canVote = event && event.canVote && isConnected && vote;
  const alreadyVoted = event && event.votedMicrochip === mc;

  return (
    <V2Layout activeTab="buffalo">
      <motion.div
        className="mx-auto w-full max-w-4xl px-5 pt-5"
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          onClick={() => back()}
          className="mb-4 flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
        >
          <FiArrowLeft className="h-4 w-4" /> กลับ
        </button>

        <div className="labtop:grid labtop:grid-cols-[minmax(0,360px)_1fr] labtop:items-start labtop:gap-8">
          {/* image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-border-soft bg-surface-raised shadow-gold">
            <RemoteImage src={certNft.imageUri} alt={certNft?.name || "buffalo"} sizes="(max-width:768px) 100vw, 360px" priority className="object-cover" />
            <span className="absolute bottom-3 right-3 rounded-pill border border-border-soft bg-overlay-badge px-2.5 py-1 text-[11px] font-semibold text-accent backdrop-blur-sm">
              {formatBuffaloAge(certNft.calculatedAge)}
            </span>
          </div>

          {/* name + share + info */}
          <div className="mt-5 space-y-5 labtop:mt-0">
            <div>
              <h1
                className={cn(
                  "text-2xl font-bold",
                  isCute
                    ? "bg-gradient-to-br from-[#FFE15D] via-[#e59a28] to-[#FFE15D] bg-clip-text text-transparent"
                    : "text-foreground"
                )}
              >
                {certNft?.name || "ไม่มีชื่อ"}
              </h1>
            </div>

            {/* vote + share */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {canVote ? (
                  <Button variant="gold-fill" size="sm" onClick={handleVote} loading={isLoading}>
                    <FaHeart className="h-4 w-4" /> โหวต · Summit 2025
                  </Button>
                ) : alreadyVoted ? (
                  <span className="flex items-center gap-2 text-sm font-semibold text-accent">
                    <FaHeart className="h-4 w-4" /> คุณโหวตแล้ว
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">แชร์</span>
                <FacebookShareButton url={`${OG(mc)}&social=true`}>
                  <FacebookIcon size={30} round />
                </FacebookShareButton>
                <LineShareButton url={OG(mc)}>
                  <LineIcon size={30} round />
                </LineShareButton>
                <CopyToClipboard text={OG(mc)} onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }}>
                  <button
                    type="button"
                    aria-label="คัดลอกลิงก์"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-pill border border-border-soft text-muted transition-colors hover:text-accent"
                  >
                    {copied ? <FiCheck className="h-4 w-4 text-success" /> : <FiCopy className="h-4 w-4" />}
                  </button>
                </CopyToClipboard>
              </div>
            </div>

            {/* info card */}
            <div className="overflow-hidden rounded-card border border-border-soft bg-surface [&>*+*]:border-t [&>*+*]:border-border-soft">
              <StatRow icon={<IoCalendarNumberOutline className="h-5 w-5" />} label="อายุ" value={formatBuffaloAge(certNft.calculatedAge)} />
              <StatRow icon={<BiRfid className="h-5 w-5" />} label="Signature ID" value={mc || "N/A"} />
              <StatRow icon={<HiOutlineDocumentText className="h-5 w-5" />} label="วันเกิด" value={`${thai.date} ${thai.thaiMonth2} ${thai.thaiYear}`} />
              <StatRow icon={<BsGenderAmbiguous className="h-5 w-5" />} label="เพศ" value={certNft.sex || "N/A"} />
              <StatRow
                icon={<BiRfid className="h-5 w-5" />}
                label="แม่พันธุ์"
                value={hasParent(certNft?.relation?.motherTokenId) ? certNft.relation.motherTokenId : "N/A"}
                href={hasParent(certNft?.relation?.motherTokenId) ? `/cert/${certNft.relation.motherTokenId}` : undefined}
              />
              <StatRow
                icon={<BiRfid className="h-5 w-5" />}
                label="พ่อพันธุ์"
                value={hasParent(certNft?.relation?.fatherTokenId) ? certNft.relation.fatherTokenId : "N/A"}
                href={hasParent(certNft?.relation?.fatherTokenId) ? `/cert/${certNft.relation.fatherTokenId}` : undefined}
              />
              <StatRow
                icon={<BsFileEarmarkBinary className="h-5 w-5" />}
                label="แหล่งกำเนิด"
                href={hasDna ? certNft.certify.dna : undefined}
                external={!!hasDna}
                value={
                  <span className="flex items-center gap-2">
                    <CountryFlag country={certNft?.origin || "thai"} size={"48x36"} />
                    {hasDna && <Badge variant="verified" dot>Verified</Badge>}
                  </span>
                }
              />
              <StatRow icon={<BiRuler className="h-5 w-5" />} label="ส่วนสูง" value={certNft.height ? `${certNft.height} ซม.` : "N/A"} />
              <StatRow icon={<MdColorLens className="h-5 w-5" />} label="สี" value={certNft.color || "N/A"} />
              <StatRow
                icon={<GiTrophyCup className="h-5 w-5" />}
                label="รางวัล"
                value={
                  rewards.length <= 0 ? (
                    "N/A"
                  ) : (
                    <span className="flex flex-wrap items-center justify-end gap-1">
                      {rewards.map((r, i) => (
                        <Link key={i} href={`/cert/${r.microchip}/reward?id=${r.id}&name=${certNft.name}`} aria-label="ดูรางวัล" className="text-accent hover:text-accent-hover">
                          <RiMedalFill className="h-6 w-6" />
                        </Link>
                      ))}
                    </span>
                  )
                }
              />
              <StatRow
                icon={<FaStamp className="h-5 w-5" />}
                label="ใบรับรอง"
                value={certNft?.certificate?.microchip ? "ดูใบรับรอง" : "N/A"}
                href={certNft?.certificate?.microchip ? `/cert/${mc}/certificate?microchip=${mc}&tokenId=${tokenId}` : undefined}
              />
            </div>

            <Link
              href="https://www.bkcscan.com/address/0x41f291b116459aE967bCd616F64e762f8468Ea0E/transactions#address-tabs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-card border border-border-soft px-4 py-3 text-sm text-muted transition-colors hover:text-accent"
            >
              ดูบน BKCScan <FiExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </V2Layout>
  );
}
