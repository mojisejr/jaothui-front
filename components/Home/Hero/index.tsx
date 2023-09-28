import { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
}
const Hero = ({ children }: HeroProps) => {
  return (
    <>
      <div
        className="min-h-screen bg-[#000] pt-6
      mobileM:flex
      mobileM:items-center
      mobileM:-mt-20
      tabletS:items-center
      tabletS:px-6"
      >
        {children}
      </div>
    </>
  );
};

export default Hero;
