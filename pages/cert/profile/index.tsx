import Profile from "../../../components/Cert/Profile";
import ProfileMenu from "../../../components/Cert/ProfileMenu";

import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import Layout from "../../../components/Layouts";
import BitkubNextConnectButton from "../../../components/Shared/BitkubNext";

const ProfilePage = () => {
  const { isConnected } = useBitkubNext();

  return (
    <>
      <Layout>
        <div className="min-h-screen">
          <div className="grid grids-col-1 place-items-center py-10">
            {isConnected ? (
              <div className="px-4 py-6 bg-base-200 rounded-xl shadow-xl">
                <Profile />
                <ProfileMenu />
              </div>
            ) : (
              <div>
                <div className="py-2">Please Connect Wallet</div>
                <BitkubNextConnectButton />
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ProfilePage;
