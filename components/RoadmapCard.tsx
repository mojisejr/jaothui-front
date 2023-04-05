import Image from "next/image";
import styles from "../styles/Home.module.css";
import icon from "../public/images/icon.png";

export interface RoadmapCardProps {
  title: string;
  data: string[];
}

export default function RoadmapCard({ title, data }: RoadmapCardProps) {
  const upperTitle = title.toUpperCase();
  return (
    <div className="flex">
      <div
        className={`${styles.vertical} flex-none text-thuiyellow text-[30px] font-bold`}
      >
        {upperTitle}
      </div>
      <div className="flex-1 bg-thuiyellow rounded-[35px] pt-[0.5%] pb-[0.5%] pr-[2%] pl-[2%] gap-[0.5%] text-[35px] font-thin">
        {data && data.length > 0 ? (
          <ul className="flex flex-col flex-wrap max-h-[250px] p-5">
            {data.map((d, index) => (
              <li key={index}>
                <div className="flex items-center">
                  <div>
                    <Image src={icon} width={70} alt={"icon"} />
                  </div>
                  <div>{d}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[30px]">Loading...</div>
        )}
      </div>
    </div>
  );
}
