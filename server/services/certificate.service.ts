import { prisma } from "../prisma";
import dayjs from "dayjs";

export const isCertificateActivated = async (microchip: string) => {
  const found = await prisma.certificate.findUnique({
    where: { microchip, isActive: true },
    include: {
      approvers: {
        include: { user: true },
      },
    },
  });

  // const year = +dayjs(found?.updatedAt).format("YYYY") + 543;

  return found && found.isActive
    ? {
        ...found,
        updatedAt: found.updatedAt.getTime(),
        year: found?.updatedAt.getFullYear() + 543,
      }
    : null;
};
