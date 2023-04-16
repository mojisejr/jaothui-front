const Profile = () => {
  return (
    <div
      id="profile-profile-box"
      className="text-thuiwhite flex flex-col gap-2
      "
    >
      <div
        id="profile-profile-header"
        className="text-xl
      tabletS:text-2xl
      tabletM:text-3xl"
      >
        MY PROFILE
      </div>
      <div
        id="profile-profile-content"
        className="bg-thuidark rounded-md 
        "
      >
        <div
          id="profile-profile-form"
          className="p-2
        tabletS:p-5
        tabletS:text-xl"
        >
          <div id="profile-name">name: Elon Thui</div>
          <div id="profile-email">email: elonthui@gmail.com</div>
          <div id="profile-verified" className="text-[#00ff22]">
            Verified
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
