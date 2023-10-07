import { ReactNode } from "react";

interface CartContainerProp {
  children: ReactNode;
}

const CartContainer = ({ children }: CartContainerProp) => {
  return (
    <div
      className="px-6 py-5 
  tabletS:flex 
  tabletS:justify-center"
    >
      {children}
    </div>
  );
};

export default CartContainer;
