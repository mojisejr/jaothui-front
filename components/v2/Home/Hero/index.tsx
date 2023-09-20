import { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
}
const Hero = ({ children }: HeroProps) => {
  return (
    <>
      <div className="min-h-screen bg-[#000]">{children}</div>
    </>
  );
};

export default Hero;
