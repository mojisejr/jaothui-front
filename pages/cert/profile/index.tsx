import Profile from "../../../components/Cert/Profile";
import ProfileMenu from "../../../components/Cert/ProfileMenu";

import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import Layout from "../../../components/Layouts";
import { useRouter } from "next/router";

const ProfilePage = () => {
  const { replace } = useRouter();
  const { isConnected } = useBitkubNext();

  if (!isConnected) {
    replace("/unauthorized");
    return;
  }

  return (
    <>
      <Layout>
        <div className="min-h-screen">
          <div className="grid grids-col-1 place-items-center py-10">
            <div className="px-4 py-6 bg-base-200 rounded-xl shadow-xl">
              <Profile />
              <ProfileMenu />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ProfilePage;
