import RoadmapCard from "../RoadmapCard";
import data from "../../constants/roadmap.json";

export default function RoadmapSection() {
  return (
    <div className="w-screen h-full bg-thuidark pt-[3%] pb-[3%] pr-[1.5%] pl-[1.5%]">
      <div className="text-thuiyellow font-bold text-[50px] pb-[2%]">
        Road Map
      </div>
      <div className="flex flex-col gap-[50px] pl-[5%] pr-[5%]">
        <RoadmapCard title={"phase1"} data={data.phase_1} />
        <RoadmapCard title={"phase2"} data={data.phase_2} />
      </div>
    </div>
  );
}
