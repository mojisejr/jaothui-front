import { z } from "zod";
import { viem } from "../../viem";
import { contract } from "../../../blockchain/contract";
import { EventError, invalidFields } from "./errors";
export const registrationLookupInput = z.object({ microchip: z.string().trim().min(1).max(300) }).strict();
/** Event metadata.service authority, deliberately independent of Prisma pedigree/rewards. */
export async function registrationLookup(input: unknown, read = (microchip: string) => viem.readContract({ ...contract.metadata, functionName: "getMetadataByMicrochip", args: [microchip] })) {
  const parsed = registrationLookupInput.safeParse(input);
  if (!parsed.success) return invalidFields();
  let data;
  try { data = await read(parsed.data.microchip) as { name: string; sex: string; color: string; birthdate: bigint }; }
  catch (error) {
    if ((error as { name?: string }).name === "ContractFunctionExecutionError" && String((error as Error).message).includes("reverted")) throw new EventError(404, "BUFFALO_NOT_FOUND", "ไม่พบไมโครชิปที่ค้นหา");
    throw new EventError(503, "EVENTS_UNAVAILABLE", "ค้นหาข้อมูลไม่สำเร็จ กรุณาลองใหม่");
  }
  const seconds = Number(data.birthdate);
  return { buffalo: { name: data.name, sex: data.sex, color: data.color, birthday: null, birthdate: Number.isFinite(seconds) ? seconds : null } };
}
