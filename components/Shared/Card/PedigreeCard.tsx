import Link from "next/link";
import { IMetadata } from "../../../interfaces/iMetadata";
import CountryFlag from "../CountryFlag";
import Loading from "../Indicators/Loading";
import { motion } from "framer-motion";
import { parseThaiDate } from "../../../helpers/parseThaiDate";
import { useState } from "react";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { FaHeart } from "react-icons/fa";

interface PedigreeCardProps {
  data: IMetadata;
  vote?: boolean;
  canVote?: boolean;
  eventId?: string;
  votedMicrochip?: string;
  index?: number;  // Index/position number in list
}

const PedigreeCard = ({
  data,
  canVote = false,
  votedMicrochip,
  eventId,
  vote = false,
  index,  // Add index here
}: PedigreeCardProps) => {
  const { isConnected } = useBitkubNext();
  const [exit, setExit] = useState<boolean>(false);
  const thaiDate = parseThaiDate(new Date(data?.birthdate! * 1000).getTime());

  return (
    <div className="relative w-84">
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
        <Link
          onClick={() => setExit(true)}
          // href={`/cert/${data ? data.microchip : null}?i=${data.tokenId}`}
          href={`/cert/${data ? data.microchip : null}${isConnected && vote && eventId != undefined ? `?e=${eventId}&vote=true` : ""}`}
          className="relative w-full rounded-xl shadow-xl"
        >
          {isConnected && vote && eventId != undefined ? (
            <div className="absolute top-[8%] right-[8%] z-50">
              <FaHeart
                className={`${votedMicrochip == data.microchip ? "text-primary" : `${canVote ? "text-[#333]" : "text-[#333] opacity-60"}`}`}
                size={28}
              />
            </div>
          ) : null}
          <div className="p-4">
            <img
              className="w-full rounded-xl"
              src={data ? data.image : "images/thuiLogo.png"}
              alt="image"
            />
            <div className="w-full rounded-xl shadow p-3 flex justify-between items-center">
              <div>
                <div className="text-primary">
                  {data ? data.microchip : <Loading size="sm" />}
                </div>
                <div className="font-bold text-xl">
                  {data?.name.startsWith("คุณ") ? (
                    <div className="text-2xl font-bold bg-gradient-to-br from-[#FFE15D] via-[#e59a28] to-[#FFE15D] text-transparent bg-clip-text">
                      {data?.name ?? "loading"}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-secondary">
                      {data?.name ?? "loading"}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  {data ? (
                    `${thaiDate.date} ${thaiDate.thaiMonth} ${thaiDate.thaiYear2}`
                  ) : (
                    <Loading size="sm" />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {/* 🔢 Index Number Badge */}
                {index !== undefined && (
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index}
                  </div>
                )}
                <CountryFlag
                  country={data ? data.origin : "thai"}
                  size="48x36"
                />
                <div className="font-semibold">{data.calculatedAge} ด.</div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export default PedigreeCard;
