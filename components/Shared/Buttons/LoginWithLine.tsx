import { FaLine } from "react-icons/fa";
const LoginWithLineButton = () => {
  return (
    <>
      <button className="bg-[#06c755] hover:bg-[#04d159] text-thuiwhite font-bold flex gap-2 justify-between">
        <FaLine size={24} />
        <span>Login With Line</span>
      </button>
    </>
  );
};

export default LoginWithLineButton;
