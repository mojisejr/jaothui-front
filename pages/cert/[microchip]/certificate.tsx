import { useRouter } from "next/router";
import Image from "next/image";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import { trpc } from "../../../utils/trpc";
import { V2Layout, Spinner, Button } from "../../../components/v2";

const ApprovementPage = () => {
  const { query, back } = useRouter();

  const { data: certificate, isLoading } = trpc.metadata.renderPedigree.useQuery({
    tokenId: query.tokenId! as string,
    microchip: query.microchip! as string,
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
    <V2Layout activeTab="buffalo">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-5 pt-5">
        <Button variant="gold-outline" size="sm" onClick={() => back()}>
          <FiArrowLeft className="h-4 w-4" /> กลับ
        </Button>
        {certificate ? (
          <Button variant="gold-fill" size="sm" onClick={() => handleDowload()}>
            <FiDownload className="h-4 w-4" /> ดาวน์โหลด
          </Button>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-5 py-6">
        {isLoading ? (
          <div className="mt-10 flex w-full justify-center">
            <Spinner size="lg" />
          </div>
        ) : certificate ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="mt-[100px] w-full rotate-[90deg] scale-[1.3] overflow-hidden rounded-card border border-border-soft shadow-gold tabletS:mt-0 tabletS:rotate-0 tabletS:scale-100">
              <Image
                src={`data:image/jpeg;base64,${certificate!}`}
                width={1000}
                height={700}
                alt="ใบรับรองพันธุ์ประวัติ"
                className="h-auto w-full"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border-soft px-6 py-10 text-center">
            <div className="font-bold text-foreground">ไม่มีข้อมูลในระบบ</div>
            <div className="mt-1 text-xs text-muted">กรุณาติดต่อสมาคมเพื่อขออนุมัติ</div>
          </div>
        )}
      </div>
    </V2Layout>
  );
};

export default ApprovementPage;
