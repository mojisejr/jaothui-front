import { useRouter } from "next/router";
import Header from "../../../components/Header";
import Image from "next/image";

import thui from "../../../public/images/N.jpg";
import CertFooter from "../../../components/sections/cert/CertFooter";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useMenu } from "../../../hooks/menuContext";
import MenuModal from "../../../components/MenuModal";
import { useCertContext } from "../../../hooks/cert/certContext";
import { CertNFTRawData } from "../../../blockchain/cert/interface";
import { getMetadata } from "../../../helpers/getMetadata";

const CertDetail = () => {
  const [nft, setNft] = useState<CertNFTRawData[] | []>([]);
  const { isConnected } = useAccount();
  const { isOpen } = useMenu();
  const router = useRouter();
  const { tokenId } = router.query;
  const { getNFTMicrochip } = useCertContext();

  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
    }
    const nft = getNFTMicrochip(tokenId as string);
    getMetadata([nft as CertNFTRawData], setNft);
  }, [isConnected, router]);

  return (
    <div className="bg-thuiyellow flex flex-col justify-center items-center">
      <Header />
      {nft.length <= 0 ? <div>Loading..</div> : <ProfileBox certNft={nft[0]} />}
      <CertFooter />
      {isOpen ? <MenuModal /> : null}
    </div>
  );
};

interface ProfileBoxProps {
  certNft: CertNFTRawData;
}

const ProfileBox = ({ certNft }: ProfileBoxProps) => {
  return (
    <div className="m-10" id="container">
      <div
        className="bg-thuigray text-thuiwhite grid grid-cols-1 rounded-md pr-10 pl-10 pt-5 pb-5 gap-5
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
          #{certNft.microchip}
        </div>
        <div className="flex justify-center">
          <Image
            className="max-w-[350px]"
            src={certNft.metadata.image}
            width={250}
            height={250}
            alt={"image"}
          />
        </div>
        <div
          className="flex justify-center 
          tabletM:text-2xl 
          desktop:text-3xl"
          id="content-wrapper"
        >
          <ul>
            <li className="grid grid-cols-2">
              <div id="topic">name:</div>
              <div id="content">{certNft.name}</div>
              <div id="topic">Id:</div>
              <div id="content">{certNft.microchip}</div>
              <div id="topic">certNo:</div>
              <div id="content">{certNft.metadata.attributes[2].value}</div>
              <div id="topic">Birthday:</div>
              <div id="content">{"N/A"}</div>
              <div id="topic">Mother:</div>
              <div id="content">
                {certNft.motherTokenId == "0" ? "ไม่พบ" : certNft.motherTokenId}
              </div>
              <div id="topic">MotherId:</div>
              <div id="content">
                {certNft.motherTokenId == "0" ? "ไม่พบ" : certNft.motherTokenId}
              </div>
              <div id="topic">Father:</div>
              <div id="content">
                {certNft.fatherTokenId == "0" ? "ไม่พบ" : certNft.fatherTokenId}
              </div>
              <div id="topic">FatherId:</div>
              <div id="content">
                {certNft.fatherTokenId == "0" ? "ไม่พบ" : certNft.fatherTokenId}
              </div>
              <div id="topic">Origin:</div>
              <div id="content">{certNft.metadata.attributes[1].value}</div>
              <div id="topic">Height:</div>
              <div id="content">{certNft.height} ซม.</div>
              <div id="topic">Color:</div>
              <div id="content">{certNft.metadata.attributes[3].value}</div>
              <div id="topic">Detail:</div>
              <div id="content">ไม่พบ</div>
              <div id="topic">Reward:</div>
              <div id="content" className="flex">
                N/A
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CertDetail;
