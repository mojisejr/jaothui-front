import Profile from "../../../components/sections/cert/Profile";
import ProfileMenu from "../../../components/sections/cert/ProfileMenu";
import Header from "../../../components/Header";
import { useAccount } from "wagmi";
import PleaseConnectWallet from "../../../components/sections/cert/PleaseConnect";

const ProfilePage = () => {
  const { isConnected, address } = useAccount();

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
    </>
  );
};

export default ProfilePage;
