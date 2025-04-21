import Link from "next/link";
import { motion } from "framer-motion";
import { FaTrophy, FaMedal } from "react-icons/fa";
import { GiLaurelCrown } from "react-icons/gi";
import { trpc } from "../../utils/trpc";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function BuffaloLeaderboard() {
  const eventId = "gWLGmbSW0u0h9YFoJtkDeN";
  //   const [buffalos, setBuffalos] = useState(initialBuffalos);
  const { data: buffalos, isLoading } = trpc.voteEvent.getLeaderboard.useQuery({
    eventId,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="h-10 w-10 text-primary" />;
      case 2:
        return <FaMedal className="h-8 w-8 text-thuiwhite" />;
      case 3:
        return <GiLaurelCrown className="h-6 w-6 text-thuiwhite" />;
      default:
        return <span className="font-bold text-lg">{rank}</span>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 text-thuiwhite">
      {isLoading ? (
        <div className="w-full flex justify-center mt-20">
          <div className="loading loading-spinner loading-lg text-thuiwhite"></div>
        </div>
      ) : (
        <motion.div
          className="bg-[#0d3528] rounded-xl bg-opacity-30 border-[1px] border-thuiwhite p-6 shadow-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex justify-between items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-white">ตารางจัดอันดับ</h1>
          </motion.div>

          <>
            {buffalos && buffalos.length <= 0 ? (
              <motion.div
                className="space-y-3 text-xl"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                👩‍🌾 ยังไม่มีผลการโหวต
              </motion.div>
            ) : (
              <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {buffalos!.map((buffalo, index) => (
                  <motion.div
                    key={buffalo.microchip}
                    variants={itemVariants}
                    layout
                    transition={{
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                    }}
                  >
                    <Link
                      href={`/cert/${buffalo.microchip}?e=${eventId}&vote=true`}
                      className="block transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
                    >
                      <div
                        className={`card ${
                          index + 1 <= 3
                            ? "bg-black/30 border border-[#00d47e]/70"
                            : "bg-black/10 border-0"
                        } hover:bg-black/40 transition-colors`}
                      >
                        <div className="card-body p-4 flex-row items-center">
                          <div className="flex items-center justify-center w-12">
                            {getRankIcon(index + 1)}
                          </div>

                          <div className="flex-1 ml-4">
                            <h3 className="font-semibold text-white">
                              {buffalo.name}
                              {index + 1 <= 3 && (
                                <span className="badge ml-2 bg-gradient-to-r from-[#0d3528] to-[#00d47e] text-thuiwhite border-none">
                                  Top {index + 1}
                                </span>
                              )}
                            </h3>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-bold text-white">
                              {buffalo.voteCount.toLocaleString()}
                            </span>
                            <p className="text-xs text-white/70">votes</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        </motion.div>
      )}
    </div>
  );
}
