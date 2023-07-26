import Link from "next/link";
import { FaArrowCircleLeft } from "react-icons/fa";
import { TiTick } from "react-icons/ti";
import { RxCrossCircled } from "react-icons/rx";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { Buffalo } from "../../../interfaces/MyFarm/iBuffalo";

export interface BuffaloDetailProps {
  certNft: Buffalo;
}

const BuffaloDetail = ({ certNft }: BuffaloDetailProps) => {
  const { isConnected } = useBitkubNext();

  if (Object.keys(certNft).length === 0) {
    return (
      <div
        className="h-screen flex flex-col justify-center items-center gap-[20px]
      "
      >
        <div className="text-xl">Not Found ..</div>
        <div>
          <Link
            href={isConnected ? "/cert/profile/myfarm" : "/"}
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
              hover:bg-thuiyellow"
          >
            <FaArrowCircleLeft />
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="m-3 flex flex-col gap-2" id="container">
      <div
        className="relative bg-thuigray text-thuiwhite grid grid-cols-1 rounded-md pr-10 pl-10 pt-5 pb-5 gap-5
        border-[1px] border-thuiyellow
        shadow-[0px_13px_27px_-5px_rgba(0,0,0,0.60)]
          tabletM:pt-10
          tabletM:pb-10
          tabletM:w-[600px]
          desktop:pt-10
          desktop:pb-10
          desktop:w-[800px]"
        id="inner"
      >
        <div
          id="card-hole"
          className="absolute top-3 right-3 w-[25px] h-[25px] bg-thuiyellow rounded-[200px]
        shadow-[inset_-2px_2px_2px_1px_rgba(0,0,0,0.30)]
        "
        ></div>
        <div
          className="text-center text-xl
            tabletM:text-2xl
          desktop:text-3xl"
          id="title"
        >
          #{certNft.microchip}
        </div>
        <div
          className="flex text-sm justify-center 
            tabletM:text-2xl 
            desktop:text-3xl"
          id="content-wrapper"
        >
          <ul>
            <li className="grid grid-cols-2 gap-3">
              <div id="topic">Name:</div>
              <div id="content">{certNft.name}</div>
              <div id="topic">ID:</div>
              <div id="content">{certNft.microchip}</div>
              <div id="topic">Birthday:</div>
              <div id="content">
                {new Date(certNft.birthday).toLocaleDateString()}
              </div>
              <div id="topic">Sex:</div>
              <div id="content">{certNft.sex}</div>
              <div id="topic">MotherId:</div>
              <Link href="#" id="content">
                {certNft.motherId == null ? "N/A" : certNft.motherId}
              </Link>
              <div id="topic">FatherId:</div>
              <Link href="#" id="content">
                {certNft.fatherId == null ? "N/A" : certNft.fatherId}
              </Link>
              <div id="topic">Height:</div>
              <div id="content">{certNft.height} cm.</div>
              <div id="topic">Color:</div>
              <div id="content">{certNft.color}</div>
              <div id="topic">Ovulation:</div>
              <div id="content">
                {certNft.ovulation ? (
                  <TiTick className="text-[#00ff00]" size={30} />
                ) : (
                  <RxCrossCircled className="text-[#ff0000]" size={30} />
                )}
              </div>
              <div id="topic">Pregant:</div>
              <div id="content">
                {certNft.pregnant ? (
                  <div className="flex items-center gap-2">
                    <TiTick className="text-[#00ff00]" size={30} />
                    {certNft.fertilization == undefined
                      ? null
                      : `${certNft.fertilization.map((f) => {
                          if (f.preg !== undefined) {
                            return new Date(f.preg).toLocaleDateString();
                          }
                        })}`}
                  </div>
                ) : (
                  <RxCrossCircled className="text-[#ff0000]" size={30} />
                )}
              </div>
              <div id="topic">Detail:</div>
              <p id="content">
                {certNft.details == "" ? "N/A" : certNft.details}
              </p>
            </li>
          </ul>
        </div>
        <div className="flex justify-end">
          <Link
            href={isConnected ? "/cert/profile/myfarm/list" : "/"}
            // href={"/cert"}
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
            hover:bg-thuiyellow"
          >
            <FaArrowCircleLeft />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuffaloDetail;
