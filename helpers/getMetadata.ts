import axios from "axios";
import { CertNFTRawData } from "../blockchain/cert/interface";

async function getMetadata(infos: CertNFTRawData[], setBuffaloList: Function) {
  if (infos.length <= 0) return [];
  const metadata = await Promise.all(
    infos.map(async (m) => {
      const response = await axios.get(m.tokenUri);
      const metadata = response.data;
      // console.log(data);
      const obj = {
        ...m,
        metadata,
      };
      return obj;
    })
  );
  setBuffaloList(metadata as CertNFTRawData[]);
}

export { getMetadata };
