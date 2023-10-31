import React, { ReactNode, useEffect } from "react";
import Layout from "../../components/Layouts";
import { useStore } from "../../contexts/storeContext";
import { BsCheckCircleFill } from "react-icons/bs";
import Link from "next/link";

const Success = () => {
  const { clearCart } = useStore();
  useEffect(() => {
    clearCart();
  }, []);

  return (
    <Layout>
      <SuccessContainer>
        <div className="hero">
          <div className="hero-content flex flex-col text-center">
            <BsCheckCircleFill className="text-[#00dd33]" size={150} />
            <div className="text-3xl font-bold">Thank you !</div>
            <div className="font-bold text-[#00dd33]">
              🎉 Payment Successful 🎉
            </div>
            <p>
              Congratulations on your successful purchase! We{"'"}re thrilled to
              have you as our valued customer. Please anticipate your order{"'"}
              s arrival within the 👉 next 3-7 days. Thank you for choosing us!
            </p>
            <Link className="btn btn-outline" href="/">
              Back
            </Link>
          </div>
        </div>
      </SuccessContainer>
    </Layout>
  );
};

interface SuccessContainerProps {
  children: ReactNode;
}

const SuccessContainer = ({ children }: SuccessContainerProps) => {
  return <div className="min-h-screen px-3 py-6">{children}</div>;
};

export default Success;
