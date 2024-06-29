import React, { useEffect, useState } from "react";
import Layout from "../../components/Layouts";
import NoConnectProfileCard from "../../components/Profile/NoConnectProfileCard";
import PedigreeListInProfile from "../../components/Profile/PedigreeList";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { trpc } from "../../utils/trpc";
import Loading from "../../components/Shared/Indicators/Loading";
import ProfileCard from "../../components/Profile/ProfileCard";
import ProfileMenuList from "../../components/Profile/ProfileMenuList";

const ProfilePage = () => {
  const [wallet, setWallet] = useState<string>();
  const { walletAddress, isConnected } = useBitkubNext();
  const { data: member, isLoading: memberLoading } =
    trpc.user.kGetMember.useQuery({ wallet: wallet! });

  useEffect(() => {
    if (!isConnected) {
      setWallet(undefined);
    }

    if (isConnected && walletAddress != undefined) {
      setWallet(walletAddress);
    }
  }, [isConnected, walletAddress, wallet]);

  return (
    <Layout>
      <div className="p-2 bg-secondary text-thuiwhite min-h-screen">
        {member == undefined ? (
          <div className="grid grid-cols-1 w-full overflow-hidden">
            <NoConnectProfileCard />
            <PedigreeListInProfile />
          </div>
        ) : (
          <div>
            {memberLoading ? (
              <div className="w-full flex justify-center items-center">
                <Loading size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 w-full overflow-hidden">
                <ProfileCard member={member} />
                <PedigreeListInProfile />
                <div className="px-4">
                  <ProfileMenuList />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
