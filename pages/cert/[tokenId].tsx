import { useRouter } from "next/router";
import {
  useGetApprovalDataByMicrochip,
  useGetMetadataByMicrochip,
} from "../../blockchain/Metadata/read";
import { useGetRewardByMicrochip } from "../../blockchain/Reward/read";
import Layout from "../../components/Layouts";
import ProfileBoxV2 from "../../components/Cert/Detail/ProfileBoxV2";
import Loading from "../../components/Shared/Indicators/Loading";

const CertDetail = () => {
  const router = useRouter();
  const { tokenId } = router.query;
  const { metadata } = useGetMetadataByMicrochip(tokenId! as string);
  const { rewards } = useGetRewardByMicrochip(tokenId! as string);
  const { approvedBy } = useGetApprovalDataByMicrochip(tokenId! as string);

  return (
    <Layout>
      {metadata == undefined || metadata == null || metadata.length <= 0 ? (
        <div className="min-h-screen flex justify-center">
          <Loading size="lg" />
        </div>
      ) : (
        <ProfileBoxV2
          certNft={metadata![0]}
          rewards={rewards}
          approvedBy={approvedBy}
        />
      )}
    </Layout>
  );
};

export default CertDetail;
