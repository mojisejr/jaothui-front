import { useState, useEffect } from "react";
import { AddressPayload } from "@medusajs/medusa";
import { useForm } from "react-hook-form";
import { useStore } from "../../../contexts/storeContext-medusa";
import { useCart } from "medusa-react";

import {
  getProvinces,
  getAmphoeFromProvince,
} from "../../../helpers/store/addressHelper";
import CheckoutV2 from "../Card/Checkoutv2";

const ShippingForm = () => {
  const { updateShippingAddress, currentCart, isLoading } = useStore();
  const [{ province }, setAddress] = useState<{
    province?: string;
  }>({
    province: undefined,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressPayload>();

  useEffect(() => {
    const subscription = watch(({ province }) => {
      setAddress({ province });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    // startCheckout.mutate();
  }, []);

  const onSubmit = (addressData: AddressPayload) => {
    updateShippingAddress(addressData);
  };

  return (
    <>
      <form
        className="flex flex-col justify-center gap-1"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="form-control">
          <label className="label" htmlFor="first_name">
            <span className="label-text">firstname</span>
          </label>
          <input
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="input input-bordered w-full max-w-md disabled:opacity-50"
            id="first_name"
            type="text"
            placeholder="firstname"
            aria-invalid={errors.first_name ? "true" : "false"}
            {...register("first_name", { required: true, maxLength: 30 })}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="last_name">
            <span className="label-text">lastname</span>
          </label>
          <input
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="input input-bordered w-full max-w-md disabled:opacity-50"
            id="last_name"
            type="text"
            placeholder="lastname"
            aria-invalid={errors.last_name ? "true" : "false"}
            {...register("last_name", { required: true, maxLength: 30 })}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="address_1">
            <span className="label-text">address 1</span>
          </label>
          <input
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="input input-bordered w-full max-w-md disabled:opacity-50"
            id="address_1"
            type="text"
            placeholder="address eg.(13/99 tambon ...)"
            aria-invalid={errors.address_1 ? "true" : "false"}
            {...register("address_1", { required: true })}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="province">
            <span className="label-text">province</span>
          </label>
          <select
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="select-bordered select max-w-md disabled:opacity-50"
            aria-invalid={errors.province ? "true" : "false"}
            required
            // disabled={}
            {...register("province", { required: true })}
          >
            <option disabled selected>
              เลือก
            </option>
            {getProvinces().map((p, index) => (
              <option key={index} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label htmlFor="address_2" className="label">
            <span className="label-text">amphoe</span>
          </label>
          <select
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="select-bordered select max-w-md disabled:opacity-50"
            required
            {...register("address_2", { required: true })}
          >
            <option disabled selected>
              เลือก
            </option>
            {getAmphoeFromProvince(province!).map((p, index) => (
              <option key={index} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="postcode">
            <span className="label-text">postcode</span>
          </label>
          <input
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="input input-bordered w-full max-w-md disabled:opacity-50"
            id="postcode"
            type="number"
            placeholder="postcode"
            aria-invalid={errors.postal_code ? "true" : "false"}
            {...register("postal_code", { required: true })}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="phone">
            <span className="label-text">phone</span>
          </label>
          <input
            disabled={isLoading || currentCart?.payment_sessions.length! > 0}
            className="input input-bordered w-full max-w-md disabled:opacity-50"
            id="phone"
            type="number"
            placeholder="phone"
            aria-invalid={errors.phone ? "true" : "false"}
            {...register("phone", { required: true })}
          />
        </div>
        {currentCart?.payment_sessions.length! <= 0 ? (
          <button className="btn btn-primary mt-2 " type="submit">
            Checkout
          </button>
        ) : (
          <CheckoutV2 />
        )}
      </form>
    </>
  );
};

export default ShippingForm;
