import { simplifyAddress } from "../../helpers/simplifyAddress";
import { useBitkubNext } from "../../contexts/bitkubNextContext";

const Profile = () => {
  const { email, walletAddress } = useBitkubNext();

  return (
    <div
      id="profile-profile-box"
      className="text-base-200 flex flex-col gap-2
      "
    >
      <div
        id="profile-profile-header"
        className="text-xl
        text-neutral
        font-bold
      tabletS:text-2xl
      tabletM:text-3xl"
      >
        MY PROFILE
      </div>
      <div
        id="profile-profile-content"
        className="bg-neutral p-[1.4rem] rounded-md shadow
        "
      >
        <div
          id="profile-profile-form"
          className="p-2
        tabletS:p-5
        tabletS:text-xl"
        >
          {/* <div id="profile-name">name: Elon Thui</div> */}
          <div id="profile-wallet">
            wallet:{" "}
            <span>
              <span className="hidden tabletS:inline-block">
                {walletAddress}
              </span>
              <span className="tabletS:hidden">
                {simplifyAddress(walletAddress)}
              </span>
            </span>
          </div>
          <div id="profile-email">email: {email ? email : "N/A"}</div>
          <div id="profile-verified" className="flex">
            <div className="text-thuidark bg-[#00ff22] pl-2 pr-2 pt-1 pb-1 rounded-md">
              Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
