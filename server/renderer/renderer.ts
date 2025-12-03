import {
  createCanvas,
  loadImage,
  CanvasRenderingContext2D,
  registerFont,
} from "canvas";
import { pedigreeRenderingConfig } from "./position-config/config";
import qrcode from "qrcode-generator";
import { getMetadataForRendering } from "../services/renderer.service";
import { parseThaiDate } from "./helpers/parse-thai-date";
import { calculateXPositionOfName } from "./helpers/calculate-name-length";

registerFont(`${process.cwd()}/server/renderer/font/Kanit/Kanit-Regular.ttf`, {
  family: "Kanit",
});

const renderText = (
  text: string,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number = 15,
  color: string = "#000000",
  align: CanvasTextAlign = "center"
) => {
  ctx.font = `${size}px Kanit`;
  ctx.fillStyle = `${color}`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
};

export const renderPedigree = async (microchip: string, tokenId: string) => {
  const startTime = Date.now(); // Total time tracking
  try {
    console.log(`\n${'╔'.padEnd(70, '═')}╗`);
    console.log(`║ 🎨 RENDER PEDIGREE STARTED`.padEnd(71) + `║`);
    console.log(`║ Microchip: ${microchip} | TokenId: ${tokenId}`.padEnd(71) + `║`);
    console.log(`${'╚'.padEnd(70, '═')}╝\n`);

    console.time("⏱️ Total Render Time");
    console.time("⏱️ Database Query");
    const buffaloData = await getMetadataForRendering(microchip);
    console.timeEnd("⏱️ Database Query");

    if (buffaloData == undefined || !buffaloData!.certificate?.isActive) {
      console.log(`❌ [FATAL] Invalid buffalo data or certificate not active`);
      return null;
    }

    // DEBUG: Log buffalo data structure
    console.log(`\n📦 [Buffalo Data Structure]`);
    console.log(`   - Name: ${buffaloData.name}`);
    console.log(`   - Microchip: ${buffaloData.certify.microchip}`);
    console.log(`   - 🖼️  imageUrl: ${buffaloData.imageUrl === null ? '❌ NULL/UNDEFINED' : `✅ "${buffaloData.imageUrl}"`}`);
    console.log(`   - Certificate: ${buffaloData.certificate?.no || 'N/A'}`);
    console.log(`   - Approvers: ${buffaloData.certificate?.approvers?.length || 0}`);

    const {
      noPos,
      qrPos,
      buffNamePos,
      microchipPos,
      bDayPos,
      bMonthPos,
      bYearPos,
      bornAtPos,
      colorPos,
      sexPos,
      namePos,
      dadPos,
      momPos,
      dGrandPaPos,
      dGrandMaPos,
      mGrandPaPos,
      mGrandMaPos,
      signatureImgPos,
      signatureNamePos,
      signatureJobPos,
      imageInfo,
    } = pedigreeRenderingConfig;

    // Use local template path
    const framePath = `${process.cwd()}/server/renderer/template/template.png`;

    console.log(`\n📁 [File Paths]`);
    console.log(`   - Template: ${framePath}`);
    console.log(`   - Image URL: ${buffaloData.imageUrl || '❌ NONE (Will be NULL)'}`);

    console.time("⏱️ Load Images (Parallel)");
    console.log(`\n🔄 [Loading Images]`);
    console.log(`   1️⃣  Frame (template)`);
    console.log(`   2️⃣  Buffalo Image: ${buffaloData.imageUrl ? `✅ Attempting to load "${buffaloData.imageUrl}"` : '❌ SKIP - imageUrl is NULL'}`);
    console.log(`   3️⃣  Signature 1 (position 0): ${buffaloData.certificate?.approvers?.[0]?.signatureUrl || '❌ NOT FOUND'}`);
    console.log(`   4️⃣  Signature 2 (position 1): ${buffaloData.certificate?.approvers?.[1]?.signatureUrl || '❌ NOT FOUND'}`);
    console.log(`   5️⃣  Signature 3 (position 2): ${buffaloData.certificate?.approvers?.[2]?.signatureUrl || '❌ NOT FOUND'}`);

    // Load all images in parallel for better performance
    const [frame, buffaloImage, signature1, signature2, signature3] = await Promise.all([
      loadImage(framePath),
      buffaloData.imageUrl
        ? loadImage(buffaloData.imageUrl).catch((err) => {
            console.log(`   ⚠️  Failed to load buffalo image: ${err.message}`);
            return null;
          })
        : (console.log(`   ⏭️  Skipping buffalo image load (imageUrl is NULL)`), null),
      loadImage(
        buffaloData?.certificate?.approvers.find(
          (approver) => approver.position == 0
        )?.signatureUrl || ""
      ).catch(() => null),
      loadImage(
        buffaloData?.certificate?.approvers.find(
          (approver) => approver.position == 1
        )?.signatureUrl || ""
      ).catch(() => null),
      loadImage(
        buffaloData?.certificate?.approvers.find(
          (approver) => approver.position == 2
        )?.signatureUrl || ""
      ).catch(() => null),
    ]);
    console.timeEnd("⏱️ Load Images (Parallel)");

    console.log(`\n📊 [Images Loaded Result]`);
    console.log(`   ✅ Frame: Loaded (${frame.width}x${frame.height})`);
    console.log(`   ${buffaloImage ? `✅ Buffalo Image: Loaded (${buffaloImage.width}x${buffaloImage.height})` : `❌ Buffalo Image: NULL (Won't be drawn)`}`);
    console.log(`   ${signature1 ? `✅ Signature 1: Loaded` : `❌ Signature 1: NULL`}`);
    console.log(`   ${signature2 ? `✅ Signature 2: Loaded` : `❌ Signature 2: NULL`}`);
    console.log(`   ${signature3 ? `✅ Signature 3: Loaded` : `❌ Signature 3: NULL`}`);

    console.time("⏱️ Canvas Rendering");
    const canvas = createCanvas(frame.width, frame.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(frame, 0, 0, frame.width, frame.height);
    if (buffaloImage) {
      console.log(`\n🎨 [Drawing]`);
      console.log(`   ✅ Drawing buffalo image at position (${imageInfo.x}, ${imageInfo.y})`);

      ctx.drawImage(
        buffaloImage,
        imageInfo.x,
        imageInfo.y,
        imageInfo.width,
        imageInfo.height
      );
    }

    //QR CODE
    const dataurl = qrGenerator(`https://jaothui.com/cert/${microchip}`);
    const qrimg = await loadImage(dataurl);
    ctx.drawImage(qrimg, qrPos.x, qrPos.y, qrPos.width, qrPos.height);

    //CERTIFICATION NO
    renderText(
      `${buffaloData?.certificate?.no}/${buffaloData?.certificate?.year}`,
      ctx,
      noPos.x,
      noPos.y
    );
    //BUFFALO NAME
    renderText(buffaloData?.name!, ctx, buffNamePos.x, buffNamePos.y);
    //BUFFALO MICROCHIP
    renderText(
      buffaloData?.certify.microchip!,
      ctx,
      microchipPos.x,
      microchipPos.y
    );
    //BUFFALO BIRTHDATE - birthdate is already in milliseconds from getMetadataForRendering
    const birthdate = parseThaiDate(buffaloData?.birthdate!);
    renderText(birthdate.date as string, ctx, bDayPos.x, bDayPos.y);
    renderText(birthdate.thaiMonth, ctx, bMonthPos.x, bMonthPos.y);
    renderText(birthdate.thaiYear as string, ctx, bYearPos.x, bYearPos.y);

    //BUFFALO COLOR
    renderText(
      buffaloData?.color! == "Albino" ? "เผือก" : "ดำ",
      ctx,
      colorPos.x,
      colorPos.y
    );

    //BUFFALO SEX
    renderText(
      buffaloData?.sex! == "Male" ? "ผู้" : "เมีย",
      ctx,
      sexPos.x,
      sexPos.y
    );

    //BUFFALO OWNER NAME
    const name = buffaloData?.certificate?.ownerName || "";
    const calcXPos = calculateXPositionOfName(name);
    const nameSize = name.length > 60 ? 12 : 14;

    renderText(
      buffaloData?.certificate?.ownerName || "",
      ctx,
      calcXPos,
      namePos.y,
      nameSize
    );

    //BUFFALO BORN AT
    renderText(buffaloData?.certificate?.bornAt || "", ctx, bornAtPos.x, bornAtPos.y);

    //BUFFALO's FATHER
    renderText(
      buffaloData?.certificate?.dadId == undefined
        ? ""
        : (JSON.parse(buffaloData?.certificate?.dadId!) as [string, string])[1],
      ctx,
      dadPos.x,
      dadPos.y
    );

    //BUFFALO's MOTHER
    renderText(
      buffaloData?.certificate?.momId == undefined
        ? ""
        : (JSON.parse(buffaloData?.certificate?.momId!) as [string, string])[1],
      ctx,
      momPos.x,
      momPos.y
    );

    //BUFFALO's fGRANDDAD
    renderText(
      buffaloData?.certificate?.fGranDadId == undefined
        ? ""
        : (
            JSON.parse(buffaloData?.certificate?.fGranDadId!) as [string, string]
          )[1],
      ctx,
      dGrandPaPos.x,
      dGrandPaPos.y
    );

    //BUFFALO's fGRANDMOM
    renderText(
      buffaloData?.certificate?.fGrandMomId == undefined
        ? ""
        : (
            JSON.parse(buffaloData?.certificate?.fGrandMomId!) as [
              string,
              string
            ]
          )[1],
      ctx,
      dGrandMaPos.x,
      dGrandMaPos.y
    );

    //BUFFALO's mGRANDDAD
    renderText(
      buffaloData?.certificate?.mGrandDadId == undefined
        ? ""
        : (
            JSON.parse(buffaloData?.certificate?.mGrandDadId!) as [
              string,
              string
            ]
          )[1],
      ctx,
      mGrandPaPos.x,
      mGrandPaPos.y
    );

    //BUFFALO's mGRANDMOM
    renderText(
      buffaloData?.certificate?.mGrandMomId == undefined
        ? ""
        : (
            JSON.parse(buffaloData?.certificate?.mGrandMomId!) as [
              string,
              string
            ]
          )[1],
      ctx,
      mGrandMaPos.x,
      mGrandMaPos.y
    );

    //Signature 1
    if (signature1) {
      ctx.drawImage(
        signature1,
        signatureImgPos.pos[0].x,
        signatureImgPos.pos[0].y,
        signatureImgPos.width,
        signatureImgPos.height
      );
    }

    //Signature 2
    if (signature2) {
      ctx.drawImage(
        signature2,
        signatureImgPos.pos[1].x,
        signatureImgPos.pos[1].y,
        signatureImgPos.width,
        signatureImgPos.height
      );
    }

    //Signature 3
    if (signature3) {
      ctx.drawImage(
        signature3,
        signatureImgPos.pos[2].x,
        signatureImgPos.pos[2].y,
        signatureImgPos.width,
        signatureImgPos.height
      );
    }
    renderText(
      buffaloData?.certificate?.approvers.find(
        (approver) => approver.position == 0
      )?.user.name || "",
      ctx,
      signatureNamePos.pos[0].x,
      signatureNamePos.pos[0].y,
      12
    );
    renderText(
      buffaloData?.certificate?.approvers.find(
        (approver) => approver.position == 1
      )?.user.name || "",
      ctx,
      signatureNamePos.pos[1].x,
      signatureNamePos.pos[1].y,
      12
    );
    renderText(
      buffaloData?.certificate?.approvers.find(
        (approver) => approver.position == 2
      )?.user.name || "",
      ctx,
      signatureNamePos.pos[2].x,
      signatureNamePos.pos[2].y,
      12
    );

    signatureJobRender(
      ctx,
      buffaloData?.certificate?.approvers.find(
        (approver) => approver.position == 0
      )?.job || "",
      10,
      "black",
      signatureJobPos.pos[0].x,
      signatureJobPos.pos[0].y
    );

    signatureJobRender(
      ctx,
      buffaloData?.certificate?.approvers.find(
        (approver) => approver.position == 1
      )?.job || "",
      10,
      "black",
      signatureJobPos.pos[1].x,
      signatureJobPos.pos[1].y
    );

    signatureJobRender(
      ctx,
      buffaloData?.certificate?.approvers.find(
        (approver) => approver.position == 2
      )?.job || "",
      10,
      "black",
      signatureJobPos.pos[2].x,
      signatureJobPos.pos[2].y
    );

    console.timeEnd("⏱️ Canvas Rendering");
    console.timeEnd("⏱️ Total Render Time");

    const totalTime = Date.now() - startTime;
    const performanceStatus = totalTime < 2700 ? '✅ PASS' : totalTime < 3000 ? '⚠️ CLOSE' : '❌ FAIL';

    console.log(`\n✅ [Render Complete]`);
    console.log(`   - Canvas size: ${canvas.width}x${canvas.height}`);
    console.log(`   - Output: Base64 string (${canvas.toBuffer().toString("base64").length} chars)`);
    console.log(`\n📊 [Performance Summary]`);
    console.log(`   - Total Time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
    console.log(`   - Target: < 2700ms (2.7s)`);
    console.log(`   - Status: ${performanceStatus}`);
    console.log(`${'╔'.padEnd(70, '═')}╗`);
    console.log(`║ ✅ RENDER PEDIGREE COMPLETED SUCCESSFULLY`.padEnd(71) + `║`);
    console.log(`${'╚'.padEnd(70, '═')}╝\n`);

    return canvas.toBuffer().toString("base64");
  } catch (error) {
    console.log(`\n❌ [CRITICAL ERROR] ${error}`);
    console.log(error);
    return null;
  }
};

const qrGenerator = (url: string) => {
  let typeNumber: TypeNumber = 0;
  let errorCorrectionLevel: ErrorCorrectionLevel = "Q";
  let qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(url);
  qr.make();

  return qr.createDataURL();
};

const signatureJobRender = (
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontColor: string,
  x: number,
  y: number
) => {
  let max_width = 127;
  let font = fontSize || 10;
  let lines = new Array();
  let width = 0,
    i,
    j;
  let result;
  let color = fontColor || "white";

  // Font and size is required for ctx.measureText()
  ctx.font = fontSize + "px Arial";

  // Start calculation
  while (text.length) {
    for (
      i = text.length;
      ctx.measureText(text.substr(0, i)).width > max_width;
      i--
    );

    result = text.substr(0, i);

    if (i !== text.length)
      for (
        j = 0;
        result.indexOf(" ", j) !== -1;
        j = result.indexOf(" ", j) + 1
      );

    lines.push(result.substr(0, j || result.length));
    width = Math.max(width, ctx.measureText(lines[lines.length - 1]).width);
    text = text.substring(lines[lines.length - 1].length, text.length);
  }

  // Calculate canvas size, add margin
  ctx.font = font + "px Kanit";

  // Render
  ctx.fillStyle = color;
  for (i = 0, j = lines.length; i < j; ++i) {
    ctx.fillText(lines[i], x, y + fontSize + (fontSize + 5) * i);
  }
};
