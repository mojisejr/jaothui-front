import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import Layout from "../../../components/Layouts";
import Loading from "../../../components/Shared/Indicators/Loading";
import PrivilegeLayout from "../../../components/Layouts/PrivilegeLayout";
import { trpc } from "../../../utils/trpc";
import PrivilegeCardV2 from "../../../components/Privilege/Cardv2";
import ItemDetailDialog from "../../../components/Privilege/Dialogs/ItemDetailDialog";

const PrivilegePage = () => {
  //HOOKs
  const { walletAddress, isConnected } = useBitkubNext();
  const { replace } = useRouter();

  //TRPC
  const { data: items, isLoading: itemLoading } =
    trpc.privilege.getAllJaothuiRedeemItems.useQuery();

  //EFFECTs
  useEffect(() => {
    if (!isConnected) {
      void replace("/profile");
    }
  }, [isConnected]);

  if (!walletAddress && isConnected) {
    return (
      <Layout>
        <div className="mt-[100px] w-full flex justify-center">
          <Loading size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      {isConnected ? (
        <PrivilegeLayout>
          {itemLoading ? (
            <Loading size="lg" />
          ) : (
            <div className="flex flex-col gap-2">
              {items!.map(
                (
                  item: {
                    _id: string;
                    name: string;
                    image: string | undefined;
                    description: string | undefined;
                    point: number;
                  },
                  index: React.Key | null | undefined
                ) => (
                  <>
                    <PrivilegeCardV2
                      _id={item._id}
                      key={index}
                      title={item.name}
                      thumbnailImage={item.image}
                      description={item.description}
                      point={item.point}
                    />
                  </>
                )
              )}
            </div>
          )}
          <ItemDetailDialog />
        </PrivilegeLayout>
      ) : (
        <Layout>
          <div className="mt-[100px] w-full flex justify-center">
            <Loading size="lg" />
          </div>
        </Layout>
      )}
    </>
  );
};

export default PrivilegePage;
