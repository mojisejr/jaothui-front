import React from "react";
import { GiMicrochip } from "react-icons/gi";
import { BsPostcard } from "react-icons/bs";
import { FaVenusMars } from "react-icons/fa";
import { FaTrophy } from "react-icons/fa";
import { FaBirthdayCake } from "react-icons/fa";
import { useCoverflowAnimation } from "../../../hooks/useCoverflowAnimation";

interface IconItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
}

const CarouselMenu: React.FC = () => {
  const iconItems: IconItem[] = [
    { icon: GiMicrochip, label: "Microchip", id: "microchip" },
    { icon: BsPostcard, label: "Name", id: "name" },
    { icon: FaVenusMars, label: "Sex", id: "sex" },
    { icon: FaTrophy, label: "Reward", id: "reward" },
    { icon: FaBirthdayCake, label: "Birthday", id: "birthday" },
  ];

  const {
    getItemStyle,
    pause,
    resume,
    isPlaying
  } = useCoverflowAnimation({
    items: iconItems,
    autoPlaySpeed: 3000,
    pauseOnHover: true
  });

  return (
    <div className="w-full bg-black py-12 overflow-hidden">
      <div 
        className="relative h-32 flex items-center justify-center"
        style={{ perspective: '1000px' }}
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        <div className="relative flex items-center justify-center w-full">
          {iconItems.map((item, index) => {
            const IconComponent = item.icon;
            const style = getItemStyle(index);
            
            return (
              <div
                key={`${item.id}-${index}`}
                className="absolute flex flex-col items-center justify-center transition-all duration-700 ease-in-out cursor-pointer"
                style={{
                  transform: style.transform,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                  transformStyle: 'preserve-3d'
                }}
              >
                <button className="flex flex-col items-center justify-center p-4 text-white hover:text-yellow-400 transition-colors duration-300 min-w-[120px]">
                  <IconComponent className="text-4xl mb-2" />
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CarouselMenu;
