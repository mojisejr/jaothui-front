import React, { useEffect } from "react";
import Layout from "../../../components/Layouts";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import SummitLogo from "../../../components/Buffalo-Summit-2025/SummitLogo";
import BuffaloVoteMenuCard from "../../../components/Buffalo-Summit-2025/BuffaloVoteMenuCard";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { MdLeaderboard } from "react-icons/md";
import { trpc } from "../../../utils/trpc";

function BuffaloSummitMainPage() {
  const eventId = "gWLGmbSW0u0h9YFoJtkDeN";
  const { replace, back } = useRouter();
  const { isConnected } = useBitkubNext();
  const { data: isEventActive, isLoading } =
    trpc.voteEvent.isEventActive.useQuery(eventId);

  useEffect(() => {
    if (!isConnected) {
      void replace("/profile");
    }
  }, [isConnected]);

  return (
    <Layout>
      <div
        id="wrapper"
        className="
        py-10 w-full h-screen overflow-y-scroll bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-[#0a0a0a] via-[#0d3528] to-[#00d47e]
        flex flex-col items-center gap-6
        "
      >
        <SummitLogo />
        <>
          <BuffaloVoteMenuCard isActive={isEventActive} />
          <div className="flex justify-between w-full px-4">
            <button
              onClick={back}
              className="btn btn-primary btn-sm flex flex-col gap-2 items-center"
            >
              <FaArrowLeft />
              <span>กลับ</span>
            </button>
            {!isLoading && isEventActive ? (
              <Link
                href="/profile/buffalo-summit-2025/leaderboard"
                className="btn btn-primary btn-sm flex flex-col gap-2 items-center"
              >
                <MdLeaderboard />
                <span>ตารางจัดอันดับ</span>
              </Link>
            ) : null}
          </div>
        </>
      </div>
    </Layout>
  );
}

export default BuffaloSummitMainPage;
