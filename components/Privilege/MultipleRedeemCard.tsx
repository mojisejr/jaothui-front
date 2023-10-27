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
  const { data, isLoading, refetch } = trpc.privilege.getUsedTokens.useQuery({
    wallet: walletAddress,
    privilegeId: privilege._id! as string,
  });

  const {
    data: redeemedData,
    error,
    isLoading: redeeming,
    isSuccess: redeemed,
    isError: redeemError,
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

  const handleRedeemedSuccess = () => {
    if (redeemed) {
      replace({
        pathname: "/cert/profile/privilege/redeemed",
        query: {
          tokenId: watching.selectedToken,
          image: privilege.image,
          option: watching.selectedOption,
        },
      });
    } 
  }

  const handleRedeemedError = () => {
    if(redeemError) {
      replace({
        pathname: "/cert/profile/privilege/redeem-failed",
        query: {
          tokenId: watching.selectedToken,
          image: privilege.image,
          option: "Token is already claimed!",
          error: true,
        },
      });
    }

  } 

  useEffect(() => {
    refetch();
    if (tokens) {
      filterOutUsedToken(tokens!, data); 
    }
  }, [tokensLoaded, isLoading, tokens, redeemed, redeemError]);

  useEffect(() => {
    handleRedeemedSuccess();
    handleRedeemedError(); 
  }, [redeemed, redeemError]);

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

    // console.log(submittingData);

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
            <div className="divider">Select Options</div>
            <div className="h-[80px] overflow-y-auto">
            { privilege.options?.map((option) => (
              <div key={option.option} className="form-control">
                <label className="cursor-pointer label">  
                  <img src={option.image} className="w-24" />
                  <div>{option.option}</div>
                  <input type="radio" className="radio checked:bg-primary" value={option.option} {...register("selectedOption")} />
                </label>
              </div>
          ))}

          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              redeeming ||
              redeemed ||
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
