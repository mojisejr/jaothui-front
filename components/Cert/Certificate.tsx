import Image from "next/image";
import { trpc } from "../../utils/trpc";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { MdDownload } from "react-icons/md";

interface CertificateProps {
  microchip: string;
}

const Certificate = ({ microchip }: CertificateProps) => {
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
      <div className="container w-[1000px] min-h-[600px]  bg-gradient-to-br from-[#F3EDC8] via-[#EAD196] to-[#F3EDC8] p-8 shadow-xl flex justify-center items-center">
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
        // className="relative container w-[1000px] min-h-[600px] bg-slate-300 p-8"
        className="relative container w-[1000px] min-h-[600px]  bg-gradient-to-br from-[#EEEEEE] via-[#EEEDEB] to-[#EEEEEE] p-8"
      >
        {/* <div className="example absolute rotate-[-45deg] font-bold opacity-30 top-[50%] left-[50%] text-[50px]">
        เอกสารตัวอย่าง
      </div>
      <div className="example absolute rotate-[-45deg] font-bold opacity-30 top-[30%] left-[20%] text-[50px]">
        เอกสารตัวอย่าง
      </div> */}
        <Image
          className="w-72 opacity-20 absolute bottom-[20%] right-[15%]"
          src="/images/logo-gray.png"
          width={750}
          height={750}
          alt="water-mark"
        />
        <div className="logo-text-qr flex justify-between items-center">
          <div>
            <Image
              className="w-28"
              src="/images/logo.png"
              width={750}
              height={750}
              alt="kwaithai-logo"
            />
          </div>
          <div className="text-center">
            <div className="font-semibold text-xl">
              CERTIFICATE OF ENTRY IN HEARD REGISTRY OF THAI BUFFALO
            </div>
            <div className="font-semibold text-xl">
              สมาคมอนุรักษ์และพัฒนาควายไทย
            </div>
            <div className="font-semibold text-xl">
              ASSOC. FOR THAI BUFFALO CONSERVATION AND DEVELOPMENT
            </div>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <div className="w-24 h-24 rounded-sm flex justify-center items-center overflow-hidden">
              <QRCodeSVG
                value={`https://jaothui.com/cert/${microchip}`}
                bgColor="none"
              />
            </div>
            <div>
              เลขที่{" "}
              <span className="font-bold">
                {metadata.certificate.no}/{metadata.certificate.year}
              </span>
            </div>
          </div>
        </div>
        <div className="upper-zonep p-6 grid grid-cols-10 gap-2">
          {/** line 1 */}
          <div className="col-span-5">
            ใบพันธุ์ประวัติควายชื่อ{" "}
            <span className="font-semibold">{metadata.name}</span>
          </div>
          <div className="col-span-5">
            หมายเลขประจำตัวสัตว์{" "}
            <span className="font-semibold">{metadata.certify.microchip}</span>
          </div>
          {/** line 2 */}
          <div className="col-span-2">
            เกิดวันที่{" "}
            <span className="font-semibold">{birthdate.date ?? "N/A"}</span>
          </div>
          <div className="col-span-2">
            เดือน{" "}
            <span className="font-semibold">
              {birthdate.thaiMonth ?? "N/A"}
            </span>
          </div>
          <div className="col-span-2">
            พ.ศ.{" "}
            <span className="font-semibold">{birthdate.thaiYear ?? "N/A"}</span>
          </div>
          <div className="col-span-2">
            ควายไทยสี{" "}
            <span className="font-semibold">
              {metadata.color.toLowerCase() === "black" ? "ดำ" : "เผือก"}
            </span>
          </div>
          <div className="col-span-2">
            เพศ{" "}
            <span className="font-semibold">
              {metadata.sex.toLowerCase() === "female" ? "เมีย" : "ผู้"}
            </span>
          </div>
          {/** line 3 */}
          <div className="col-span-10">
            ชื่อผู้ครอบครองควาย{" "}
            <span className="font-semibold">
              {metadata.certificate.ownerName}
            </span>
          </div>
          {/** line 4 */}
          <div className="col-span-10">
            สถานที่เกิด{" "}
            <span className="font-semibold">{metadata.certificate.bornAt}</span>
          </div>
        </div>
        <div className="lower-zone px-6 flex items-center gap-4">
          <Image
            className="w-96"
            src={metadata.imageUri}
            width={1000}
            height={700}
            alt="buffalo-image"
          />
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-evenly">
              <div>
                พ่อ{" "}
                <span className=" font-semibold">
                  {metadata.certificate.dadId != null
                    ? JSON.parse(metadata.certificate?.dadId!)[1]
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  ปู่{" "}
                  <span className=" font-semibold">
                    {metadata.certificate?.fGranDadId != null
                      ? JSON.parse(metadata.certificate?.fGranDadId!)[1]
                      : "N/A"}
                  </span>
                </div>
                <div>
                  ย่า{" "}
                  <span className=" font-semibold">
                    {metadata.certificate?.fGrandMomId != null
                      ? JSON.parse(metadata.certificate?.fGrandMomId!)[1]
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-evenly">
              <div>
                แม่{" "}
                <span className=" font-semibold">
                  {metadata.certificate?.momId != null
                    ? JSON.parse(metadata.certificate?.momId)[1]
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  ตา
                  <span className=" font-semibold">
                    {metadata.certificate?.mGrandDadId != null
                      ? JSON.parse(metadata.certificate?.mGrandDadId)[1]
                      : "N/A"}
                  </span>
                </div>
                <div>
                  ยาย{" "}
                  <span className=" font-semibold">
                    {metadata.certificate?.mGrandMomId != null
                      ? JSON.parse(metadata.certificate?.mGrandMomId!)[1]
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="signature-zone grid grid-cols-4 my-3">
          <div className="col-span-1"></div>
          <div className="flex justify-evenly col-span-3">
            <div className="flex flex-col items-center">
              <figure className="w-24">
                <Image
                  src={
                    metadata.certificate?.approvers.find(
                      (approver: { position: number }) => approver.position == 0
                    )?.signatureUrl!
                  }
                  height={200}
                  width={200}
                  alt="signature"
                />
              </figure>
              <span className="font-semibold text-center">{`(${
                metadata.certificate?.approvers.find(
                  (approver: { position: number }) => approver.position == 0
                )?.user.name
              })`}</span>
              <span className="text-center">
                {
                  metadata.certificate?.approvers.find(
                    (approver: { position: number }) => approver.position == 0
                  )?.job
                }
              </span>
            </div>
            <div className="flex flex-col items-center">
              <figure className="w-24">
                <Image
                  src={
                    metadata.certificate?.approvers.find(
                      (approver: { position: number }) => approver.position == 1
                    )?.signatureUrl!
                  }
                  height={200}
                  width={200}
                  alt="signature"
                />
              </figure>
              <span className="font-semibold text-cemter">{`(${
                metadata.certificate?.approvers.find(
                  (approver: { position: number }) => approver.position == 1
                )?.user.name
              })`}</span>
              <span className="text-center">
                {
                  metadata.certificate?.approvers.find(
                    (approver: { position: number }) => approver.position == 1
                  )?.job
                }
              </span>
            </div>
            <div className="flex flex-col items-center">
              <figure className="w-24">
                <Image
                  src={
                    metadata.certificate?.approvers.find(
                      (approver: { position: number }) => approver.position == 2
                    )?.signatureUrl!
                  }
                  height={200}
                  width={200}
                  alt="signature"
                />
              </figure>
              <span className="font-semibold text-center">{`(${
                metadata.certificate?.approvers.find(
                  (approver: { position: number }) => approver.position == 2
                )?.user.name
              })`}</span>
              <span className="text-center">
                {
                  metadata.certificate?.approvers.find(
                    (approver: { position: number }) => approver.position == 2
                  )?.job
                }
              </span>
            </div>
          </div>
        </div>
        {/* <div className="text-xs w-full text-right">
          เอกสารเพื่อทดสอบระบบเท่านั้น ยังไม่สามารถนำไปใช้จริงได้
          อยู่ระหว่างการพัฒนา
        </div> */}
      </div>
    </div>
  );
};

export default Certificate;
