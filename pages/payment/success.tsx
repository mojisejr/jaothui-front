import React, { ReactNode, useEffect } from "react";
import Layout from "../../components/Layouts";
import { useStore } from "../../contexts/storeContext";
import { BsCheckCircleFill } from "react-icons/bs";
import Link from "next/link";
import { trpc } from "../../utils/trpc";
import { useRouter } from "next/router";

const test =
  "cs_test_a1xl3z3O4Pjw5lFqWe5qxtiJ8ATkJqYzzYk9nMf6xS25gq48ojyXyLl6oB";

const Success = () => {
  const {
    isLoading,
    isSuccess,
    mutate: createOrder,
  } = trpc.store.createOrder.useMutation();

  const { query } = useRouter();

  console.log(query);

  const { clearCart } = useStore();
  useEffect(() => {
    clearCart();
    if (query.id !== undefined) {
      createOrder({ session: query.id as string });
    }
  }, [query.id]);

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
