import { prisma } from "../prisma";
import dayjs from "dayjs";

export const isCertificateActivated = async (microchip: string) => {
  const found = await prisma.certificate.findUnique({
    where: { microchip },
    include: {
      user: true,
    },
  });

  const year = +dayjs(found?.updatedAt).format("YYYY") + 543;

  return found && found.isActive
    ? {
        no: found.no,
        isFull: true,
        year,
        bornAt: found.bornAt,
        owner: found.user.name,
      }
    : {
        no: null,
        isFull: false,
        year: 0,
        bornAt: "N/A",
        owner: "N/A",
      };
};
