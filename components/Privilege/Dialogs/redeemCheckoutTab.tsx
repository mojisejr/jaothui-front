import Image from "next/image";
import React, { useEffect, useState } from "react";
import { usePrivilege } from "../../../contexts/privilegeContext";
import { useForm } from "react-hook-form";
import {
  getAmphoeFromProvince,
  getDistrictsFromAmphoe,
  getProvinces,
} from "../../../helpers/store/addressHelper";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import Loading from "../../Shared/Indicators/Loading";

export type CheckoutInputType = {
  name: string;
  tel: string;
  address: string;
  district: string;
  amphoe: string;
  province: string;
  zipcode: number;
};

const RedeemCheckoutTab = () => {
  //HOOKS
  const { walletAddress } = useBitkubNext();
  const [{ province, amphoe }, setAddress] = useState<{
    province?: string;
    amphoe?: string;
    district?: string;
  }>({
    province: undefined,
    amphoe: undefined,
    district: undefined,
  });

  const { selectedItem, back, checkout, updatingHistory } = usePrivilege();
  const { register, handleSubmit, reset, watch } = useForm<CheckoutInputType>();

  //HANDLERS
  const submit = handleSubmit((data, event) => {
    event?.preventDefault();
    const fmtData = {
      name: data.name,
      tel: data.tel,
      address: `${data.address} ${data.amphoe} ${data.district} ${data.province} ${data.zipcode}`,
      wallet: walletAddress,
      redeemItem: selectedItem?._id!,
      timestamp: new Date(),
    };

    checkout(fmtData);
  });

  //EFFECTs
  useEffect(() => {
    const subscription = watch(({ province, amphoe, district }) => {
      setAddress({ province, amphoe, district });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <div>
      <div className="flex flex-col gap-2 items-center">
        <div className="text-xl font-bold">Redemption Checkout</div>
        <figure className="w-20">
          <Image
            src="/images/icons/JAOTHUI-POINT.png"
            width={1000}
            height={1000}
            alt="jaothui-point"
          />
        </figure>
        <div className="font-bold">USE {selectedItem?.point} POINTS</div>
        <div>
          <form onSubmit={submit} className="grid grid-cols-1 gap-1">
            <div className="form-control">
              <input
                className="input-bordered  input input-sm w-full max-w-xs rounded-full"
                placeholder="name"
                {...register("name", { required: true })}
              ></input>
            </div>
            <div className="form-control">
              <input
                className="input-bordered  input input-sm w-full max-w-xs rounded-full"
                placeholder="mobile/phone number"
                {...register("tel", { required: true })}
              ></input>
            </div>
            <div className="form-control w-full max-w-xs">
              <input
                type="text"
                // disabled={}
                {...register("address", { required: true })}
                placeholder="address"
                className="input-bordered  input input-sm w-full max-w-xs rounded-full"
              />
            </div>
            <div className="form-control w-full max-w-xs">
              <select
                className="select-bordered  select select-sm rounded-full"
                required
                // disabled={}
                {...register("province", { required: true })}
              >
                <option disabled selected>
                  province
                </option>
                {getProvinces().map((p, index) => (
                  <option key={index} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control w-full max-w-xs">
              <select
                className="select-bordered  select select-sm rounded-full"
                required
                // disabled={}
                {...register("amphoe", { required: true })}
              >
                <option disabled selected>
                  district
                </option>
                {getAmphoeFromProvince(province!).map((p, index) => (
                  <option key={index} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control w-full max-w-xs">
              <select
                className="select-bordered  select select-sm rounded-full"
                required
                // disabled={}
                {...register("district", { required: true })}
              >
                <option disabled selected>
                  sub-district
                </option>
                {getDistrictsFromAmphoe(province!, amphoe!).map((p, index) => (
                  <option key={index} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control w-full max-w-xs">
              <input
                type="number"
                required
                placeholder="zipcode"
                {...register("zipcode", { required: true })}
                className="input-bordered  input input-sm w-full max-w-xs rounded-full"
              />
            </div>
            <button disabled={updatingHistory} type="submit" className="btn">
              {updatingHistory ? <Loading size="lg" /> : "Submit"}
            </button>
            <button
              disabled={updatingHistory}
              onClick={() => back(0)}
              type="button"
              className="btn"
            >
              Back
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RedeemCheckoutTab;
