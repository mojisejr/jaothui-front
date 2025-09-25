import { GiMicrochip, GiTrophyCup } from "react-icons/gi";
import { BsPostcard, BsGenderAmbiguous } from "react-icons/bs";
import { FaBirthdayCake, FaDna } from "react-icons/fa";
import { ReactElement } from "react";

interface IconItem {
  icon: ReactElement;
  label: string;
  id: string;
}

const CarouselMenu = (): ReactElement => {
  // Define icon items for better maintainability
  const iconItems: IconItem[] = [
    { icon: <GiMicrochip size={40} />, label: "Microchip", id: "microchip" },
    { icon: <BsPostcard size={40} />, label: "Name", id: "name" },
    { icon: <BsGenderAmbiguous size={40} />, label: "Sex", id: "sex" },
    { icon: <GiTrophyCup size={40} />, label: "Reward", id: "reward" },
    { icon: <FaBirthdayCake size={40} />, label: "Birthday", id: "birthday" },
    { icon: <FaDna size={40} />, label: "GNOME", id: "gnome" },
  ];

  // Duplicate items for seamless infinite loop
  const duplicatedItems: IconItem[] = [...iconItems, ...iconItems];

  return (
    <div className="w-full">
      <div className="marquee-container h-24 flex items-center">
        <div className="marquee-content">
          {duplicatedItems.map((item: IconItem, index: number) => (
            <div
              key={`${item.id}-${index}`}
              className="flex flex-col justify-center items-center min-w-[120px] flex-shrink-0"
            >
              <button 
                className="btn btn-circle btn-lg hover:btn-primary transition-all duration-300 ease-in-out transform hover:scale-110"
                aria-label={`${item.label} button`}
              >
                {item.icon}
              </button>
              <div className="text-sm mt-2 text-center whitespace-nowrap">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselMenu;
