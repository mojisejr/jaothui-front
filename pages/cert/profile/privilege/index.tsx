import React from "react";
import Layout from "../../../../components/Layouts";
import PrivilegeCard from "../../../../components/Privilege/Card";
import { trpc } from "../../../../utils/trpc";
import Loading from "../../../../components/Shared/Indicators/Loading";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";
import { IPrivilege } from "../../../../interfaces/Privilege/privilege";
import MultipleRedeemCard from "../../../../components/Privilege/MultipleRedeemCard";

const PrivilegePage = () => {
  const { isConnected } = useBitkubNext();
  const { data, isLoading } = trpc.privilege.get.useQuery();
  const { replace } = useRouter();

  if (!isConnected) {
    replace("/unauthorized");
    return;
  }

  return (
    <Layout>
      <div className="my-10">
        {isLoading && !isConnected ? (
          <div className="h-[80vh] pt-[100px]"><Loading size="lg"/></div>
        ) : (
          <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 labtop:grid-cols-3 desktopM:grid-cols-4 px-2 tabletS:px-10 gap-2 labtop:gap-4">
            {data == undefined
              ? <div className="h-[80vh] pt-[100px]"><Loading size="lg"/></div>
              : data.map((privilege: IPrivilege) => {
                  if (privilege.type == "multiple") {
                    return (
                      <MultipleRedeemCard
                        key={privilege._id}
                        privilege={privilege}
                      />
                    );
                  } else if (privilege.type == "single") {
                    return (
                      <PrivilegeCard key={privilege._id} data={privilege} />
                    );
                  }
                })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrivilegePage;
