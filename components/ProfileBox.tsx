import Link from "next/link";
import Image from "next/image";
import { FaArrowCircleLeft } from "react-icons/fa";
import { IMetadata } from "../interfaces/iMetadata";
import { useAccount } from "wagmi";

export interface ProfileBoxProps {
  certNft: IMetadata;
}

const ProfileBox = ({ certNft }: ProfileBoxProps) => {
  const { isConnected } = useAccount();

  if (Object.keys(certNft).length === 0) {
    return (
      <div className="h-screen flex flex-col justify-center items-center gap-[20px]">
        <div className="text-xl">Not Found ..</div>
        <div>
          <Link
            href={isConnected ? "/cert" : "/"}
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
    <div className="m-10" id="container">
      <div
        className="bg-thuigray text-thuiwhite grid grid-cols-1 rounded-md pr-10 pl-10 pt-5 pb-5 gap-5
          shadow-xl
          tabletM:pt-10
          tabletM:pb-10
          tabletM:w-[600px]
          desktop:pt-10
          desktop:pb-10
          desktop:w-[800px]"
        id="inner"
      >
        <div
          className="text-center text-xl
            tabletM:text-2xl
          desktop:text-3xl"
          id="title"
        >
          #{certNft.attributes![0].value}
        </div>
        <div className="flex justify-center">
          <Image
            className="w-[250px] max-w-[350px] rounded-md border-[2px] border-thuiyellow border-opacity-[50%]
              tabletS:w-[400px]
              "
            src={certNft.image!}
            width={400}
            height={400}
            alt={"image"}
          />
        </div>
        <div
          className="flex text-sm justify-center 
            tabletM:text-2xl 
            desktop:text-3xl"
          id="content-wrapper"
        >
          <ul>
            <li className="grid grid-cols-2">
              <div id="topic">Name:</div>
              <div id="content">{certNft.name}</div>
              <div id="topic">ID:</div>
              <div id="content">{certNft.attributes![0].value}</div>
              <div id="topic">CertNo:</div>
              <div id="content">{certNft.attributes![5].value}</div>
              <div id="topic">Birthday:</div>
              <div id="content">
                {new Date(
                  (certNft.attributes![2].value as number) * 1000
                ).toLocaleDateString()}
              </div>
              <div id="topic">MotherId:</div>
              <div id="content">
                {certNft.attributes![3].value == "0"
                  ? "N/A"
                  : certNft.attributes![3].value}
              </div>
              <div id="topic">FatherId:</div>
              <div id="content">
                {certNft.attributes![4].value == "0"
                  ? "N/A"
                  : certNft.attributes![4].value}
              </div>
              <div id="topic">Origin:</div>
              <div id="content">{certNft.attributes![6].value}</div>
              <div id="topic">Height:</div>
              <div id="content">{certNft.attributes![1].value} cm.</div>
              <div id="topic">Color:</div>
              <div id="content">{certNft.attributes![7].value}</div>
              <div id="topic">Detail:</div>
              <div id="content">{certNft.attributes![8].value}</div>
              <div id="topic">Reward:</div>
              <div id="content" className="flex">
                N/A
              </div>
              <div id="topic">Created:</div>
              <div id="content" className="flex">
                {(certNft.attributes![9].value as number) <= 0
                  ? "N/A"
                  : new Date(
                      (certNft.attributes![9].value as number) * 1000
                    ).toLocaleDateString()}
              </div>
              <div id="topic">Updated:</div>
              <div id="content" className="flex">
                {(certNft.attributes![10].value as number) <= 0
                  ? "N/A"
                  : new Date(
                      certNft.attributes![10].value
                    ).toLocaleDateString()}
              </div>
            </li>
          </ul>
        </div>
        <div className="flex justify-end">
          <Link
            href={isConnected ? "/cert/profile/mycert" : "/cert"}
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

export default ProfileBox;