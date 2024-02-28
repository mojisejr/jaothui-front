import React from "react";
import Layout from "../../../components/Layouts";
import Certificate from "../../../components/Cert/Certificate";
import { useRouter } from "next/router";

const ApprovementPage = () => {
  const { query } = useRouter();

  return (
    <Layout>
      <div className="min-h-screen  justify-center items-center flex labtop:hidden">
        <div>กรุณาเปิดในคอมพิวเตอร์ เพื่อดูใบพันธุ์ประวัติ</div>
      </div>
      <div className="min-h-screen  justify-center items-center hidden labtop:flex">
        <Certificate microchip={query.tokenId! as string} />
      </div>
    </Layout>
  );
};

export default ApprovementPage;
