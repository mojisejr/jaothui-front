import { useRouter } from "next/router";
import { useGetApprovalDataByMicrochip } from "../../../blockchain/Metadata/read";
import Layout from "../../../components/Layouts";
import ProfileBoxV2 from "../../../components/Cert/Detail/ProfileBoxV2";
import Loading from "../../../components/Shared/Indicators/Loading";
import { trpc } from "../../../utils/trpc";

const CertDetail = () => {
  const router = useRouter();
  const { microchip } = router.query;
  const { data: metadata } = trpc.metadata.getByMicrochip.useQuery({
    microchip: microchip! as string,
  }) as any;

  const { data: rewards } = trpc.metadata.getRewardByMicrochip.useQuery(
    microchip as string
  );
  const { approvedBy } = useGetApprovalDataByMicrochip(microchip as string);

  return (
    <Layout>
      {metadata == undefined || metadata == null || metadata.length <= 0 ? (
        <div className="min-h-screen flex justify-center">
          <Loading size="lg" />
        </div>
      ) : (
        <ProfileBoxV2
          tokenId={metadata.tokenId}
          certNft={metadata!}
          rewards={rewards!}
          approvedBy={approvedBy}
        />
      )}
    </Layout>
  );
};

export default CertDetail;
