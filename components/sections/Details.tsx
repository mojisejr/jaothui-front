import Image from "next/image";
import N from "../../public/images/N.jpg";
import R from "../../public/images/R.png";
import SR from "../../public/images/SR.jpg";
import SSR from "../../public/images/SSR.png";

export default function DetailSection() {
  return (
    <div
      className="relative h-full pt-[100px] pb-10 w-full top-[-80px] bg-thuigray flex flex-col justify-center items-center
    tabletS:top-[-100px]
    tabletS:pt-[150px]
    tabletM:top-[-140px]
    tabletM:pt-[180px]
    labtop:top-[-160px]
    labtop:pt-[200px]
    labtop:pb-[100px]
    desktop:top-[-700px]
    desktop:pt-[300px]
    desktop:pb-[200px]
    "
    >
      <div className="flex flex-col justify-center items-center gap-10 z-10">
        <div
          className="text-[30px] text-thuiyellow
        tabletS:text-[50px]
        tabletM:text-[60px]
        labtop:text-[70px]
        "
        >
          ทำไมต้องเป็นควายไทย ?
        </div>
        <div
          className="max-w-[80%] text-[20px] text-thuiwhite
        tabletS:text-[25px]
        tabletM:text-[30px]
        labtop:text-[35px]
        "
        >
          เพื่อส่งเสริมการอนุรักษ์และขยายพันธุ์ควายไทย
          ให้ควายไทยยังคงอยู่คู่กับคนไทย อย่างยั่งยืน
          เพราะถ้าหากไม่มีการขยายพันธุ์ควายไทย
          จะมีการนำเข้าควายจากต่างประเทศมาทดแทน
          นั่นอาจทำให้เอกลักษณ์ความเป็นควายไทยสูญหายไปในที่สุด
        </div>
        <RarityExampleBox />
      </div>
      <div className="absolute w-full h-full top-0 left-0 bg-[url('../public/images/thuiDetailBg.png')] bg-cover bg-no-repeat bg-bottom z-0"></div>
    </div>
  );
}

function RarityExampleBox() {
  return (
    <div className=" max-w-[80%] bg-thuiyellow rounded-[20px] flex flex-col items-center">
      <div
        className="text-center text-[30px] p-2
      labtop:text-[50px]"
      >
        ระดับความหายาก
      </div>
      <div className="pl-10 pr-10 pt-3 pb-3">
        <ul
          className="flex flex-col gap-3 text-thuiyellow text-[20px]
        tabletS:flex-row
        "
        >
          <li className="flex flex-col items-center">
            <Image
              className="w-[80%]
            tabletS:w-full
            "
              src={N}
              width={250}
              alt={"N image"}
            />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              N
            </div>
          </li>
          <li className="flex flex-col items-center">
            <Image
              className="w-[80%]
              tabletS:w-full
            "
              src={R}
              width={250}
              alt={"N image"}
            />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              R
            </div>
          </li>
          <li className="flex flex-col items-center">
            <Image
              className="w-[80%]
              tabletS:w-full
            "
              src={SR}
              width={250}
              alt={"N image"}
            />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              SR
            </div>
          </li>
          <li className="flex flex-col items-center">
            <Image
              className="w-[80%]
              tabletS:w-full
            "
              src={SSR}
              width={250}
              alt={"N image"}
            />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              SSR
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
