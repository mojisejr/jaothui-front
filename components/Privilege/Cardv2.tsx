import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePrivilege } from "../../contexts/privilegeContext";

interface PrivilegeCardV2Props {
  _id: string;
  title: string;
  thumbnailImage?: string;
  description?: string;
  point: number;
}

const PrivilegeCardV2 = ({
  _id,
  title,
  description,
  thumbnailImage,
  point,
}: PrivilegeCardV2Props) => {
  const { openRedeemDetailDialog } = usePrivilege();
  return (
    <div className="card card-side bg-base-100 shadow-xl">
      <div className="p-1 flex justify-center items-center">
        <figure className="w-36 rounded-2xl overflow-hidden">
          {thumbnailImage == undefined ? (
            <Image
              src="/images/hiddenThui.jpeg"
              width={1000}
              height={1000}
              alt={title}
            />
          ) : (
            <Image
              src={thumbnailImage}
              width={1000}
              height={1000}
              alt={title}
            />
          )}
        </figure>
      </div>

      <div className="card-body">
        <div className="space-y-1">
          <h2 className="text-md font-bold">{title}</h2>
          <p className="text-xs">{description}</p>
          <div>
            <div className="text-xs font-semibold">Accept:</div>
            <div className="flex gap-2 items-center">
              <figure className="w-6">
                <Image
                  src="/images/icons/JAOTHUI-POINT.png"
                  alt="jaothui-point"
                  width={1000}
                  height={1000}
                />
              </figure>
              <div className="text-xs font-semibold">{point}</div>
            </div>
          </div>
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-sm"
            onClick={() =>
              openRedeemDetailDialog({
                _id,
                name: title,
                description: description!,
                image: thumbnailImage!,
                point,
              })
            }
          >
            Detail
          </button>
          {/* <Link className="btn btn-primary btn-sm" href="#">
            view details
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default PrivilegeCardV2;
