import Link from "next/link";
import Image from "next/image";
import {
  FaArrowCircleLeft,
  FaStamp,
  FaLink,
  FaHeart,
  FaHardHat,
} from "react-icons/fa";
import { RiMedalFill } from "react-icons/ri";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import CountryFlag from "../../Shared/CountryFlag";
import { RewardData } from "../../../interfaces/iReward";

import { HiExternalLink, HiOutlineDocumentText } from "react-icons/hi";
import { BiRfid, BiRuler } from "react-icons/bi";
import { TbNfc } from "react-icons/tb";
import { BsGenderAmbiguous, BsFileEarmarkBinary } from "react-icons/bs";
import { GiTrophyCup } from "react-icons/gi";
import { MdColorLens } from "react-icons/md";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { parseThaiDate } from "../../../helpers/parseThaiDate";
import { useRouter } from "next/router";
import {
  FacebookIcon,
  FacebookShareButton,
  LineIcon,
  LineShareButton,
} from "react-share";

import { CopyToClipboard } from "react-copy-to-clipboard";
import { useEffect, useState } from "react";

import { trpc } from "../../../utils/trpc";

export interface ProfileBoxProps {
  tokenId: string;
  certNft: any;
  rewards: RewardData[];
  vote: boolean;
  eventId: string;
}

const ProfileBoxV2 = ({
  tokenId,
  certNft,
  rewards,
  vote,
  eventId,
}: ProfileBoxProps) => {
  const [copied, setCopied] = useState<{ copied: boolean }>({ copied: false });
  const { isConnected, walletAddress } = useBitkubNext();
  const thaiDate = parseThaiDate(certNft.birthdate);
  const { back } = useRouter();

  const { data: event, refetch: fetchEvent } =
    trpc.voteEvent.getVoteEventByUser.useQuery(
      { eventId, wallet: walletAddress! },
      { enabled: false }
    );

  const {
    mutate: doVote,
    isLoading,
    isSuccess,
    isError,
  } = trpc.voteEvent.voteFor.useMutation();

  useEffect(() => {
    if (isSuccess) {
      alert("voting success!");
      fetchEvent();
      return;
    }
    if (isError) {
      alert("voting failed!");
      fetchEvent();
      return;
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    if (vote && isConnected && walletAddress) {
      fetchEvent();
    }
  }, [event, isConnected, walletAddress]);

  const handleVote = () => {
    const microchip = certNft?.certify?.microchip;
    const wallet = walletAddress;
    const event = eventId;

    if (!microchip) {
      console.error("Microchip not found in certificate data");
      return;
    }

    doVote({ microchip, wallet, eventId: event });
  };

  if (Object.keys(certNft).length === 0) {
    return (
      <div
        className="h-screen flex flex-col justify-center items-center gap-[20px]
      "
      >
        <div className="text-xl">Not Found ..</div>
        <div>
          <Link
            href={isConnected ? "/cert" : "/"}
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
              hover:bg-thuiyellow"
          >
            <FaArrowCircleLeft />
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="my-10 mx-3 flex justify-center"
        id="container"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.5,
          type: "tween",
          ease: "easeInOut",
        }}
      >
        <div className="flex min-h-screen items-center max-w-[800px] justify-center rounded-xl shadow-xl">
          <div className="card my-2 w-11/12 bg-base-100 xl:my-6 xl:w-1/2">
            <figure>
              <img src={certNft.imageUri!} />
            </figure>
            <div className="flex justify-between items-center">
              <div>
                {event && event.canVote && isConnected && vote ? (
                  <button
                    onClick={handleVote}
                    disabled={isLoading || (event && !event.canVote)}
                    className="btn btn-sm bg-gradient-to-bl from-[#0a0a0a] via-[#0d3528] to-[#00d47e] text-thuiwhite"
                  >
                    <FaHeart className="text-primary" />
                    <div className="flex flex-col leading-tight items-start">
                      <span className="font-semibold">โหวต</span>
                      <span className="text-[8px]">Bitkub Summit 2025</span>
                    </div>
                  </button>
                ) : (
                  <>
                    {event &&
                    event.votedMicrochip == certNft?.certify?.microchip ? (
                      <div className="flex gap-2 items-center">
                        <FaHeart className="text-primary" size={28} />
                        <span className="text-bold">คุณโหวต</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              <div className="flex justify-end items-center pt-2 gap-2">
                <div className="font-semibold">share</div>
                <FacebookShareButton
                  url={`https://jaothui.com/api/seo/og?microchip=${certNft?.certify?.microchip || ""}&social=true`}
                >
                  <FacebookIcon size={32} />
                </FacebookShareButton>
                <LineShareButton
                  url={`https://jaothui.com/api/seo/og?microchip=${certNft?.certify?.microchip || ""}`}
                >
                  <LineIcon size={32} />
                </LineShareButton>
                {/* <TelegramShareButton
                url={`https://jaothui.com/api/seo/og?microchip=${certNft?.certify?.microchip || ""}`}
              >
                <TelegramIcon size={32} />
              </TelegramShareButton> */}
                {/* <TwitterShareButton
                url={`https://jaothui.com/api/seo/og?microchip=${certNft?.certify?.microchip || ""}`}
              >
                <TwitterIcon size={32} />
              </TwitterShareButton> */}
                <CopyToClipboard
                  text={`https://jaothui.com/api/seo/og?microchip=${certNft?.certify?.microchip || ""}`}
                  onCopy={() => setCopied({ copied: true })}
                >
                  <button
                    disabled={copied.copied}
                    className="btn btn-sm btn-square rounded-none"
                  >
                    <FaLink size={16} />
                  </button>
                </CopyToClipboard>
              </div>
            </div>
            <div className="card-body">
              <div className="card-title">Information</div>
              <div className="stats stats-vertical shadow">
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <TbNfc size={30} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {certNft?.name && certNft.name.includes("คุณ") ? (
                        <div className="text-2xl font-bold bg-gradient-to-br from-[#FFE15D] via-[#e59a28] to-[#FFE15D] text-transparent bg-clip-text">
                          {certNft.name}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-secondary">
                          {certNft?.name || "ไม่มีชื่อ"}
                        </div>
                      )}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s name</div>
                  </div>
                </div>

                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <IoCalendarNumberOutline size={30} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      <div className="text-2xl font-bold text-secondary">
                        {certNft.calculatedAge ?? "N/A"} เดือน
                      </div>
                    </div>
                    <div className="stat-desc">Buffalo Age {"(Month)"}</div>
                  </div>
                </div>

                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BiRfid size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft?.certify?.microchip || "N/A"}
                    </div>
                    <div className="stat-desc">Signature ID</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4 ">
                  <div className="stat-figure text-secondary">
                    <HiOutlineDocumentText size={30} />
                  </div>
                  <div>
                    <div className="xl:hidden stat-title font-bold text-secondary xl:text-[2rem]">
                      {`${thaiDate.date} ${thaiDate.thaiMonth} ${thaiDate.thaiYear2}`}
                    </div>
                    <div className="stat-desc">Birthday Date</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BsGenderAmbiguous size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft.sex}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Gender</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BiRfid size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft?.relation?.motherTokenId &&
                      certNft.relation.motherTokenId != 0 &&
                      certNft.relation.motherTokenId != '""' &&
                      certNft.relation.motherTokenId != "" ? (
                        <Link
                          className="font-bold text-secondary xl:text-[2rem] hover:text-thuiyellow"
                          href={`/cert/${certNft.relation.motherTokenId}`}
                          target="_blank"
                        >
                          {certNft.relation.motherTokenId}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Mother ID</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BiRfid size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft?.relation?.fatherTokenId &&
                      certNft.relation.fatherTokenId != 0 &&
                      certNft.relation.fatherTokenId != '""' &&
                      certNft.relation.fatherTokenId != "" ? (
                        <Link
                          className="font-bold text-secondary xl:text-[2rem] hover:text-thuiyellow"
                          href={`/cert/${certNft.relation.fatherTokenId}`}
                          target="_blank"
                        >
                          {certNft.relation.fatherTokenId}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Father ID</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    {certNft?.certify?.dna && certNft.certify.dna != "N/A" ? (
                      <Link href={certNft.certify.dna} target="_blank">
                        <BsFileEarmarkBinary
                          className="text-primary hover:text-accent"
                          size={30}
                        />
                      </Link>
                    ) : (
                      <BsFileEarmarkBinary size={30} />
                    )}
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft?.origin ? (
                        <div className="flex gap-2 items-center">
                          <CountryFlag
                            country={certNft.origin}
                            size={"48x36"}
                          />
                          {certNft?.certify?.dna && certNft.certify.dna != "N/A" ? (
                            <span className="text-xs text-accent font-semibold">
                              Verified
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <CountryFlag country={"thai"} size={"48x36"} />
                      )}
                    </div>
                    <div className="stat-desc">
                      Buffalo{"'"}s Origin Country{" "}
                    </div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BiRuler size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft.height ? `${certNft.height} cm` : "N/A"}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Height</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <MdColorLens size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft.color ? certNft.color : "N/A"}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Color</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <GiTrophyCup size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem] flex flex-wrap gap-[0.2]">
                      {rewards.length <= 0
                        ? "N/A"
                        : rewards.map((r, index) => (
                            <Link
                              className="text-gray-600 hover:text-primary"
                              key={index}
                              href={`/cert/${r.microchip}/reward?id=${r.id}&name=${certNft.name}`}
                              // target="_blank"
                            >
                              <RiMedalFill size={30} />
                            </Link>
                          ))}
                    </div>
                    <div className="stat-desc">Competition Rewards</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <FaStamp size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem] flex gap-2 items-center">
                      {/* {approvedBy.length <= 0
                        ? "N/A"
                        : approvedBy.map((a, index) => (
                            // <Link
                            //   href={`/cert/${certNft.certify.microchip}/certificate`}
                            // >
                            //   <Image
                            //     src={a.uri}
                            //     width={40}
                            //     height={40}
                            //     alt="approvedBy"
                            //   />
                            // </Link>
                            <>
                              {a.doc == "" || a.doc == undefined ? (
                                <button
                                  onClick={() => toast.error("Not Found")}
                                >
                                  <Image
                                    src={a.uri}
                                    width={40}
                                    height={40}
                                    alt="approvedBy"
                                  />
                                </button>
                              ) : (
                                <Link
                                  href={
                                    a.doc == "" || a.doc == undefined
                                      ? "/notfound"
                                      : a.doc
                                  }
                                  target="blank"
                                  key={index}
                                >
                                  <Image
                                    src={a.uri}
                                    width={40}
                                    height={40}
                                    alt="approvedBy"
                                  />
                                </Link>
                              )}
                            </>
                          ))} */}
                      {!certNft?.certificate?.microchip ? (
                        "N/A"
                      ) : (
                        <Link
                          href={`/cert/${certNft?.certify?.microchip || ""}/certificate?microchip=${certNft?.certify?.microchip || ""}&tokenId=${tokenId}`}
                        >
                          <Image
                            src={"/images/logo.png"}
                            width={40}
                            height={40}
                            alt="approvedBy"
                          />
                        </Link>
                      )}
                    </div>
                    <div className="stat-desc">Approved By</div>
                  </div>
                </div>
              </div>
              <Link
                href="https://www.bkcscan.com/address/0x41f291b116459aE967bCd616F64e762f8468Ea0E/transactions#address-tabs"
                target="_blank"
                className="btn btn-ghost text-gray-400"
              >
                View On BKCScan <HiExternalLink size={20} />
              </Link>
              <button
                onClick={() => back()}
                className="btn btn-ghost text-gray-400"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ProfileBoxV2;
