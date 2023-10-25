import React, { useEffect, useState } from "react";
import RedeemCard from "./RedeemCard";
import { useForm, SubmitHandler } from "react-hook-form";
import { IPrivilege } from "../../interfaces/Privilege/privilege";
import { useGetJaothui } from "../../blockchain/JaothuiNFT/read";
import Loading from "../Shared/Indicators/Loading";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { trpc } from "../../utils/trpc";
import { useRouter } from "next/router";
import dayjs from "dayjs";

type RedeemData = {
  selectedToken: string;
  selectedOption: string;
};

interface MultipleRedeemCardProps {
  privilege: IPrivilege;
}

const MultipleRedeemCard = ({ privilege }: MultipleRedeemCardProps) => {
  const { replace } = useRouter();
  const { walletAddress } = useBitkubNext();
  const { tokens, loadingTokens, tokensLoaded } = useGetJaothui();
  const { data, isLoading } = trpc.privilege.getUsedTokens.useQuery({
    wallet: walletAddress,
    privilegeId: privilege._id! as string,
  });

  const {
    data: redeemedData,
    isLoading: redeeming,
    isSuccess: redeemed,
    mutate: redeem,
  } = trpc.privilege.redeem.useMutation();

  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  const filterOutUsedToken = (inWallet: string[], inDB: string[]) => {
    let db = inDB == undefined ? [] : inDB;
    if (inWallet == undefined) {
      setAvailableTokens([]);
      return;
    }
    if (inWallet.length <= 0) {
      setAvailableTokens([]);
      return;
    } else {
      const reMapped = inWallet.filter((token) => !db.includes(token));
      setAvailableTokens(reMapped);
    }
  };

  useEffect(() => {
    if (tokens) {
      filterOutUsedToken(tokens!, data);
    }
  }, [tokensLoaded, isLoading, tokens, redeemed]);

  useEffect(() => {
    if (redeemed) {
      replace({
        pathname: "/cert/profile/privilege/[tokenId]/[opiton]",
        query: {
          tokenId: watching.selectedToken,
          option: watching.selectedOption,
        },
      });
    }
  }, [redeemed]);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RedeemData>();

  const watching = watch();

  const handleRedemption: SubmitHandler<RedeemData> = (redeemData) => {
    const submittingData = {
      wallet: walletAddress as string,
      tokenId: redeemData.selectedToken,
      redeemInfo: redeemData.selectedOption,
      isRedeemed: true,
      privilege: privilege._id!,
    };

    redeem(submittingData);
  };

  return (
    <>
      <RedeemCard
        title={privilege.name!}
        description={privilege.description!}
        imageUrl={privilege.image!}
      >
        <form
          className="flex flex-col justify-center gap-2"
          onSubmit={handleSubmit(handleRedemption)}
        >
          <div>
            <div className="divider">Select NFT</div>
            <select
              disabled={redeeming}
              className="select select-bordered w-full max-w-xs"
              {...register("selectedToken", { required: true })}
            >
              <option disabled selected>
                {loadingTokens ? <Loading size="sm" /> : "Select Your NFT"}
              </option>
              {loadingTokens ? (
                <Loading size="sm" />
              ) : (
                <>
                  {availableTokens?.map((token) => (
                    <option key={token} value={token}>
                      Jaothui #{token}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <div className="divider">Select Options</div>
            <select
              disabled={redeeming}
              className="select select-bordered w-full max-w-xs"
              {...register("selectedOption", { required: true })}
            >
              <option disabled selected>
                Select Options
              </option>
              {privilege.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              redeeming ||
              watching.selectedOption == "Select Options" ||
              watching.selectedToken == "Select Your NFT" ||
              !dayjs(new Date()).isSame(new Date(privilege.start!), "day")
            }
          >
            {redeeming ? (
              <div className="flex items-center justify-center gap-2">
                <Loading size="sm" /> Redeeming...
              </div>
            ) : (
              <div>
                {!dayjs(new Date()).isSame(new Date(privilege.start!), "day")
                  ? "Coming Soon.."
                  : "Redeem"}
              </div>
            )}
          </button>
        </form>
      </RedeemCard>
    </>
  );
};

export default MultipleRedeemCard;
