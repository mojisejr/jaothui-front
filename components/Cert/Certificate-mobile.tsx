import Image from "next/image";
import { trpc } from "../../utils/trpc";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { QRCodeSVG } from "qrcode.react";

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
  const { data: metadata, isLoading } = trpc.metadata.getByMicrochip.useQuery({
    microchip,
  }) as any;

  const birthdate = parseThaiDate(metadata?.birthdate! * 1000);

  if (isLoading) {
    return (
      <div className="container w-[1000px] min-h-[600px]  bg-gradient-to-br from-[#F3EDC8] via-[#EAD196] to-[#F3EDC8] p-8 shadow-xl flex justify-center items-center">
        <div className="flex gap-2 items-center">
          <div className="loading loading-spinner loading-lg text-[#ffffff]"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="relative container max-w-[425px] min-h-[300px]  bg-gradient-to-br from-[#F3EDC8] via-[#EAD196] to-[#F3EDC8] p-4 shadow-xl">
        {/* <div className="example absolute rotate-[-45deg] font-bold opacity-30 top-[50%] left-[50%] text-[50px]">
        เอกสารตัวอย่าง
      </div>
      <div className="example absolute rotate-[-45deg] font-bold opacity-30 top-[30%] left-[20%] text-[50px]">
        เอกสารตัวอย่าง
      </div> */}
        <Image
          className="w-24 opacity-20 absolute bottom-[20%] right-[20%]"
          src="/images/logo-gray.png"
          width={750}
          height={750}
          alt="water-mark"
        />
        <div className="logo-text-qr flex justify-between items-center">
          <div>
            <Image
              className="w-20"
              src="/images/logo.png"
              width={750}
              height={750}
              alt="kwaithai-logo"
            />
          </div>
          <div className="text-center">
            <div className="font-semibold text-[10px]">
              CERTIFICATE OF ENTRY IN HEARD REGISTRY OF THAI BUFFALO
            </div>
            <div className="font-semibold text-[10px]">
              สมาคมอนุรักษ์และพัฒนาควายไทย
            </div>
            <div className="font-semibold text-[10px]">
              ASSOC. FOR THAI BUFFALO CONSERVATION AND DEVELOPMENT
            </div>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <div className="w-12 h-12 rounded-sm flex justify-center items-center overflow-hidden">
              <QRCodeSVG
                value={`https://jaothui.com/cert/${microchip}`}
                bgColor="none"
              />
            </div>
            <div className="text-[10px]">
              เลขที่{" "}
              <span className="font-bold text-xs">
                {no}/{year}
              </span>
            </div>
          </div>
        </div>
        <div className="upper-zonep p-2 grid grid-cols-10 gap-1">
          {/** line 1 */}
          <div className="col-span-5 text-[10px]">
            ใบพันธุ์ประวัติควายชื่อ
            <br />
            <span className="font-semibold text-xs">{metadata.name}</span>
          </div>
          <div className="col-span-5 text-[10px]">
            หมายเลขประจำตัวสัตว์
            <br />
            <span className="font-semibold text-xs">
              {metadata.certify.microchip}
            </span>
          </div>
          {/** line 2 */}
          <div className="col-span-2 text-[10px]">
            เกิดวันที่
            <br />
            <span className="font-semibold text-xs">
              {birthdate.date ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2 text-[10px]">
            เดือน
            <br />
            <span className="font-semibold text-xs">
              {birthdate.thaiMonth ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2 text-[10px]">
            พ.ศ.
            <br />
            <span className="font-semibold text-xs">
              {birthdate.thaiYear ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2 text-[10px]">
            ควายไทยสี
            <br />
            <span className="font-semibold text-xs">
              {metadata.color.toLowerCase() === "black" ? "ดำ" : "เผือก"}
            </span>
          </div>
          <div className="col-span-2 text-[10px]">
            เพศ
            <br />
            <span className="font-semibold text-xs">
              {metadata.sex.toLowerCase() === "female" ? "เมีย" : "ผู้"}
            </span>
          </div>
          {/** line 3 */}
          <div className="col-span-10 text-[10px]">
            ชื่อผู้ครอบครองควาย <span className="font-semibold">{owner}</span>
          </div>
          {/** line 4 */}
          <div className="col-span-10 text-[10px]">
            สถานที่เกิด <span className="font-semibold">{bornAt}</span>
          </div>
        </div>
        <div className="lower-zone px-2 flex items-center gap-2">
          <Image
            className="w-[120px]"
            src={metadata.imageUri}
            width={1000}
            height={700}
            alt="buffalo-image"
          />
          <div className="flex flex-col gap-4 text-xs">
            <div>
              พ่อ <span className="font-semibold">N/A</span>
            </div>
            <div>
              แม่ <span className="font-semibold">N/A</span>
            </div>
          </div>
        </div>
        <div className="signature-zone grid grid-cols-4 my-1 text-[7px]">
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
