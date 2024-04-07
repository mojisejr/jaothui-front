import React from "react";
import Layout from "../../../components/Layouts";
import Certificate from "../../../components/Cert/Certificate";
import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import CertificateMobile from "../../../components/Cert/Certificate-mobile";

const ApprovementPage = () => {
  const { query } = useRouter();

  const { data: certificate, isLoading } =
    trpc.metadata.getByMicrochip.useQuery({
      microchip: query.tokenId! as string,
    });

  // console.log({ certificate, query: query.tokenId! });

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
            {certificate.isFull ? (
              <>
                <div className="flex tabletM:hidden">
                  <CertificateMobile
                    microchip={query.tokenId! as string}
                    no={certificate.no}
                    year={certificate.year}
                    bornAt={certificate.bornAt}
                    owner={certificate.owner}
                  />
                </div>
                <div className="hidden tabletM:flex">
                  <Certificate
                    microchip={query.tokenId! as string}
                    no={certificate.no}
                    year={certificate.year}
                    bornAt={certificate.bornAt}
                    owner={certificate.owner}
                  />
                </div>
              </>
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
