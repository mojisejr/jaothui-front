import React, { SyntheticEvent, useEffect, useState } from "react";
// import { Wheel } from "react-custom-roulette";
import dynamic from "next/dynamic";
const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);

import Image from "next/image";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import BitkubNextConnectButton from "../Shared/BitkubNext";
import { trpc } from "../../utils/trpc";
import Loading from "../Shared/Indicators/Loading";
import { JaothuiProfile } from "../../interfaces/JaothuiProfile/JaothuiProfile";
import { ImSpinner11 } from "react-icons/im";

/**
 *
 * TODO:
 * 1. เล่นได้ต่อวัน token ละรอบ จำนวนครั้งขึ้นอยู่กับ Rarity
 * 2. อันนี้เล่นได้หลาย contract เราต้องใส่ props เป็น contract address มา
 * 3. hardcode แต่ละ rarity ว่าเล่นได้กี่ครั้งต่อวัน เพราะมันจะไป update (point) ใน db ของ NFT tokenId นั้น
 * 4. แต่ละครั้งที่ render จะเชคก่อนว่า ใน db มีเหลืออีกกี่ครั้ง แล้วทุกครั้งที่ spin จะต้อง update ด้วยว่าเหล่ือกี่ครั้ง
 * 5. แต่ละครั้งที่ render จะเชคว่าล่าสุด เล่นไปเมื่อไหร่ ถ้าเล่นก่อน เที่ยงคืนของวันก่อนหน้า จะ reset ใหม่เลยไม่สนว่าเหลือกี่ครั้ง
 */

const config = {
  rarity: [
    { name: "Normal", value: 3 },
    { name: "Rare", value: 5 },
    { name: "Super Rare", value: 7 },
    { name: "Super Special Rare", value: 10 },
  ],
};

const data = [
  {
    option: "0",
    style: { backgroundColor: "#333" },
  },
  { option: "1", style: { backgroundColor: "#E3A51D" } },
  {
    option: "0",
    style: { backgroundColor: "#333" },
  },
  { option: "3", style: { backgroundColor: "#E3A51D" } },
  { option: "5", style: { backgroundColor: "#333" } },
  { option: "1", style: { backgroundColor: "#E3A51D" } },
  {
    option: "7",
    style: { backgroundColor: "#333" },
  },
  { option: "3", style: { backgroundColor: "#E3A51D" } },
  {
    option: "10",
    style: { backgroundColor: "#FF3344" },
  },
  { option: "3", style: { backgroundColor: "#E3A51D" } },
  {
    option: "7",
    style: { backgroundColor: "#333" },
  },
  { option: "1", style: { backgroundColor: "#E3A51D" } },
];

interface HotWheelProps {
  contractAddress: string;
  gameId: string;
}

const HotWheel = ({ contractAddress, gameId }: HotWheelProps) => {
  const { rarity } = config;

  //HOOH & STATES
  const { isConnected, walletAddress } = useBitkubNext();
  const [selectedProfile, setSelectedProfile] = useState<JaothuiProfile | null>(
    null
  );
  const [mustSpin, setMustSpin] = useState<boolean>(false);
  const [prizeNumber, setPrizeNumber] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);
  const [count, setCount] = useState<number>(0);
  const [canSpin, setCanSpin] = useState<boolean>(false);

  //TRPC
  const { data: tokens, isLoading: loadingToken } =
    trpc.user.getNFTByContract.useQuery({
      wallet: walletAddress as string,
      contract: contractAddress,
    });

  // const { isLoading: reseting, mutate: reset } =
  //   trpc.game.resetPointByRound.useMutation();

  const {
    data: nftGameData,
    isLoading: loadingNftGameData,
    isSuccess: loadingNftGameDataSuccess,
    mutate: getNftInGame,
  } = trpc.game.getNftInGame.useMutation();

  const {
    data: pointUpdated,
    isLoading: loadingUpdatePoint,
    isSuccess: pointUpdateSuccess,
    mutate: updatePoint,
  } = trpc.game.updatePoint.useMutation();

  const {
    data: spinData,
    isLoading: spinning,
    mutate: spin,
  } = trpc.game.spin.useMutation();

  //EFFECTS
  // useEffect(() => {
  //   reset({
  //     contractAddress: "0x07B2bCc269B100b51AB8598d44AB568C7199C7BC",
  //     gameId: "3fc396c8-b968-46fd-849d-d2243102fe00",
  //   });
  // }, []);
  useEffect(() => {
    const info = rarity.find(
      (r) => r.name == selectedProfile?.attributes[0].value
    );

    if (loadingNftGameDataSuccess) {
      nftGameData.point >= info?.value! ? setCanSpin(false) : setCanSpin(true);
      setCount(nftGameData.point);
    }
  }, [nftGameData]);

  useEffect(() => {
    const info = rarity.find(
      (r) => r.name == selectedProfile?.attributes[0].value
    );
    if (pointUpdateSuccess) {
      pointUpdated >= info?.value! ? setCanSpin(false) : setCanSpin(true);
      setCount(pointUpdated);
    }
  }, [pointUpdated]);

  useEffect(() => {
    if (!mustSpin && result && isConnected) {
      alert(`ยินดีด้วยคุณได้รับ  ${result} Point!`);
    }
  }, [mustSpin, result, isConnected]);

  useEffect(() => {
    if (spinData) {
      setPrizeNumber(spinData.position);
      setMustSpin(true);
      setResult(spinData.result);
    }
  }, [spinData]);

  const handleSpinClick = () => {
    setCanSpin(false);
    spin({ wallet: walletAddress! });
  };

  const handleSelectProfile = (e: SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      value: string;
    };

    const nft: JaothuiProfile = JSON.parse(target.value);
    getNftInGame({
      tokenId: nft.tokenId!,
      contractAddress,
      gameId,
      // contractAddress: "0x07B2bCc269B100b51AB8598d44AB568C7199C7BC",
      // gameId: "3fc396c8-b968-46fd-849d-d2243102fe00",
    });
    setSelectedProfile(nft);
  };

  // if (reseting) {
  //   return (
  //     <div className="h-screen flex flex-col mt-[100px] items-center">
  //       <Loading size="lg" />
  //       <div>Initializing..</div>
  //     </div>
  //   );
  // }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2 items-center h-screen">
        <p>กรุณาเชื่อมต่อ Bitkub Next Wallet ก่อน</p>
        <BitkubNextConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-2 md:p-0 w-screen">
      <div className="flex gap-2 items-center flex-col">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-2 place-items-center">
            <figure className="w-full rounded-2xl overflow-hidden">
              {selectedProfile ? (
                <Image
                  src={selectedProfile.image}
                  width={1000}
                  height={1000}
                  alt="logo"
                />
              ) : (
                <Image
                  src="/images/hotwheel-logo.jpg"
                  width={1000}
                  height={1000}
                  alt="logo"
                />
              )}
            </figure>
            <div>
              <div>
                {selectedProfile == undefined ? (
                  <div className="font-bold py-2">กรุณาเลือกเจ้าทุย</div>
                ) : (
                  <div className="font-bold py-2">
                    หมุนไปแล้ว {count}/
                    {rarity.find(
                      (r) => r.name == selectedProfile?.attributes[0].value
                    )?.value ?? 0}{" "}
                    ครั้ง
                  </div>
                )}
              </div>

              {!loadingToken ? (
                <select
                  onChange={(e) => handleSelectProfile(e)}
                  className="select select-bordered w-full font-bold select-primary text-[#000]"
                >
                  <option disabled selected>
                    เลือกเจ้าทุย
                  </option>
                  {tokens &&
                    tokens.map((token) => (
                      <option key={token.name} value={JSON.stringify(token)}>
                        {token.name}
                      </option>
                    ))}
                </select>
              ) : (
                <Loading size="md" />
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <>
            {typeof window !== "undefined" ? (
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                fontSize={40}
                data={data}
                outerBorderColor="white"
                outerBorderWidth={5}
                radiusLineWidth={3}
                radiusLineColor="white"
                disableInitialAnimation={true}
                textColors={["white"]}
                onStopSpinning={() => {
                  setMustSpin(false);
                  updatePoint({ docId: nftGameData._id });
                  getNftInGame({
                    tokenId: nftGameData.tokenId!,
                    contractAddress,
                    gameId,
                    // contractAddress:
                    //   "0x07B2bCc269B100b51AB8598d44AB568C7199C7BC",
                    // gameId: "3fc396c8-b968-46fd-849d-d2243102fe00",
                  });
                  // setResult(parseInt(data[prizeNumber].option));
                }}
              />
            ) : null}
          </>

          <button
            disabled={
              loadingNftGameData ||
              loadingToken ||
              loadingUpdatePoint ||
              spinning ||
              selectedProfile == null ||
              !canSpin
            }
            onClick={() => handleSpinClick()}
            className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[10] p-4 rounded-full bg-[#ff2233] shadow font-bold disabled:text-[#eee] disabled:btn-secondary"
          >
            {loadingNftGameData || loadingToken ? (
              <span className="absolute loading loading-spinner loading-lg top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"></span>
            ) : (
              <div className="relative">
                {/* <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                  {count}
                </div> */}
                <ImSpinner11 size={34} />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotWheel;
