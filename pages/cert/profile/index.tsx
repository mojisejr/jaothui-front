import Profile from "../../../components/sections/cert/Profile";
import ProfileMenu from "../../../components/sections/cert/ProfileMenu";
import Header from "../../../components/Header";
import { useAccount } from "wagmi";
import PleaseConnectWallet from "../../../components/sections/cert/PleaseConnect";
import MenuModal from "../../../components/MenuModal";
import CertFooter from "../../../components/sections/cert/CertFooter";
import { useMenu } from "../../../hooks/menuContext";
import { useBitkubNext } from "../../../hooks/bitkubNextContext";

const ProfilePage = () => {
  // const { isConnected, address } = useAccount();

  const { isConnected } = useBitkubNext();
  const { isOpen } = useMenu();

  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow h-screen p-3 flex  justify-center items-start
    tabletS:p-[30px]
    tabletM:p-[60px] 
   `}
      >
        {isConnected ? (
          <div
            id="profile-container"
            className="bg-thuigray p-[2rem] rounded-md max-w-[800px] space-y-5 shadow-xl
            labtop:w-[800px]"
          >
            <Profile />
            <ProfileMenu />
          </div>
        ) : (
          <div>
            <PleaseConnectWallet />
          </div>
        )}
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default ProfilePage;
