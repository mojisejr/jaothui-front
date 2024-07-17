import { ReactNode } from "react";
import BottomNav from "../Shared/Navbar/Bottom";
import { useRouter } from "next/router";

import MenuList from "../Shared/Navbar/MenuList";

import { IoArrowBack } from "react-icons/io5";
import Image from "next/image";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { trpc } from "../../utils/trpc";
import Loading from "../Shared/Indicators/Loading";
import { motion } from "framer-motion";

interface PrivilegeLayoutProps {
  children: ReactNode;
}
const PrivilegeLayout = ({ children }: PrivilegeLayoutProps) => {
  //HOOKs
  const { walletAddress } = useBitkubNext();
  const { back } = useRouter();

  //TRPC
  const { data: point, isLoading: pointLoading } =
    trpc.user.getJaothuiPointOf.useQuery({ wallet: walletAddress! });

  return (
    <>
      <div className="drawer">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="w-full h-full sm:min-h-screen bg-thuidark flex flex-col gap-5 px-4 pt-4 items-center">
            <div className="text-thuiwhite text-center  font-bold text-2xl">
              Jaothui Privilege
            </div>
            <motion.div
              initial={{
                opacity: 0,
                y: 300,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              transition={{
                duration: 1.2,
                type: "spring",
                ease: "easeInOut",
              }}
              className="bg-thuiwhite w-full max-w-xl min-h-screen px-2 pb-10 rounded-t-2xl"
            >
              <div className="w-full navbar border-b-2 border-[#eee] mb-2">
                <div className="navbar-start">
                  <button
                    onClick={() => back()}
                    className="btn btn-ghost btn-sm"
                  >
                    <IoArrowBack size={28} />
                  </button>
                </div>
                <div className="navbar-center"></div>
                <div className="navbar-end">
                  <div className="w-full flex items-center justify-end gap-2">
                    <figure className="w-8">
                      <Image
                        src="/images/icons/JAOTHUI-POINT.png"
                        alt="thuipoint-logo"
                        width={1000}
                        height={1000}
                      />
                    </figure>
                    {pointLoading ? (
                      <Loading size="lg" />
                    ) : (
                      <span className="text-xl font-bold">
                        {point == null || point == undefined
                          ? 0
                          : point.currentPoint}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                }}
              >
                {children}
              </motion.div>
            </motion.div>
          </div>
          {/* <FooterSection /> */}
          <BottomNav />
        </div>
        <MenuList />
      </div>
    </>
  );
};

export default PrivilegeLayout;
