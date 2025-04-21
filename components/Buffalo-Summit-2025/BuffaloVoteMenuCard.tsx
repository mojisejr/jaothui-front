import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FaVoteYea, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { trpc } from "../../utils/trpc";

function BuffaloVoteMenuCard({ isActive }: { isActive: boolean }) {
  const eventId = "gWLGmbSW0u0h9YFoJtkDeN";
  const { walletAddress } = useBitkubNext();

  const { data, isLoading, refetch } =
    trpc.voteEvent.getUserToVoteByEvent.useQuery(
      {
        wallet: walletAddress!,
        eventId,
      },
      { enabled: false }
    );

  useEffect(() => {
    if (walletAddress) {
      refetch();
    }
  }, [walletAddress, isLoading]);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: [0, -8, 0], opacity: 1 }}
      transition={{
        duration: 1.2,
        ease: [0.16, 0.77, 0.47, 0.97],
        opacity: { duration: 0.8 },
        scale: { duration: 1 },
      }}
      className="w-[230px] h-[300px] border-thuiwhite border-opacity-[0.2] border-[1px] backdrop-blur-xl rounded-xl shadow-2xl 
      flex flex-col justify-between
    "
    >
      <div className="inner-wrapper p-4 flex flex-col gap-4">
        <div>
          <FaVoteYea size={38} className="text-primary" />
          <h3 className="text-thuiwhite font-semibold">กิจกรรมโหวตควาย</h3>
        </div>
        <p className="text-xs text-[#eee] px-2 border-l-[1px]">
          มาโหวตควายตัวโปรดของคุณใน Buffalo Summit 2025! ทุกเสียงของคุณสำคัญ
          ร่วมเชียร์และสนุกไปกับการเลือกควายยอดนิยมบนแพลตฟอร์มของเรา
          โหวตได้ทุกตัว ไม่จำกัด!
        </p>
        {data ? (
          <p className="text-thuiwhite text-center">คุณโหวตแล้ว 🎉🎉🎉</p>
        ) : null}
      </div>
      {!isActive ? null : (
        <div className="w-full p-2">
          {!isLoading ? (
            <>
              {!data ? (
                <Link
                  href={`/cert?e=${eventId}&vote=true`}
                  className="btn btn-primary btn-sm flex gap-2 w-full"
                >
                  <span>โหวต</span>
                  <FaArrowRight />
                </Link>
              ) : (
                <Link
                  href={`/cert/${data.voted_for.microchip}?e=${eventId}&vote=true`}
                  className="btn btn-primary btn-sm flex gap-2 w-full"
                >
                  <span>ไปที่ควายที่คุณโหวต</span>
                  <FaArrowRight />
                </Link>
              )}
            </>
          ) : (
            <div className="loading loading-spinner loading-sm text-thuiwhite text-center"></div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default BuffaloVoteMenuCard;
