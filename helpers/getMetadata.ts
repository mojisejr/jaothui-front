import axios from "axios";
import { CertNFTData } from "../blockchain/cert/interface";

async function getMetadata(infos: CertNFTData[], setBuffaloList: Function) {
  console.log(infos);
  if (infos.length <= 0 || infos[0] == null) return [];
  const metadata = await Promise.all(
    infos.map(async (m) => {
      const response = await axios.get(m.image);
      const metadata = response.data;
      // console.log(data);
      const obj = {
        ...m,
        metadata,
      };
      return obj;
    })
  );
  setBuffaloList(metadata as CertNFTData[]);
}

export { getMetadata };
