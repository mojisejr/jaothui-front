import Image from "next/image";
import { parseCountryCode } from "../helpers/parseCountryCode";

interface CountryFlagProps {
  country: string;
  size: string;
}

function CountryFlag(props: CountryFlagProps) {
  const code = parseCountryCode(props.country);
  return (
    <>
      {code == null || code == undefined ? (
        <span>{props.country}</span>
      ) : (
        <Image
          src={`https://flagcdn.com/${props.size}/${code}.png`}
          width={28}
          height={25}
          alt={props.country}
        />
      )}
    </>
  );
}

export default CountryFlag;
