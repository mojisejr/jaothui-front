import { createHash } from "crypto";
import { EventError } from "./errors";

/** Bounded metadata parsing for the three accepted source formats; no decode or new dependency. */
export function applicantImageIdentity(bytes: Buffer) {
  if (bytes.length > 4 * 1024 * 1024) throw new EventError(413, "IMAGE_TOO_LARGE", "รูปต้องไม่เกิน 4MB");
  let width = 0, height = 0, extension = "";
  try {
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.subarray(12, 16).toString() === "IHDR") {
      width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20); extension = "png";
    } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
      let offset = 2;
      while (offset + 9 < bytes.length) {
        if (bytes[offset++] !== 255) break;
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 0xda || marker === 0xd9) break;
        const length = bytes.readUInt16BE(offset);
        if (length < 2 || offset + length > bytes.length) break;
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          height = bytes.readUInt16BE(offset + 3); width = bytes.readUInt16BE(offset + 5); extension = "jpg"; break;
        }
        offset += length;
      }
    } else if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") {
      const kind = bytes.subarray(12, 16).toString();
      if (kind === "VP8X") { width = bytes.readUIntLE(24, 3) + 1; height = bytes.readUIntLE(27, 3) + 1; }
      else if (kind === "VP8 " && bytes.subarray(23, 26).equals(Buffer.from([157, 1, 42]))) { width = bytes.readUInt16LE(26) & 0x3fff; height = bytes.readUInt16LE(28) & 0x3fff; }
      else if (kind === "VP8L" && bytes[20] === 47) { width = 1 + bytes[21] + ((bytes[22] & 63) << 8); height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10); }
      extension = "webp";
    }
  } catch {}
  if (!width || !height || !extension) throw new EventError(415, "UNSUPPORTED_IMAGE", "รองรับเฉพาะรูป JPEG, PNG และ WebP ที่ถูกต้อง");
  const hash = createHash("sha1").update(bytes).digest("hex");
  return { id: `image-${hash}-${width}x${height}-${extension}`, extension };
}
