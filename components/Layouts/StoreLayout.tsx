import Layout from ".";
import { ReactNode } from "react";

interface StoreLayoutProps {
  children: ReactNode;
  heroImage: string;
  title: string;
  subTitle?: string;
  smallTitle?: string;
}

const StoreLayout = ({
  children,
  heroImage,
  title,
  subTitle,
  smallTitle,
}: StoreLayoutProps) => {
  return (
    <div className="relative">
      <Layout>
        <div className="relative">
          <img className="w-full" src={`${heroImage}`} alt="hero"></img>
          <div className="absolute bottom-4 px-2 py-2 tabletM:bottom-10">
            <div className="text-5xl text-base-200 tabletM:text-[5rem]">
              {title}
            </div>
            <div className="text-5xl font-bold text-primary tabletM:text-[5rem]">
              {subTitle}
            </div>
            <div className="font-bold text-thuiwhite tabletM:text-4xl">
              {smallTitle}
            </div>
          </div>
        </div>
        {children}
      </Layout>
    </div>
  );
};

export default StoreLayout;
