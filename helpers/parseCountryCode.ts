import { code } from "../constants/countryCode";
export function parseCountryCode(country: string) {
  const lower = country.toLocaleLowerCase();

  const c = code.find((d) => d.name == lower);
  return c?.code;
}
