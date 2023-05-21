import { useRef } from "react";

export function useWindowSize() {
  const windowSize = useRef([window.innerWidth, window.innerHeight]);
  return {
    wWidth: windowSize.current[0] as number,
    wHeight: windowSize.current[1] as number
  };
}
