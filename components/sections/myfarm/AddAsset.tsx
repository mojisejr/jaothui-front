import { useState, useRef, SyntheticEvent, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNewAsset } from "../../../contexts/newAssetContext";
import { useFarm } from "../../../hooks/useFarm";

import Select from "react-select";
import axios from "axios";

import { AiFillCloseSquare } from "react-icons/ai";
import { toast } from "react-toastify";
import { useAddAsset } from "../../../hooks/useAddAsset";

type FormData = {
  name: string;
  id: number;
  birthday: Date;
  sex: string;
  fatherId?: string;
  motherId?: string;
  height: number;
  color: string;
  detail: string;
};

const options = [
  { value: "female", label: "♀︎ Female" },
  { value: "male", label: "♂︎ Male" },
];

export interface FarmProps {
  farmId: number;
}

const AddAsset = ({ farmId }: FarmProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { close, open, isOpen } = useNewAsset();
  const { adding, added, newAsset } = useAddAsset();
  const { refetchFarm } = useFarm();

  useEffect(() => {
    if (added) {
      refetchFarm();
      reset();
    }
  }, [added]);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = handleSubmit(async (data) => {
    newAsset({
      farmId: farmId,
      data: {
        microchip: data.id.toString(),
        name: data.name,
        sex: data.sex,
        height: +data.height,
        color: data.color,
        details: data.detail,
        motherId:
          data.motherId?.toString()! == "" ? null : data.motherId?.toString()!,
        fatherId:
          data.fatherId?.toString()! == "" ? null : data.fatherId?.toString()!,
        birthday: new Date(data.birthday).toISOString(),
      },
    });
    // setLoading(true);
    // if (farmId) {
    //   axios
    //     .post(`/api/buffalo/${farmId}`, data)
    //     .then(() => {
    //       setLoading(false);
    //       toast.success("Add Asset Successfully!");
    //       refetchFarm();
    //       reset();
    //     })
    //     .catch((error) => {
    //       setLoading(false);
    //       toast.error("Add Asset Failed!");
    //       refetchFarm();
    //     });
    // }
  });

  function onClose(e: SyntheticEvent) {
    e.preventDefault();
    closeModal();
  }

  function closeModal() {
    const backdrop = modalRef.current!.parentNode?.parentElement;
    const form = modalRef.current!;
    if (backdrop?.classList.contains("backdrop")) {
      backdrop.classList.add("hidden");
      form.classList.add("hidden");
      close();
    }
  }

  function openModal() {
    const backdrop = modalRef.current!.parentNode?.parentElement;
    const form = modalRef.current!;
    if (backdrop?.classList.contains("backdrop")) {
      backdrop.classList.remove("hidden");
      backdrop.classList.add("fixed");
      form.classList.remove("hidden");
      form.classList.add("block");
      open();
    }
  }

  useEffect(() => {
    if (isOpen) {
      openModal();
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      className="modal relative min-w-[300px] max-w-[800px] max-h-[700px] overflow-y-auto bg-thuigray p-[20px] rounded-md
      shadow-[0px_13px_27px_-5px_rgba(0,0,0,0.60)] 
    "
    >
      <div className="flex justify-between pb-2">
        <div className="text-thuiwhite text-2xl underline">ADD NEW ASSET</div>
        <button
          className="text-thuiyellow
        hover:text-thuiwhite"
          onClick={(e) => onClose(e)}
        >
          <AiFillCloseSquare size={30} />
        </button>
      </div>

      <form
        className="grid grid-cols-2 gap-2 text-thuiyellow"
        onSubmit={onSubmit}
      >
        <div>Name: </div>
        <input
          className="p-2 rounded-md"
          type="text"
          {...register("name")}
          required
        ></input>
        <div>Id: </div>
        <input
          className="p-2 rounded-md"
          type="number"
          {...register("id")}
          required
        ></input>
        <div>Birthday:</div>
        <input
          className="p-2 rounded-md"
          type="date"
          {...register("birthday")}
          required
        ></input>
        <div>Sex: </div>
        <Select
          options={options}
          onChange={(e: any) => setValue("sex", e.value)}
          required
        />
        <div>Father ID:</div>
        <input
          className="p-2 rounded-md"
          type="number"
          {...register("fatherId")}
        ></input>
        <div>Mother ID:</div>
        <input
          className="p-2 rounded-md"
          type="number"
          {...register("motherId")}
        ></input>
        <div>Height: </div>
        <input
          className="p-2 rounded-md"
          type="number"
          {...register("height")}
          required
        ></input>
        <div>Color: </div>
        <input
          className="p-2 rounded-md"
          type="text"
          {...register("color")}
          required
        ></input>
        <div>Detail: </div>
        <textarea
          className="p-2 rounded-md resize-none"
          {...register("detail")}
          rows={5}
        ></textarea>
        <div className="col-span-2 flex justify-end gap-2">
          <button
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
              hover:bg-thuiyellow"
            type="submit"
          >
            Save
          </button>
          <button
            className="flex items-center gap-2 text-thuiyellow p-2 bg-thuiwhite rounded-md
              hover:bg-thuidark"
            type="reset"
          >
            Reset
          </button>
        </div>
        {adding ? <LoadingOnAdding /> : null}
      </form>
    </div>
  );
};

function LoadingOnAdding() {
  return (
    <div className="absolute top-0 left-0 w-full h-[900px] bg-thuidark bg-opacity-80 flex justify-center itmes-center overflow-hidden">
      <div className="text-thuiwhite flex flex-col items-center justify-center">
        <div>Saving ..</div>
        <div>Do not closed this page until it finished saving</div>
      </div>
    </div>
  );
}

export default AddAsset;
