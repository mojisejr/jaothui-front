import { useRouter } from "next/router";
import Header from "../../components/Header";

import CertFooter from "../../components/sections/cert/CertFooter";
import { useMenu } from "../../contexts/menuContext";
import MenuModal from "../../components/MenuModal";
import ProfileBox from "../../components/ProfileBox";
import {
  useGetApprovalDataByMicrochip,
  useGetMetadataByMicrochip,
} from "../../blockchain/Metadata/read";
import { useGetRewardByMicrochip } from "../../blockchain/Reward/read";

const CertDetail = () => {
  const { isOpen } = useMenu();
  const router = useRouter();
  const { tokenId } = router.query;
  const { metadata } = useGetMetadataByMicrochip(tokenId! as string);
  const { rewards } = useGetRewardByMicrochip(tokenId! as string);
  const { approvedBy } = useGetApprovalDataByMicrochip(tokenId! as string);

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
        <ProfileBox
          certNft={metadata![0]}
          rewards={rewards}
          approvedBy={approvedBy}
        />
      )}
      <CertFooter />
      {isOpen ? <MenuModal /> : null}
    </div>
  );
};

export default CertDetail;
