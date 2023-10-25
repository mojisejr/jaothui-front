import React from "react";
import RedeemCard from "./RedeemCard";
import { useForm, SubmitHandler } from "react-hook-form";
import { IPrivilege } from "../../interfaces/Privilege/privilege";
import { useGetJaothui } from "../../blockchain/JaothuiNFT/read";
import Loading from "../Shared/Indicators/Loading";

type RedeemData = {
  selectedToken: number;
  selectedOption: string;
};

interface MultipleRedeemCardProps {
  privilege: IPrivilege;
}

const MultipleRedeemCard = ({ privilege }: MultipleRedeemCardProps) => {
  const { tokens, loadingTokens } = useGetJaothui();

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RedeemData>();

  const handleRedemption: SubmitHandler<RedeemData> = (redeemData) => {
    console.log(redeemData);
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
              className="select select-bordered w-full max-w-xs"
              {...register("selectedToken")}
            >
              <option disabled selected>
                {loadingTokens ? <Loading size="sm" /> : "Select Your NFT"}
              </option>
              {loadingTokens ? (
                <Loading size="sm" />
              ) : (
                <>
                  {tokens?.map((token) => (
                    <option key={token}>Jaothui #{token}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <div className="divider">Select Options</div>
            <select className="select select-bordered w-full max-w-xs">
              <option disabled selected>
                Select Options
              </option>
              {privilege.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Redeem
          </button>
        </form>
      </RedeemCard>
    </>
  );
};

export default MultipleRedeemCard;
