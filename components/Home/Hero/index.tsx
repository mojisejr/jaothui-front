import { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
}
const Hero = ({ children }: HeroProps) => {
  return (
    <>
      <div
        className="tabletS:min-h-[60vh]
      tabletS:flex
      tabletS:items-center
      tabletS:px-10
      labtop:px-20
      bg-[#000]"
      >
        {children}
      </div>
    </>
  );
};
// tabletS:items-center
// tabletS:px-6"

// mobileM:flex
// mobileM:items-center
// mobileM:-mt-20

export default Hero;
