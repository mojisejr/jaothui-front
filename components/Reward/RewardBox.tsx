import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { BiRfid } from "react-icons/bi";
import { TbNfc } from "react-icons/tb";
import { FiArrowLeft } from "react-icons/fi";
import { RewardData } from "../../interfaces/iReward";
import { parseThaiDate } from "../../helpers/parseThaiDate";
import { StatRow, Button } from "../v2";

interface RewardBoxProps {
  buffaloName: string;
  reward: RewardData;
}

/** RewardBox — v2 (dark-gold) reskin of the competition-reward detail. Same data, StatRow list. */
const RewardBox = ({ reward, buffaloName }: RewardBoxProps) => {
  const { back } = useRouter();
  const eventDate = reward.eventDate ?? new Date().getTime();
  const thai = parseThaiDate(new Date(eventDate).getTime());

  return (
    <motion.div
      className="mx-auto w-full max-w-lg px-5 pt-5"
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={() => back()}
        className="mb-4 flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
      >
        <FiArrowLeft className="h-4 w-4" /> กลับ
      </button>

      <div className="overflow-hidden rounded-card border border-border-soft bg-surface shadow-gold">
        {reward.rewardImage && (
          <Image
            src={reward.rewardImage}
            width={760}
            height={760}
            alt={reward.rewardName || "reward"}
            className="h-auto w-full"
          />
        )}
        <div className="p-4">
          <h2 className="mb-3 text-base font-bold text-accent">รายละเอียดรางวัล</h2>
          <div className="overflow-hidden rounded-card border border-border-soft [&>*+*]:border-t [&>*+*]:border-border-soft">
            <StatRow icon={<MdEvent className="h-5 w-5" />} label="ชื่อกิจกรรม" value={reward.eventName || "N/A"} />
            <StatRow icon={<FaTrophy className="h-5 w-5" />} label="รางวัล" value={reward.rewardName || "N/A"} />
            <StatRow icon={<IoCalendarNumberOutline className="h-5 w-5" />} label="วันที่" value={`${thai.date} ${thai.thaiMonth2} ${thai.thaiYear}`} />
            <StatRow icon={<TbNfc className="h-5 w-5" />} label="ชื่อกระบือ" value={buffaloName || "N/A"} />
            <StatRow icon={<BiRfid className="h-5 w-5" />} label="ไมโครชิป" value={reward.microchip || "N/A"} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RewardBox;
