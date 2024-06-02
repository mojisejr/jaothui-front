import axios from "axios";
export const getCertificateImageOf = async (microchip: string) => {
  const response = await axios
    .get(`${process.env.renderer_url!}/${microchip}`, {
      // .get(`http://localhost:4444/certificate/${microchip}`, {
      headers: {
        Authorization: `Bearer ${process.env.renderer_key}`,
      },
    })
    .catch((error) => {
      console.log(error);
    });

  if (!response) return;

  return response.data.data;
};
// import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
// import { pedigreeRenderingConfig } from "../config";
// import qrcode from "qrcode-generator";
// import { getMetadataByMicrochipId } from "./metadata.service";
// import { parseThaiDate } from "../../helpers/parseThaiDate";

// const renderText = (
//   text: string,
//   ctx: CanvasRenderingContext2D,
//   x: number,
//   y: number,
//   size: number = 15,
//   color: string = "#000000",
//   align: CanvasTextAlign = "center"
// ) => {
//   ctx.font = `${size}px serif bold`;
//   ctx.fillStyle = `${color}`;
//   ctx.textAlign = align;
//   ctx.fillText(text, x, y);
// };

// export const renderPedigree = async (microchip: string) => {
//   try {
//     const buffaloData = await getMetadataByMicrochipId(microchip);

//     if (!buffaloData!.certificate?.isActive) return;
//     const {
//       framePath,
//       noPos,
//       qrPos,
//       buffNamePos,
//       microchipPos,
//       bDayPos,
//       bMonthPos,
//       bYearPos,
//       bornAtPos,
//       colorPos,
//       sexPos,
//       namePos,
//       dadPos,
//       momPos,
//       dGrandPaPos,
//       dGrandMaPos,
//       mGrandPaPos,
//       mGrandMaPos,
//       signatureImgPos,
//       signatureNamePos,
//       signatureJobPos,
//       imageInfo,
//     } = pedigreeRenderingConfig;

//     const frame = await loadImage(framePath);
//     const buffaloImage = await loadImage(buffaloData?.imageUri!);
//     // const testUrl =
//     //   "https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/signatures/0x97584869f231989153d361B7FC64197BdEBA819c.png?t=2024-05-27T15%3A47%3A11.121Z";
//     const signature1 = await loadImage(
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 0
//       )?.signatureUrl!
//     );
//     const signature2 = await loadImage(
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 1
//       )?.signatureUrl!
//     );
//     const signature3 = await loadImage(
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 2
//       )?.signatureUrl!
//     );
//     const canvas = createCanvas(frame.width, frame.height);
//     const ctx = canvas.getContext("2d");

//     ctx.drawImage(frame, 0, 0, frame.width, frame.height);
//     ctx.drawImage(
//       buffaloImage,
//       imageInfo.x,
//       imageInfo.y,
//       imageInfo.width,
//       imageInfo.height
//     );

//     const dataurl = qrGenerator(`https://jaothui.com/cert/${microchip}`);
//     const qrimg = await loadImage(dataurl);
//     ctx.drawImage(qrimg, qrPos.x, qrPos.y, qrPos.width, qrPos.height);

//     renderText(
//       `${buffaloData?.certificate.no}/${buffaloData?.certificate.year}`,
//       ctx,
//       noPos.x,
//       noPos.y
//     );
//     renderText(buffaloData?.name!, ctx, buffNamePos.x, buffNamePos.y);
//     renderText(
//       buffaloData?.certify.microchip!,
//       ctx,
//       microchipPos.x,
//       microchipPos.y
//     );
//     const birthdate = parseThaiDate(buffaloData?.birthdate! * 1000);
//     renderText(birthdate.date as string, ctx, bDayPos.x, bDayPos.y);
//     renderText(birthdate.thaiMonth, ctx, bMonthPos.x, bMonthPos.y);
//     renderText(birthdate.thaiYear as string, ctx, bYearPos.x, bYearPos.y);
//     renderText(
//       buffaloData?.color! == "Albino" ? "เผือก" : "ดำ",
//       ctx,
//       colorPos.x,
//       colorPos.y
//     );
//     renderText(
//       buffaloData?.sex! == "Male" ? "ผู้" : "เมีย",
//       ctx,
//       sexPos.x,
//       sexPos.y
//     );
//     renderText(buffaloData?.certificate.ownerName!, ctx, namePos.x, namePos.y);
//     renderText(buffaloData?.certificate.bornAt!, ctx, bornAtPos.x, bornAtPos.y);
//     renderText(
//       buffaloData?.certificate.dadId == undefined
//         ? ""
//         : (JSON.parse(buffaloData?.certificate.dadId!) as [string, string])[1],
//       ctx,
//       dadPos.x,
//       dadPos.y
//     );
//     renderText(
//       buffaloData?.certificate.momId == undefined
//         ? ""
//         : (JSON.parse(buffaloData?.certificate.momId!) as [string, string])[1],
//       ctx,
//       momPos.x,
//       momPos.y
//     );
//     renderText(
//       buffaloData?.certificate.fGranDadId == undefined
//         ? ""
//         : (
//             JSON.parse(buffaloData?.certificate.fGranDadId!) as [string, string]
//           )[1],
//       ctx,
//       dGrandPaPos.x,
//       dGrandPaPos.y
//     );
//     renderText(
//       buffaloData?.certificate.fGrandMomId == undefined
//         ? ""
//         : (
//             JSON.parse(buffaloData?.certificate.fGrandMomId!) as [
//               string,
//               string,
//             ]
//           )[1],
//       ctx,
//       dGrandMaPos.x,
//       dGrandMaPos.y
//     );
//     renderText(
//       buffaloData?.certificate.mGrandDadId == undefined
//         ? ""
//         : (
//             JSON.parse(buffaloData?.certificate.mGrandDadId!) as [
//               string,
//               string,
//             ]
//           )[1],
//       ctx,
//       mGrandPaPos.x,
//       mGrandPaPos.y
//     );
//     renderText(
//       buffaloData?.certificate.mGrandMomId == undefined
//         ? ""
//         : (
//             JSON.parse(buffaloData?.certificate.mGrandMomId!) as [
//               string,
//               string,
//             ]
//           )[1],
//       ctx,
//       mGrandMaPos.x,
//       mGrandMaPos.y
//     );
//     ctx.drawImage(
//       signature1,
//       signatureImgPos.pos[0].x,
//       signatureImgPos.pos[0].y,
//       signatureImgPos.width,
//       signatureImgPos.height
//     );
//     ctx.drawImage(
//       signature2,
//       signatureImgPos.pos[1].x,
//       signatureImgPos.pos[1].y,
//       signatureImgPos.width,
//       signatureImgPos.height
//     );
//     ctx.drawImage(
//       signature3,
//       signatureImgPos.pos[2].x,
//       signatureImgPos.pos[2].y,
//       signatureImgPos.width,
//       signatureImgPos.height
//     );
//     renderText(
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 0
//       )?.user.name!,
//       ctx,
//       signatureNamePos.pos[0].x,
//       signatureNamePos.pos[0].y,
//       12
//     );
//     renderText(
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 1
//       )?.user.name!,
//       ctx,
//       signatureNamePos.pos[1].x,
//       signatureNamePos.pos[1].y,
//       12
//     );
//     renderText(
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 2
//       )?.user.name!,
//       ctx,
//       signatureNamePos.pos[2].x,
//       signatureNamePos.pos[2].y,
//       12
//     );

//     signatureJobRender(
//       ctx,
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 0
//       )?.job!,
//       10,
//       "black",
//       signatureJobPos.pos[0].x,
//       signatureJobPos.pos[0].y
//     );

//     signatureJobRender(
//       ctx,
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 1
//       )?.job!,
//       10,
//       "black",
//       signatureJobPos.pos[1].x,
//       signatureJobPos.pos[1].y
//     );

//     signatureJobRender(
//       ctx,
//       buffaloData?.certificate.approvers.find(
//         (approver: { position: number }) => approver.position == 2
//       )?.job!,
//       10,
//       "black",
//       signatureJobPos.pos[2].x,
//       signatureJobPos.pos[2].y
//     );

//     return canvas.toBuffer().toString("base64");
//   } catch (error) {
//     console.log(error);
//   }
// };

// const qrGenerator = (url: string) => {
//   let typeNumber: TypeNumber = 0;
//   let errorCorrectionLevel: ErrorCorrectionLevel = "Q";
//   let qr = qrcode(typeNumber, errorCorrectionLevel);
//   qr.addData(url);
//   qr.make();

//   return qr.createDataURL();
// };

// const signatureJobRender = (
//   ctx: CanvasRenderingContext2D,
//   text: string,
//   fontSize: number,
//   fontColor: string,
//   x: number,
//   y: number
// ) => {
//   let max_width = 127;
//   let font = fontSize || 10;
//   let lines = new Array();
//   let width = 0,
//     i,
//     j;
//   let result;
//   let color = fontColor || "white";

//   // Font and size is required for ctx.measureText()
//   ctx.font = fontSize + "px Arial";

//   // Start calculation
//   while (text.length) {
//     for (
//       i = text.length;
//       ctx.measureText(text.substr(0, i)).width > max_width;
//       i--
//     );

//     result = text.substr(0, i);

//     if (i !== text.length)
//       for (
//         j = 0;
//         result.indexOf(" ", j) !== -1;
//         j = result.indexOf(" ", j) + 1
//       );

//     lines.push(result.substr(0, j || result.length));
//     width = Math.max(width, ctx.measureText(lines[lines.length - 1]).width);
//     text = text.substr(lines[lines.length - 1].length, text.length);
//   }

//   // Calculate canvas size, add margin
//   ctx.font = font + "px Arial";

//   // Render
//   ctx.fillStyle = color;
//   for (i = 0, j = lines.length; i < j; ++i) {
//     ctx.fillText(lines[i], x, y + fontSize + (fontSize + 5) * i);
//   }
// };
