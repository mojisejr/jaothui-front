import React, { ReactNode, useEffect } from "react";
import Layout from "../../components/Layouts";
import { useStore } from "../../contexts/storeContext";
import { RiCloseCircleFill } from "react-icons/ri";
import Link from "next/link";

const Cancel = () => {
  const { clearCart } = useStore();
  useEffect(() => {
    localStorage.clear();
    clearCart();
  }, []);

  return (
    <Layout>
      <CancelContainer>
        <div className="hero">
          <div className="hero-content flex flex-col text-center">
            <RiCloseCircleFill className="text-error" size={150} />
            <div className="text-3xl font-bold">Opps!</div>
            <div className="font-bold text-error">Payment Canceled</div>
            <p>
              We{"'"}re sorry to hear that you{"'"}d like to cancel your
              purchase. please contact our customer support team at
              jaothui@gmail.com. We{"'"}
              ll assist you promptly.
            </p>
            <Link className="btn btn-outline" href="/">
              Back
            </Link>
          </div>
        </div>
      </CancelContainer>
    </Layout>
  );
};

interface SuccessContainerProps {
  children: ReactNode;
}

const CancelContainer = ({ children }: SuccessContainerProps) => {
  return <div className="min-h-screen px-3 py-6">{children}</div>;
};

export default Cancel;
