import React from "react";
import Layout from "../../components/Layouts";
import Pedigree from "../../components/Home/Pedigree";
import NoConnectProfileCard from "../../components/Profile/NoConnectProfileCard";
import PedigreeListInProfile from "../../components/Profile/PedigreeList";

const ProfilePage = () => {
  return (
    <Layout>
      <div className="p-2 bg-secondary text-thuiwhite min-h-screen">
        <div className="grid grid-cols-1 w-full overflow-hidden">
          <NoConnectProfileCard />
          <PedigreeListInProfile />
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
