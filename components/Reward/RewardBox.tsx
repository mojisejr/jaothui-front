import Image from "next/image";
import { RewardData } from "../../interfaces/iReward";

import { FaTrophy } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { BiRfid } from "react-icons/bi";
import { TbNfc } from "react-icons/tb";
import { motion } from "framer-motion";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { useRouter } from "next/router";

interface RewardBoxProps {
  buffaloName: string;
  reward: RewardData;
}

const RewardBox = ({ reward, buffaloName }: RewardBoxProps) => {
  const { back } = useRouter();
  const eventDate = reward.eventDate ?? new Date().getTime();
  const thaiDate = parseThaiDate(new Date(eventDate).getTime());
  return (
    <>
      <motion.div
        className="my-10 mx-3 flex justify-center"
        id="container"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.5,
          type: "tween",
          ease: "easeInOut",
        }}
      >
        <div className="flex min-h-screen items-center max-w-[800px] justify-center rounded-xl shadow-xl">
          <div className="card my-2 w-11/12 bg-base-100 xl:my-6 xl:w-1/2">
            <Image
              src={reward.rewardImage!}
              width={760}
              height={10000}
              alt="image"
            />
            <div className="card-body">
              <div className="card-title">Information</div>
              <div className="stats stats-vertical shadow">
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <MdEvent size={30} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {reward.eventName}
                    </div>
                    <div className="stat-desc">Event{"'"}s name</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <FaTrophy size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {reward.rewardName}
                    </div>
                    <div className="stat-desc">Reward</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4 ">
                  <div className="stat-figure text-secondary">
                    <IoCalendarNumberOutline size={30} />
                  </div>
                  <div>
                    <div className="xl:hidden stat-title font-bold text-secondary xl:text-[2rem]">
                      {`${thaiDate.date} ${thaiDate.thaiMonth} ${thaiDate.thaiYear2}`}
                    </div>
                    <div className="stat-desc">Event Date</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <TbNfc size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {buffaloName}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Name</div>
                  </div>
                </div>
                <div className="stat flex items-center gap-4">
                  <div className="stat-figure text-secondary">
                    <BiRfid size={30} />
                  </div>
                  <div>
                    <div className="stat-title font-bold text-secondary xl:text-[2rem]">
                      {reward.microchip}
                    </div>
                    <div className="stat-desc">Buffalo{"'"}s Microchip</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => back()}
                className="btn btn-ghost text-gray-400"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default RewardBox;
