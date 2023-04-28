import { useRouter } from "next/router";
import Header from "../../../components/Header";
import Image from "next/image";

import CertFooter from "../../../components/sections/cert/CertFooter";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useMenu } from "../../../hooks/menuContext";
import MenuModal from "../../../components/MenuModal";
import { useCertContext } from "../../../hooks/cert/certContext";
import { CertNFTData } from "../../../blockchain/cert/interface";
import Link from "next/link";
import { FaArrowCircleLeft } from "react-icons/fa";

const CertDetail = () => {
  const [nft, setNft] = useState<CertNFTData | null>(null);
  const { isConnected } = useAccount();
  const { isOpen } = useMenu();
  const router = useRouter();
  const { tokenId } = router.query;
  const { getNFTMicrochip } = useCertContext();

  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
    }

    const found = getNFTMicrochip(tokenId as string);
    setNft(found! as CertNFTData);
  }, [isConnected, router]);

  return (
    <div
      className="bg-thuiyellow flex flex-col justify-center items-center
      tebletM:text-xl
    desktop:text-2xl"
    >
      <Header />
      {nft == undefined || nft == null ? (
        <div>Loading..</div>
      ) : (
        <ProfileBox certNft={nft} />
      )}
      <CertFooter />
      {isOpen ? <MenuModal /> : null}
    </div>
  );
};

interface ProfileBoxProps {
  certNft: CertNFTData;
}

const ProfileBox = ({ certNft }: ProfileBoxProps) => {
  if (Object.keys(certNft).length === 0) {
    return (
      <div className="h-screen flex flex-col justify-center items-center gap-[20px]">
        <div className="text-xl">Not Found ..</div>
        <div>
          <Link
            href="/cert"
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
        className="bg-thuigray text-thuiwhite grid grid-cols-1 rounded-md pr-10 pl-10 pt-5 pb-5 gap-5
        shadow-xl
        tabletM:pt-10
        tabletM:pb-10
        tabletM:w-[600px]
        desktop:pt-10
        desktop:pb-10
        desktop:w-[800px]"
        id="inner"
      >
        <div
          className="text-center text-xl
          tabletM:text-2xl
        desktop:text-3xl"
          id="title"
        >
          #{certNft.attributes[0].value}
        </div>
        <div className="flex justify-center">
          <Image
            className="w-[250px] max-w-[350px] rounded-md border-[2px] border-thuiyellow border-opacity-[50%]
            tabletS:w-[400px]
            "
            src={certNft.image}
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
            <li className="grid grid-cols-2">
              <div id="topic">Name:</div>
              <div id="content">{certNft.name}</div>
              <div id="topic">ID:</div>
              <div id="content">{certNft.attributes[0].value}</div>
              <div id="topic">CertNo:</div>
              <div id="content">{certNft.attributes[5].value}</div>
              <div id="topic">Birthday:</div>
              <div id="content">
                {new Date(
                  (certNft.attributes[2].value as number) * 1000
                ).toDateString()}
              </div>
              <div id="topic">MotherId:</div>
              <div id="content">
                {certNft.attributes[3].value == "0"
                  ? "ไม่พบ"
                  : certNft.attributes[3].value}
              </div>
              <div id="topic">FatherId:</div>
              <div id="content">
                {certNft.attributes[4].value == "0"
                  ? "ไม่พบ"
                  : certNft.attributes[4].value}
              </div>
              <div id="topic">Origin:</div>
              <div id="content">{certNft.attributes[6].value}</div>
              <div id="topic">Height:</div>
              <div id="content">{certNft.attributes[1].value} ซม.</div>
              <div id="topic">Color:</div>
              <div id="content">{certNft.attributes[7].value}</div>
              <div id="topic">Detail:</div>
              <div id="content">ไม่พบ</div>
              <div id="topic">Reward:</div>
              <div id="content" className="flex">
                N/A
              </div>
              <div id="topic">CreatedAt:</div>
              <div id="content" className="flex">
                {(certNft.attributes[8].value as number) <= 0
                  ? "ไม่มี"
                  : new Date(
                      (certNft.attributes[8].value as number) * 1000
                    ).toDateString()}
              </div>
              <div id="topic">UpdatedAt:</div>
              <div id="content" className="flex">
                {(certNft.attributes[9].value as number) <= 0
                  ? "ไม่มี"
                  : new Date(certNft.attributes[9].value).toDateString()}
              </div>
            </li>
          </ul>
        </div>
        <div className="flex justify-end">
          <Link
            href="/cert"
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

export default CertDetail;
