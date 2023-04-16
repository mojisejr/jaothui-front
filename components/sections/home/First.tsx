import BuyBox from "../../BuyBox";
import Title from "../../Title";

const FirstSection = () => {
  return (
    <div
      className="relative w-full h-full bg-thuiyellow flex justify-center z-50 
    tabletS:h-[600px]
    tabletM:h-[700px]
    labtop:h-screen
    "
    >
      <div className="mt-[10%]">
        <Title />
        <BuyBox />
      </div>
    </div>
  );
};

export default FirstSection;
