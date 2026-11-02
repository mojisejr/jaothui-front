import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";
import RewardBox from "../../../components/Reward/RewardBox";
import { V2Layout, Spinner } from "../../../components/v2";

const RewardPage = () => {
  const router = useRouter();
  const { id, name } = router.query;

  const { data: reward, isLoading } = trpc.metadata.getRewardById.useQuery(
    id as string
  );

  return (
    <V2Layout activeTab="buffalo">
      {isLoading ? (
        <div className="flex min-h-[60vh] justify-center pt-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <RewardBox buffaloName={name as string} reward={reward!} />
      )}
    </V2Layout>
  );
};

export default RewardPage;
