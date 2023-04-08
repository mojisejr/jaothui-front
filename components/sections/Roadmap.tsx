import RoadmapCard from "../RoadmapCard";
import data from "../../constants/roadmap.json";

export default function RoadmapSection() {
  return (
    <div
      className="relative w-full h-full top-[-90px] bg-thuidark bg-opacity-[0.955] pt-[10%] pb-[10%] pr-[5%] pl-[5%]
    tabletS:top-[-100px]
    tabletM:top-[-140px]
    labtop:top-[-160px]
    desktop:top-[-700px]
    "
    >
      <div
        className="text-thuiyellow text-[30px] pb-[2%]
      tabletS:text-[50px]
      "
      >
        Road Map
      </div>
      <div className="flex flex-col gap-[50px] pl-[5%] pr-[5%]">
        <RoadmapCard title={"phase1"} data={data.phase_1} />
        <RoadmapCard title={"phase2"} data={data.phase_2} />
        <RoadmapCard title={"phase3"} data={data.phase_3} />
        <RoadmapCard title={"phase4"} data={data.phase_4} />
      </div>
    </div>
  );
}
