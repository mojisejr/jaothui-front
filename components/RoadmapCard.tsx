import styles from "../styles/Home.module.css";

export interface RoadmapCardProps {
  title: string;
  data: string[];
}

export default function RoadmapCard({ title, data }: RoadmapCardProps) {
  const upperTitle = title.toUpperCase();
  return (
    <div className="flex">
      <div
        className={`${styles.vertical} flex-none text-thuiyellow text-[30px]`}
      >
        {upperTitle}
      </div>
      <div className="flex-1 bg-thuiyellow rounded-xl pt-[0.5%] pb-[0.5%] pr-[2%] pl-[2%] gap-[0.5%] text-[35px]">
        {data && data.length > 0 ? (
          <ul className="flex flex-col flex-wrap max-h-[250px] p-5">
            {data.map((d, index) => (
              <li key={index}>{d}</li>
            ))}
          </ul>
        ) : (
          <div className="text-[30px]">Loading...</div>
        )}
      </div>
    </div>
  );
}
