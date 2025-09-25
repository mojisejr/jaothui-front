import React, { useEffect, useState } from "react";
import Layout from "../../components/Layouts";
import NoConnectProfileCard from "../../components/Profile/NoConnectProfileCard";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { trpc } from "../../utils/trpc";
import Loading from "../../components/Shared/Indicators/Loading";
import ProfileCard from "../../components/Profile/ProfileCard";
import ProfileMenuList from "../../components/Profile/ProfileMenuList";
import NoConnectPedigreeList from "../../components/Profile/NoConnectPedigreeList";
import ConnectedPedigreeList from "../../components/Profile/ConnectedPedigreeList";
import NftHolderProfileCard from "../../components/Profile/NftHolderProfileCard";

const ProfilePage = () => {
  const [wallet, setWallet] = useState<string>();
  const { walletAddress, isConnected } = useBitkubNext();
  const { data: member, isLoading: memberLoading } =
    trpc.user.kGetMember.useQuery(
      { wallet: wallet! },
      { enabled: !!wallet }
    );

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
      <div className="p-2 bg-[#000] text-thuiwhite min-h-screen">
        {member == null && !isConnected ? (
          <div className="grid grid-cols-1 w-full overflow-hidden">
            <NoConnectProfileCard />
            <NoConnectPedigreeList />
          </div>
        ) : (
          <div>
            {memberLoading ? (
              <div className="w-full flex justify-center items-center">
                <Loading size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 w-full overflow-hidden">
                {member == null ? (
                  <NftHolderProfileCard />
                ) : (
                  <ProfileCard member={member} />
                )}
                <ConnectedPedigreeList />
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
