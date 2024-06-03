import Layout from "../../../components/Layouts";
import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import Image from "next/image";

const ApprovementPage = () => {
  const { query, back } = useRouter();

  const { data: certificate, isLoading } =
    trpc.metadata.renderPedigree.useQuery({
      microchip: query.tokenId! as string,
    });

  const handleDowload = () => {
    if (!certificate) return;
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${certificate!}`;
    link.download = "assoc-certificate.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="w-full flex justify-between items-center p-4 tabletS:flex tabletS:justify-center tabletS:gap-4">
        <button className="btn" onClick={() => back()}>
          back
        </button>
        {certificate != null || certificate != undefined ? (
          <button className="btn" onClick={() => handleDowload()}>
            download
          </button>
        ) : null}
      </div>
      <div className="min-h-screen  justify-center items-center tabletM:flex">
        {isLoading ? (
          <div className="w-full justify-center flex mt-10">
            <Loading size="lg" />
          </div>
        ) : (
          <>
            {certificate != null || certificate != undefined ? (
              <div className="flex flex-col items-center gap-3 p-2">
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
