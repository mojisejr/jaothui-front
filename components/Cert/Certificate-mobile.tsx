import Image from "next/image";
import { trpc } from "../../utils/trpc";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import html2canvas from "html2canvas";
import { MdDownload } from "react-icons/md";

interface CertificateProps {
  microchip: string;
  no: number;
  year: number;
  bornAt: string;
  owner: string;
}

const CertificateMobile = ({
  microchip,
  no,
  year,
  bornAt,
  owner,
}: CertificateProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const { data: metadata, isLoading } = trpc.metadata.getByMicrochip.useQuery({
    microchip,
  }) as any;

  const birthdate = parseThaiDate(metadata?.birthdate! * 1000);

  async function handleDownloadImage() {
    if (!certificateRef) return;
    const canvas = await html2canvas(certificateRef?.current!);
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = data;
    link.download = `certificate-${new Date().getTime().toString()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (isLoading) {
    return (
      <div className="container w-[1000px] min-h-[600px]  bg-gradient-to-br from-[#EEEEEE] via-[#EEEDEB] to-[#EEEEEE] p-8 shadow-xl flex justify-center items-center">
        <div className="flex gap-2 items-center">
          <div className="loading loading-spinner loading-lg text-[#ffffff]"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-xl relative">
      {!certificateRef === undefined ? null : (
        <button
          onClick={() => handleDownloadImage()}
          className="absolute -bottom-3 right-0 z-[10] btn btn-primary btn-sm btn-circle shadow"
        >
          <MdDownload size={24} className="text-[#ffffff]" />
        </button>
      )}
      <div
        ref={certificateRef}
        className="relative container max-w-[425px] min-h-[250px]  bg-gradient-to-br bg-gradient-to-br from-[#EEEEEE] via-[#EEEDEB] to-[#EEEEEE] p-2"
      >
        {/* <div className="example absolute rotate-[-45deg] font-bold opacity-30 top-[50%] left-[50%] text-[50px]">
        เอกสารตัวอย่าง
      </div>
      <div className="example absolute rotate-[-45deg] font-bold opacity-30 top-[30%] left-[20%] text-[50px]">
        เอกสารตัวอย่าง
      </div> */}
        <img
          className="w-32 opacity-20 absolute bottom-[15%] right-[15%]"
          src="/images/logo-gray.png"
          width={80}
          height={80}
          alt="water-mark"
        />
        <div className="logo-text-qr flex justify-between items-center">
          <div>
            <img
              className="w-16"
              src="/images/logo.png"
              width={80}
              height={80}
              alt="kwaithai-logo"
            />
          </div>
          <div className="text-center">
            <div className="font-semibold text-[8px]">
              CERTIFICATE OF ENTRY IN HEARD REGISTRY OF THAI BUFFALO
            </div>
            <div className="font-semibold text-[10px]">
              สมาคมอนุรักษ์และพัฒนาควายไทย
            </div>
            <div className="font-semibold text-[8px]">
              ASSOC. FOR THAI BUFFALO CONSERVATION AND DEVELOPMENT
            </div>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <div className="w-10 h-10 rounded-sm flex justify-center items-center overflow-hidden">
              <QRCodeSVG
                value={`https://jaothui.com/cert/${microchip}`}
                bgColor="none"
              />
            </div>
            <div className="text-[8px]">
              เลขที่{" "}
              <span className="font-bold text-[8px]">
                {no}/{year}
              </span>
            </div>
          </div>
        </div>
        <div className="upper-zonep p-1 grid grid-cols-10 gap-1">
          {/** line 1 */}
          <div className="col-span-5 text-[8px]">
            ใบพันธุ์ประวัติควายชื่อ{" "}
            <span className="font-semibold text-[8px]">{metadata.name}</span>
          </div>
          <div className="col-span-5 text-[8px]">
            หมายเลขประจำตัวสัตว์{" "}
            <span className="font-semibold text-[8px]">
              {metadata.certify.microchip}
            </span>
          </div>
          {/** line 2 */}
          <div className="col-span-2 text-[8px]">
            เกิดวันที่{" "}
            <span className="font-semibold text-[8px]">
              {birthdate.date ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2 text-[8px]">
            เดือน{" "}
            <span className="font-semibold text-[8px]">
              {birthdate.thaiMonth ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2 text-[8px]">
            พ.ศ.{" "}
            <span className="font-semibold text-[8px]">
              {birthdate.thaiYear ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2 text-[8px]">
            ควายไทยสี{" "}
            <span className="font-semibold text-[8px]">
              {metadata.color.toLowerCase() === "black" ? "ดำ" : "เผือก"}
            </span>
          </div>
          <div className="col-span-2 text-[8px]">
            เพศ{" "}
            <span className="font-semibold text-[8px]">
              {metadata.sex.toLowerCase() === "female" ? "เมีย" : "ผู้"}
            </span>
          </div>
          {/** line 3 */}
          <div className="col-span-10 text-[8px]">
            ชื่อผู้ครอบครองควาย{" "}
            <span className="font-semibold text-[8px]">{owner}</span>
          </div>
          {/** line 4 */}
          <div className="col-span-10 text-[8px]">
            สถานที่เกิด{" "}
            <span className="font-semibold text-[8px]">{bornAt}</span>
          </div>
        </div>
        <div className="lower-zone px-2 flex items-center gap-2 py-1">
          <div className="relative w-[130px] h-[90px]">
            <Image
              fill
              src={metadata.imageUri}
              // width={130}
              // height={90}
              style={{ objectFit: "contain" }}
              alt="buffalo-image"
            />
          </div>

          <div className="flex flex-col gap-4 text-[8px]">
            <div>
              พ่อ <span className="font-semibold text-[8px]">N/A</span>
            </div>
            <div>
              แม่ <span className="font-semibold text-[8px]">N/A</span>
            </div>
          </div>
        </div>
        <div className="signature-zone grid grid-cols-4 my-3 text-[7px]">
          <div className="col-span-1"></div>
          <div className="flex justify-evenly col-span-3">
            <div className="flex flex-col items-center">
              <span className="font-semibold">{`(นายกุลภัทร์ โพธิกนิษฐ)`}</span>
              <span>นายทะเบียนสมาคม</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">{`(นายธนบัตร ใคร่นุ่นสิงห์)`}</span>
              <span>คณะทำงานกลางสมาคม</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">{`(นายสุชาติ บุญเจริญ)`}</span>
              <span>นายกสมาคมอนุรักษ์​และพัฒนาควายไทย</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateMobile;
