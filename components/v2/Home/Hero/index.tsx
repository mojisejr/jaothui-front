import { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
}
const Hero = ({ children }: HeroProps) => {
  return (
    <>
      <div className="hero min-h-[85vh] bg-[#000]">{children}</div>
    </>
  );
};

export default Hero;
