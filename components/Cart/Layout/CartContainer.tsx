import { ReactNode } from "react";

interface CartContainerProp {
  children: ReactNode;
}

const CartContainer = ({ children }: CartContainerProp) => {
  return <div className="min-h-screen px-6 py-5">{children}</div>;
};

export default CartContainer;