import Link from "next/link";
import Image from "next/image";
import { FaArrowCircleLeft } from "react-icons/fa";
import { RiMedalFill } from "react-icons/ri";
import { IMetadata } from "../interfaces/iMetadata";
import { useBitkubNext } from "../hooks/bitkubNextContext";
import CountryFlag from "./CountryFlag";
import { RewardData } from "../interfaces/iReward";
import { ApprovedBy } from "../interfaces/iApprovedBy";
import { HiOutlineDocumentText } from "react-icons/hi";

export interface ProfileBoxProps {
  certNft: IMetadata;
  rewards: RewardData[];
  approvedBy: ApprovedBy[];
}

const ProfileBox = ({ certNft, rewards, approvedBy = [] }: ProfileBoxProps) => {
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
    <div className="m-10" id="container">
      <div
        className="relative bg-thuigray text-thuiwhite grid grid-cols-1 rounded-md pr-10 pl-10 pt-5 pb-5 gap-5
        border-[1px] border-thuiyellow
        shadow-[0px_13px_27px_-5px_rgba(0,0,0,0.60)]
          tabletM:pt-10
          tabletM:pb-10
          tabletM:w-[600px]
          desktop:pt-10
          desktop:pb-10
          desktop:w-[800px]"
        id="inner"
      >
        <div
          id="card-hole"
          className="absolute top-3 right-3 w-[25px] h-[25px] bg-thuiyellow rounded-[200px]
        shadow-[inset_-2px_2px_2px_1px_rgba(0,0,0,0.30)]
        "
        ></div>
        <div
          className="text-center text-xl
            tabletM:text-2xl
          desktop:text-3xl"
          id="title"
        >
          #{certNft.microchip}
        </div>
        <div className="flex justify-center">
          <Image
            className="w-[250px] max-w-[350px] rounded-md border-[2px] border-thuiyellow border-opacity-[50%]
              tabletS:w-[400px]
              "
            src={certNft.image!}
            width={400}
            height={400}
            alt={"image"}
          />
        </div>
        <div
          className="flex text-sm justify-center 
            tabletM:text-2xl 
            desktop:text-3xl"
          id="content-wrapper"
        >
          <ul>
            <li className="grid grid-cols-2 gap-2">
              <div id="topic">Name:</div>
              <div id="content">{certNft.name}</div>
              <div id="topic">ID:</div>
              <div id="content">{certNft.microchip}</div>
              <div id="topic">CertNo:</div>
              <div id="content">{certNft.certNo}</div>
              <div id="topic">Birthday:</div>
              <div id="content">{certNft.birthday}</div>
              <div id="topic">Sex:</div>
              <div id="content">{certNft.sex}</div>
              <div id="topic">MotherId:</div>
              <div id="content">
                {certNft.motherId == "0" ? "N/A" : certNft.motherId}
              </div>
              <div id="topic">FatherId:</div>
              <div id="content">
                {certNft.fatherId == "0" ? "N/A" : certNft.fatherId}
              </div>
              <div id="topic">Origin:</div>
              {/* <div id="content">{certNft.origin}</div> */}
              <div id="content" className="flex gap-2 items-center">
                <CountryFlag country={certNft.origin} size="48x36" />
                <Link
                  className="text-thuiyellow hover:text-thuiwhite"
                  target="_blank"
                  href={certNft.dna}
                >
                  <HiOutlineDocumentText size={20} />
                </Link>
              </div>
              <div id="topic">Height:</div>
              <div id="content">{certNft.height} cm.</div>
              <div id="topic">Color:</div>
              <div id="content">{certNft.color}</div>
              {/* <div id="topic">Detail:</div>
              <div id="content">{certNft.detail}</div> */}
              <div id="topic">Reward:</div>
              <div id="content" className="flex">
                {/* N/A */}
                {rewards.length <= 0
                  ? "N/A"
                  : rewards.map((r, index) => (
                      <Link
                        className="text-thuiyellow hover:text-thuiwhite"
                        key={index}
                        href={r.ipfs}
                        target="_blank"
                      >
                        <RiMedalFill size={30} />
                      </Link>
                    ))}
              </div>
              <div>Approved By:</div>
              {approvedBy == undefined || approvedBy.length <= 0 ? null : (
                <div
                  id="approvedBy-wrapper"
                  className="p-2 border-[1px] border-thuiwhite rounded-xl col-span-2 mt-1 mb-1"
                >
                  {approvedBy.map((a, index) => (
                    <Image
                      key={index}
                      src={a.uri}
                      width={60}
                      height={60}
                      alt="approvedBy"
                    />
                  ))}
                </div>
              )}

              <div id="topic">Created:</div>
              <div id="content" className="flex">
                {certNft.createdAt}
              </div>
              {/* <div id="topic">Updated:</div>
              <div id="content" className="flex">
                {certNft.updatedAt}
              </div> */}
            </li>
          </ul>
        </div>
        <div className="flex justify-end">
          <Link
            href={isConnected ? "/cert/profile/mycert" : "/cert"}
            // href={"/cert"}
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
              hover:bg-thuiyellow"
          >
            <FaArrowCircleLeft />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileBox;
