import Profile from "../../../components/sections/cert/Profile";
import Header from "../../../components/Header";
import { useAccount } from "wagmi";
import PleaseConnectWallet from "../../../components/sections/cert/PleaseConnect";
import Link from "next/link";

const ProfilePage = () => {
  const { isConnected, address } = useAccount();
  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow h-screen p-3 flex  justify-center items-start
    tabletS:p-[30px]
    tabletS:h-screen
    tabletM:h-full
    tabletM:p-[60px]
    
   `}
      >
        {isConnected ? (
          <div
            id="profile-container"
            className="bg-thuigray p-[2rem] rounded-md max-w-[1200px] space-y-5
      tabletS:p-3"
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

const ProfileMenu = () => {
  return (
    <div className="flex flex-col justify-center items-center text-thuiwhite">
      <div className="text-xl">Menu</div>
      <ul className="flex flex-col justify-center items-center text-2xl mt-4 gap-3">
        <li className="p-3">
          <Link href="#">MY PEDIGREES</Link>
        </li>
        <li>
          <Link href="#">JAOTHUI NFT PRIVILEGE</Link>
        </li>
        <li>
          <Link href="#">MY FARM</Link>
        </li>
      </ul>
    </div>
  );
};

export default ProfilePage;
