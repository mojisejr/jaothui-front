import Header from "../components/Header";
import CollectionV2 from "../components/sections/cert/CollectionV2";
import CertFooter from "../components/sections/cert/CertFooter";
import { useMenu } from "../hooks/menuContext";
import MenuModal from "../components/MenuModal";

const NotFoundPage = () => {
  const { isOpen } = useMenu();
  return (
    <>
      <Header />
      <div
        className={`w-full h-screen p-3 flex  justify-center items-start
        bg-thuiyellow
      tabletS:p-[30px]
      tabletM:p-[60px]
      
     `}
      >
        <div
          id="profile-container"
          className="max-w-[1200px] p-20 flex flex-col items-center"
        >
          <div className="text-[35px] font-bold">NOT FOUND!</div>
          <div>Sorry no page found.</div>
        </div>
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default NotFoundPage;
