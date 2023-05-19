import { useRouter } from "next/router";
import Header from "../../components/Header";

import CertFooter from "../../components/sections/cert/CertFooter";
import { useMenu } from "../../hooks/menuContext";
import MenuModal from "../../components/MenuModal";
import ProfileBox from "../../components/ProfileBox";
import { useGetMetadataByMicrochip } from "../../blockchain/Metadata/read";

const CertDetail = () => {
  const { isOpen } = useMenu();
  const router = useRouter();
  const { tokenId } = router.query;
  const { metadata } = useGetMetadataByMicrochip(tokenId! as string);

  return (
    <div
      className="bg-thuiyellow flex flex-col justify-center items-center
      tebletM:text-xl
    desktop:text-2xl"
    >
      <Header />
      {metadata == undefined || metadata == null || metadata.length <= 0 ? (
        <div className="h-screen flex mt-[100px] text-[30px]">
          <div>Loading..</div>
        </div>
      ) : (
        <ProfileBox certNft={metadata![0]} />
      )}
      <CertFooter />
      {isOpen ? <MenuModal /> : null}
    </div>
  );
};

export default CertDetail;
