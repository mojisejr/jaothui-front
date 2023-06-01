import { FunctionComponent, PropsWithChildren } from "react";

const ModalBackdrop: FunctionComponent<PropsWithChildren> = ({ children }) => {
  return (
    <div
      className="backdrop fixed top-0 left-0 w-screen h-full bg-thuidark z-[50] bg-opacity-80 hidden"
      id="blackdrop"
    >
      {children}
    </div>
  );
};

export default ModalBackdrop;
