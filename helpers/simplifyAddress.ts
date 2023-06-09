export function simplifyAddress(address: `0x${string}` | "") {
  if (address == "") return "";
  const front = address.slice(0, 6);
  const back = address.slice(37);
  const combine = `${front}...${back}`;

  return combine;
}
