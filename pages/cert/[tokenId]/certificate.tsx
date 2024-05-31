import React, { RefObject, useState } from "react";
import Layout from "../../../components/Layouts";
import Certificate from "../../../components/Cert/Certificate";
import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import CertificateMobile from "../../../components/Cert/Certificate-mobile";
import Image from "next/image";

const ApprovementPage = () => {
  const { query } = useRouter();

  // const { data: certificate } = trpc.metadata.getByMicrochip.useQuery({
  //   microchip: query.tokenId! as string,
  // });
  const { data: certificate, isLoading } =
    trpc.metadata.renderPedigree.useQuery({
      microchip: query.tokenId! as string,
    });

  return (
    <Layout>
      {/* <div className="min-h-screen  justify-center items-center flex labtop:hidden">
        <div>กรุณาเปิดในคอมพิวเตอร์ เพื่อดูใบพันธุ์ประวัติ</div>
      </div> */}
      {/* <div className="min-h-screen  justify-center items-center hidden labtop:flex"> */}
      <div className="min-h-screen  justify-center items-center tabletM:flex">
        {isLoading ? (
          <Loading size="lg" />
        ) : (
          <>
            {certificate != null || certificate != undefined ? (
              <div className="flex flex-col items-center gap-3 p-2">
                {/* <div className="flex tabletM:hidden">
                  <CertificateMobile microchip={query.tokenId! as string} />
                </div>
                <div className="hidden tabletM:flex">
                  <Certificate microchip={query.tokenId! as string} />
                </div> */}
                <div className="shadow-xl rotate-[90deg] w-full mt-[100px] scale-[1.3] tabletS:rotate-[0deg] tabletS:mt-0 tabletS:scale-[1]">
                  <Image
                    src={`data:image/jpeg;base64,${certificate!}`}
                    width={1000}
                    height={700}
                    alt="ped"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="font-bold">ไม่มีข้อมูลในระบบ</div>
                <div className="text-xs font-semibold">
                  กรุณาติดต่อสมาคมเพื่อขออนุมัติ
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ApprovementPage;
