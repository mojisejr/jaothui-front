import Link from "next/link";
import Image from "next/image";
import { FaArrowCircleLeft, FaStamp } from "react-icons/fa";
import { RiMedalFill } from "react-icons/ri";
import { IMetadata } from "../../../interfaces/iMetadata";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import CountryFlag from "../../Shared/CountryFlag";
import { RewardData } from "../../../interfaces/iReward";
import { ApprovedBy } from "../../../interfaces/iApprovedBy";

import { HiExternalLink, HiOutlineDocumentText } from "react-icons/hi";
import { toast } from "react-toastify";
import { BiRfid, BiRuler } from "react-icons/bi";
import { TbNfc } from "react-icons/tb";
import {
  BsGenderAmbiguous,
  BsFileEarmarkBinary,
  BsCheck,
} from "react-icons/bs";
import { GiNewBorn, GiTrophyCup } from "react-icons/gi";
import { MdColorLens } from "react-icons/md";
import { StarIcon } from "@sanity/icons";
import Head from "next/head";
import dayjs from "dayjs";

export interface ProfileBoxProps {
  certNft: any;
  rewards: RewardData[];
  approvedBy: ApprovedBy[];
}

const ProfileBoxV2 = ({
  certNft,
  rewards,
  approvedBy = [],
}: ProfileBoxProps) => {
  // const { isConnected } = useAccount();
  const { isConnected } = useBitkubNext();

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
      <div className="my-10 mx-3 flex justify-center" id="container">
        <div className="flex min-h-screen items-center max-w-[800px] justify-center rounded-xl shadow-xl">
          <div className="card my-2 w-11/12 bg-base-100 xl:my-6 xl:w-1/2">
            <figure>
              <img src={certNft.imageUri!} />
            </figure>
            <div className="card-body">
              <div className="card-title">Information</div>
              <div className="stats stats-vertical shadow">
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <TbNfc size={30} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {certNft.name}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s name</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BiRfid size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {certNft.certify.microchip}
                    </div>
                    <div className="stat-desc">Signature ID</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4 ">
                  <div className="stat-figure text-secondary">
                    <HiOutlineDocumentText size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {dayjs(certNft.birthdate * 1000).format("DD/MMM/YYYY")}
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
                      {certNft.motherId ? certNft.motherId : "N/A"}
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
                      {certNft.fatherId ? certNft.fatherId : "N/A"}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Father ID</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    {certNft.dna ? (
                      <Link href={certNft.dna!} target="_blank">
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
                      {certNft.origin ? (
                        <div className="flex gap-2 items-center">
                          <CountryFlag
                            country={certNft.origin}
                            size={"48x36"}
                          />
                          {certNft.dna ? (
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
                              href={r.ipfs}
                              target="_blank"
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
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {approvedBy.length <= 0
                        ? "N/A"
                        : approvedBy.map((a, index) => (
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
                          ))}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileBoxV2;
