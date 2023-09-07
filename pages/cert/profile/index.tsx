import Profile from "../../../components/sections/cert/Profile";
import ProfileMenu from "../../../components/sections/cert/ProfileMenu";
import Header from "../../../components/Header";
import PleaseConnectWallet from "../../../components/sections/cert/PleaseConnect";
import MenuModal from "../../../components/MenuModal";
import CertFooter from "../../../components/sections/cert/CertFooter";
import { useMenu } from "../../../contexts/menuContext";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/v2/Layouts";
import BitkubNextConnectButton from "../../../components/BitkubNext";

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
