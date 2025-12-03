import axios from "axios";
import { prisma } from "../prisma";
import { getImageUrl } from "../supabase";

/**
 * Interface for rendering data
 * Contains all data needed to render a pedigree certificate
 */
export interface RenderingMetadata {
  name: string;
  color: string;
  sex: string;
  birthdate: number; // timestamp in milliseconds
  height: number;
  tokenId: string;
  imageUrl: string | null; // Image URL from Pedigree data
  certify: {
    microchip: string;
    certNo: string | null;
    rarity: string;
    dna: string;
    issuedAt: number;
  };
  relation: {
    motherTokenId: string;
    fatherTokenId: string;
  };
  certificate: {
    no: number;
    year: number;
    isActive: boolean;
    ownerName: string;
    bornAt: string | null;
    dadId: string | null;
    momId: string | null;
    fGranDadId: string | null;
    fGrandMomId: string | null;
    mGrandDadId: string | null;
    mGrandMomId: string | null;
    approvers: Array<{
      wallet: string;
      signatureUrl: string;
      job: string;
      position: number;
      user: {
        name: string | null;
      };
    }>;
  } | null;
}

/**
 * Get metadata for rendering from database (not blockchain)
 * This is 30x faster than blockchain RPC queries
 *
 * @param microchip - Buffalo microchip ID
 * @returns RenderingMetadata or null if not found/not active
 */
export const getMetadataForRendering = async (
  microchip: string
): Promise<RenderingMetadata | null> => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📥 [getMetadataForRendering] Starting for microchip: ${microchip}`);
    console.log(`${'='.repeat(60)}`);

    // Query Pedigree with Certificate and Approvers in one query
    const pedigree = await prisma.pedigree.findUnique({
      where: { microchip },
    });

    if (!pedigree) {
      console.log(`❌ [ERROR] Pedigree not found: ${microchip}`);
      return null;
    }

    console.log(`✅ [Pedigree Found]`);
    console.log(`   - Name: ${pedigree.name}`);
    console.log(`   - Microchip: ${pedigree.microchip}`);
    console.log(`   - TokenID: ${pedigree.tokenId}`);
    console.log(`   - Birthday: ${pedigree.birthday}`);
    console.log(`   - 🖼️  IMAGE FIELD: ${pedigree.image === null ? '❌ NULL' : `✅ ${pedigree.image}`}`);

    // Query Certificate separately with approvers
    const certificate = await prisma.certificate.findUnique({
      where: { microchip, isActive: true },
      include: {
        approvers: {
          include: { user: true },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!certificate || !certificate.isActive) {
      console.log(`❌ [ERROR] Certificate not active: ${microchip}`);
      return null;
    }

    console.log(`✅ [Certificate Found]`);
    console.log(`   - Cert No: ${certificate.no}/${certificate.updatedAt.getFullYear() + 543}`);
    console.log(`   - Owner: ${certificate.ownerName}`);
    console.log(`   - Approvers: ${certificate.approvers.length}`);

    // Transform to rendering format
    const imageUrl = pedigree.image ?? null;
    console.log(`\n🔍 [Image URL Debug]`);
    console.log(`   - pedigree.image: ${pedigree.image === null ? '❌ NULL' : `✅ "${pedigree.image}"`}`);
    console.log(`   - imageUrl (final): ${imageUrl === null ? '❌ NULL' : `✅ "${imageUrl}"`}`);

    const result: RenderingMetadata = {
      name: pedigree.name,
      color: pedigree.color,
      sex: pedigree.sex,
      birthdate: new Date(pedigree.birthday).getTime(), // Convert DateTime to timestamp
      height: pedigree.height ?? 0,
      tokenId: pedigree.tokenId.toString(),
      imageUrl: imageUrl, // Get image URL from Pedigree data
      certify: {
        microchip: pedigree.microchip,
        certNo: pedigree.certNo,
        rarity: pedigree.rarity,
        dna: pedigree.dna,
        issuedAt: certificate.updatedAt.getTime(),
      },
      relation: {
        motherTokenId: pedigree.motherId ?? "N/A",
        fatherTokenId: pedigree.fatherId ?? "N/A",
      },
      certificate: {
        no: certificate.no,
        year: certificate.updatedAt.getFullYear() + 543, // Convert to Buddhist year
        isActive: certificate.isActive,
        ownerName: certificate.ownerName,
        bornAt: certificate.bornAt,
        dadId: certificate.dadId,
        momId: certificate.momId,
        fGranDadId: certificate.fGranDadId,
        fGrandMomId: certificate.fGrandMomId,
        mGrandDadId: certificate.mGrandDadId,
        mGrandMomId: certificate.mGrandMomId,
        approvers: certificate.approvers.map((approver) => ({
          wallet: approver.wallet,
          signatureUrl: approver.signatureUrl,
          job: approver.job,
          position: approver.position,
          user: {
            name: approver.user?.name ?? null,
          },
        })),
      },
    };

    console.log(`\n✅ [Result Ready]`);
    console.log(`   - imageUrl in result: ${result.imageUrl === null ? '❌ NULL' : `✅ "${result.imageUrl}"`}`);
    console.log(`${'='.repeat(60)}\n`);

    return result;
  } catch (error) {
    console.error("❌ [EXCEPTION] Error fetching rendering metadata:", error);
    return null;
  }
};

/**
 * Get certificate image from external renderer service (legacy)
 * @deprecated Use local renderer instead for better performance
 */
export const getCertificateImageOf = async (
  microchip: string,
  tokenId: string
) => {
  const response = await axios
    .get(`${process.env.renderer_url!}/${microchip}/${tokenId}`, {
      // .get(`http://localhost:4444/certificate/${microchip}/${tokenId}`, {
      headers: {
        Authorization: `Bearer ${process.env.renderer_key}`,
      },
    })
    .catch((error) => {
      console.log(error.message);
    });

  if (!response) return;

  return response.data.data;
};
