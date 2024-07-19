import React, { useState } from "react";
import Image from "next/image";
import { Member } from "../../interfaces/Profile/Member";
import BitkubDisconnectButton from "../Shared/BitkubNextDiscon";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useBitkubNext } from "../../contexts/bitkubNextContext";

const NftHolderProfileCard = () => {
  const { walletAddress: wallet } = useBitkubNext();
  const [copied, setCopied] = useState<{ copied: boolean }>({ copied: false });

  return (
    <div className="relative card glass bg-primary w-84 p-4 min-h-[200px]">
      <div className="absolute -right-3 top-3 z-[-1] opacity-40">
        <Image src="/images/thuiLogo.png" width={200} height={200} alt="logo" />
      </div>
      <div className="grid grid-cols-6 w-full h-full">
        <div className="col-span-4">
          <div className="p-2 grid grid-cols-1 gap-1">
            {/* {member.name} */}
            NFT Holder
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {`${wallet.slice(0, 6)}...${wallet.slice(38)}`}
              </span>
              <CopyToClipboard
                text={wallet}
                onCopy={() => setCopied({ copied: true })}
              >
                <button
                  disabled={copied.copied}
                  className="btn btn-xs text-[8px]"
                >
                  {copied.copied ? "Copied" : "Copy"}
                </button>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="avatar">
            <div className="ring-[#eee] ring-offset-primary w-24 rounded-full ring ring-offset-1">
              <Image
                src={"/images/herov2.png"}
                width={1000}
                height={700}
                alt={"logo"}
              />
            </div>
          </div>
        </div>
        <div className="col-span-4 p-2">
          {/* <div>จำนวนควาย</div>
          <div>{member.Certificate.length} ตัว</div> */}
        </div>
        <div className="col-span-2 flex justify-center items-center my-2">
          <BitkubDisconnectButton />
        </div>
      </div>
    </div>
  );
};

export default NftHolderProfileCard;
