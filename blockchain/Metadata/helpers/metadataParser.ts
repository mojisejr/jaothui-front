export function parseOutputMetadata(metadata: any[]) {
  const data = metadata.map((m) => {
    return {
      name: m[0],
      origin: m[1],
      color: m[2],
      image: m[3],
      detail: m[4],
      sex: m[5],
      birthday: new Date(+m[6].toString() * 1000).toLocaleDateString(),
      height: m[7].toString(),
      microchip: m[8][0].toString(),
      certNo: m[8][1],
      rarity: m[8][2],
      dna: m[8][3],
      fatherId: m[9][0].toString(),
      motherId: m[9][1].toString(),
      createdAt: new Date(+m[10].toString() * 1000).toLocaleDateString(),
      updatedAt: new Date(+m[11].toString() * 1000).toLocaleDateString(),
    };
  });
  return data;
}
