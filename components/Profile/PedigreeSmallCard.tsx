import Link from "next/link";
import { IMetadata } from "../../interfaces/iMetadata";
import CountryFlag from "../Shared/CountryFlag";
import Loading from "../Shared/Indicators/Loading";
import { motion } from "framer-motion";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { useState } from "react";
import { BuffaloPhoto } from "../v2/BuffaloPhoto";
import { BuffaloPhotoFeedback, BuffaloPhotoStatus } from "../v2/BuffaloPhotoFeedback";
import { BuffaloSex } from "../v2/BuffaloSex";
import { formatBuffaloAge } from "../v2/formatAge";

interface PedigreeCardProps {
  data: IMetadata;
}

const PedigreeSmallCard = ({ data }: PedigreeCardProps) => {
  const [exit, setExit] = useState<boolean>(false);
  const thaiDate = parseThaiDate(data?.birthdate!);
  return (
    <BuffaloPhotoFeedback key={data.microchip}><div className="relative w-52 min-w-0">
      {exit ? (
        <div className="absolute top-0 left-0 w-full h-full  z-[10] flex justify-center items-center">
          <div className="p-2 bg-primary rounded-xl bg-opacity-70 flex gap-2 items-center">
            <Loading size="sm" />
            กำลังโหลด
          </div>
        </div>
      ) : null}
      <motion.div
        initial={{ y: 0 }}
        transition={{
          duration: 0.2,
          type: "tween",
          ease: "easeInOut",
        }}
        whileHover={{
          y: -3,
        }}
      >
        <div
          className="relative w-full rounded-xl shadow-xl"
        >
          <Link onClick={() => setExit(true)} href={`/cert/${data ? data.microchip : null}?i=${data.tokenId}`}
            aria-label={`ดูรายละเอียด ${data.name}`} className="absolute inset-0 z-10 rounded-xl focus-visible:ring-2 focus-visible:ring-focus-ring" />
          <div className="p-4">
            <div className="w-full bg-surface">
              <BuffaloPhoto src={data?.image} photoTokenId={data?.photoTokenId} microchip={data?.microchip} alt={data?.name || "กระบือ"} sizes="176px" fallback="/images/thuiLogo.png" />
            </div>
            <div className="w-full rounded-br-xl rounded-bl-xl shadow p-3 bg-thuidark">
              <div className="flex min-w-0 items-start justify-between gap-2"><div className={`min-w-0 flex-1 line-clamp-2 break-words text-xl font-bold ${data?.name.startsWith("คุณ") ? "bg-gradient-to-br from-[#FFE15D] via-[#e59a28] to-[#FFE15D] text-transparent bg-clip-text" : "text-thuiwhite"}`}>{data?.name ?? "loading"}</div><BuffaloSex value={data?.sex} /></div>
              <div className="min-w-0">
                <div className="text-primary">
                  {data ? data.microchip : <Loading size="sm" />}
                </div>
                <div className="text-sm">
                  {data ? (
                    `${thaiDate.date} ${thaiDate.thaiMonth} ${thaiDate.thaiYear2}`
                  ) : (
                    <Loading size="sm" />
                  )}
                </div>
              </div>
              <BuffaloPhotoStatus leading={<span className="text-[11px] font-semibold text-accent">{formatBuffaloAge(data.calculatedAge)}</span>} />
            </div>
          </div>
        </div>
      </motion.div>
    </div></BuffaloPhotoFeedback>
  );
};

export default PedigreeSmallCard;
