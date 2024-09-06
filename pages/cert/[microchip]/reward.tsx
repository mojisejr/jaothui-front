import { useRouter } from "next/router";
import Layout from "../../../components/Layouts";
import Loading from "../../../components/Shared/Indicators/Loading";
import { trpc } from "../../../utils/trpc";
import RewardBox from "../../../components/Reward/RewardBox";

const RewardPage = () => {
  const router = useRouter();
  const { id, name } = router.query;

  const { data: reward, isLoading } = trpc.metadata.getRewardById.useQuery(
    id as string
  );

  return (
    <Layout>
      {isLoading ? (
        <div className="min-h-screen flex justify-center">
          <Loading size="lg" />
        </div>
      ) : (
        <RewardBox buffaloName={name as string} reward={reward!} />
      )}
    </Layout>
  );
};

export default RewardPage;
