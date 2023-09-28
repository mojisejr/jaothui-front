import type { NextPage } from "next";
import Layout from "../components/Layouts";
import Image from "next/image";

const Partners: NextPage = () => {
  return (
    <div className="relative">
      <Layout>
        <div className="flex justify-between items-center px-[22px] py-2">
          <div className="text-xl font-bold">Partners</div>
        </div>
        <div className="tabletS:min-h-screen grid grid-cols-1 tabletS:grid-cols-3">
          <Image
            className=""
            src="/images/STP.png"
            width={500}
            height={500}
            alt={"STP"}
          />
          <Image
            className=""
            src="/images/NP.png"
            width={500}
            height={500}
            alt={"NP"}
          />
          <Image
            className=""
            src="/images/PP.png"
            width={500}
            height={500}
            alt={"PP"}
          />
        </div>
      </Layout>
    </div>
  );
};

export default Partners;
