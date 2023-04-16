import { useRouter } from "next/router";
import Header from "../../../components/Header";
import Image from "next/image";

import thui from "../../../public/images/N.jpg";
import CertFooter from "../../../components/sections/cert/CertFooter";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { useMenu } from "../../../hooks/menuContext";
import MenuModal from "../../../components/MenuModal";

const CertDetail = () => {
  const { isConnected } = useAccount();
  const { isOpen } = useMenu();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
    }
  }, [isConnected, router]);

  const { tokenId } = router.query;

  return (
    <div className="bg-thuiyellow flex flex-col justify-center items-center">
      <Header />
      <ProfileBox tokenId={tokenId} />
      <CertFooter />
      {isOpen ? <MenuModal /> : null}
    </div>
  );
};

interface ProfileBoxProps {
  tokenId: string | string[] | undefined;
}

const ProfileBox = ({ tokenId }: ProfileBoxProps) => {
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
          #{tokenId}
        </div>
        <div className="flex justify-center">
          <Image className="max-w-[350px]" src={thui} alt={"image"} />
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
              <div id="content">บ่าวจอนจัด</div>
              <div id="topic">Id:</div>
              <div id="content">{tokenId}</div>
              <div id="topic">Birthday:</div>
              <div id="content">xx / xx / xx</div>
              <div id="topic">Mother:</div>
              <div id="content">สาวกระโปรงเหี่ยน</div>
              <div id="topic">MotherId:</div>
              <div id="content">764040226302399</div>
              <div id="topic">Father:</div>
              <div id="content">บ่าวจอนไหน</div>
              <div id="topic">FatherId:</div>
              <div id="content">764040226302319</div>
              <div id="topic">Origin:</div>
              <div id="content">ไทย</div>
              <div id="topic">Height:</div>
              <div id="content">175 ซม</div>
              <div id="topic">Color:</div>
              <div id="content">เผือก</div>
              <div id="topic">Detail:</div>
              <div id="content">N/A</div>
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
