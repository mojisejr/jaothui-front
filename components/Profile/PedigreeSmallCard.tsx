import Link from "next/link";
import { IMetadata } from "../../interfaces/iMetadata";
import CountryFlag from "../Shared/CountryFlag";
import Loading from "../Shared/Indicators/Loading";
import { motion } from "framer-motion";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { useState } from "react";

interface PedigreeCardProps {
  data: IMetadata;
}

const PedigreeSmallCard = ({ data }: PedigreeCardProps) => {
  const [exit, setExit] = useState<boolean>(false);
  const thaiDate = parseThaiDate(new Date(data?.birthdate!).getTime());
  return (
    <div className="relative w-52">
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
          href={`/cert/${data ? data.microchip : null}?i=${data.tokenId}`}
          className="w-full rounded-xl shadow-xl"
        >
          <div className="p-4">
            <img
              className="w-full rounded-tr-xl rounded-tl-xl"
              src={data ? data.image : "images/thuiLogo.png"}
              alt="image"
            />
            <div className="w-full rounded-br-xl rounded-bl-xl shadow p-3 flex justify-between items-center bg-thuidark">
              <div>
                <div className="text-primary">
                  {data ? data.microchip : <Loading size="sm" />}
                </div>
                <div className="font-bold text-xl">
                  {data?.name.startsWith("คุณ") ? (
                    <div className="text-xl font-bold bg-gradient-to-br from-[#FFE15D] via-[#e59a28] to-[#FFE15D] text-transparent bg-clip-text">
                      {data?.name ?? "loading"}
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-thuiwhite">
                      {data?.name ?? "loading"}
                    </div>
                  )}
                  {/* {data ? data.name : <Loading size="sm" />} */}
                </div>
                <div className="text-sm">
                  {data ? (
                    `${thaiDate.date} ${thaiDate.thaiMonth} ${thaiDate.thaiYear2}`
                  ) : (
                    <Loading size="sm" />
                  )}
                </div>
              </div>
              {/* <div>
                <CountryFlag
                  country={data ? data.origin : "thai"}
                  size="48x36"
                />
              </div> */}
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export default PedigreeSmallCard;
