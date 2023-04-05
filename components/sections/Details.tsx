import Image from "next/image";
import N from "../../public/images/N.jpg";
import R from "../../public/images/R.png";
import SR from "../../public/images/SR.jpg";
import SSR from "../../public/images/SSR.png";

export default function DetailSection() {
  return (
    <div className="relative mt-[-700px] h-screen w-full bg-thuigray flex flex-col items-center">
      <div className="flex flex-col mt-[300px] justify-center items-center gap-10 z-10">
        <div className="text-[50px] text-thuiyellow">ทำไมต้องเป็นควายไทย ?</div>
        <div className="max-w-[80%] text-[30px] text-thuiwhite">
          เพื่อส่งเสริมการอนุรักษ์และขยายพันธุ์ควายไทย
          ให้ควายไทยยังคงอยู่คู่กับคนไทย อย่างยั่งยืน
          เพราะถ้าหากไม่มีการขยายพันธุ์ควายไทย
          จะมีการนำเข้าควายจากต่างประเทศมาทดแทน
          นั่นอาจทำให้เอกลักษณ์ความเป็นควายไทยสูญหายไปในที่สุด
        </div>
        <RarityExampleBox />
      </div>
      <div className="absolute w-full h-full bg-[url('../public/images/thuiDetailBg.png')] bg-cover bg-no-repeat bg-bottom z-0"></div>
    </div>
  );
}

function RarityExampleBox() {
  return (
    <div className=" max-w-[80%] bg-thuiyellow rounded-[20px] flex flex-col items-center">
      <div className="text-center text-[35px] p-5">ระดับความหายาก</div>
      <div className="pl-10 pr-10 pt-3 pb-3">
        <ul className="flex gap-3 text-thuiyellow text-[20px]">
          <li className="flex flex-col items-center">
            <Image src={N} width={250} alt={"N image"} />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              N
            </div>
          </li>
          <li className="flex flex-col items-center">
            <Image src={R} width={250} alt={"N image"} />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              R
            </div>
          </li>
          <li className="flex flex-col items-center">
            <Image src={SR} width={250} alt={"N image"} />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              SR
            </div>
          </li>
          <li className="flex flex-col items-center">
            <Image src={SSR} width={250} alt={"N image"} />
            <div className="mt-5 bg-thuigray pr-10 pl-10 pt-2 pb-2 rounded-[20px]">
              SSR
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
