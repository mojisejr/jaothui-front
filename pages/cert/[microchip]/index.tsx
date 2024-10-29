import { useRouter } from "next/router";
import { useGetApprovalDataByMicrochip } from "../../../blockchain/Metadata/read";
import Layout from "../../../components/Layouts";
import ProfileBoxV2 from "../../../components/Cert/Detail/ProfileBoxV2";
import Loading from "../../../components/Shared/Indicators/Loading";
import { trpc } from "../../../utils/trpc";
import {
  getAllPathParams,
  getSEOMetadata,
} from "../../../server/services/seo.service";
import Head from "next/head";
import { InferGetStaticPropsType } from "next";

const CertDetail = ({
  seo,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const router = useRouter();
  const { microchip } = router.query;
  const { data: metadata } = trpc.metadata.getByMicrochip.useQuery({
    microchip: microchip! as string,
  }) as any;

  const { data: rewards } = trpc.metadata.getRewardByMicrochip.useQuery(
    microchip as string
  );
  const { approvedBy } = useGetApprovalDataByMicrochip(microchip as string);

  return (
    <>
      <Head>
        <title>{seo?.title || "Jaothui NFT Official"}</title>
        <meta
          name="description"
          content={seo?.description || "Jaothui NFT Official"}
        />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seo?.ogUrl} />
        <meta property="og:title" content={seo?.title} />
        <meta property="og:description" content={seo?.description} />
        <meta property="og:image" content={seo?.ogImage} />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo?.ogTwitterTitle} />
        <meta name="twitter:description" content={seo?.ogTwitterDescription} />
        <meta name="twitter:image" content={seo?.ogTwitterImage} />
      </Head>
      <Layout>
        {metadata == undefined || metadata == null || metadata.length <= 0 ? (
          <div className="min-h-screen flex justify-center">
            <Loading size="lg" />
          </div>
        ) : (
          <ProfileBoxV2
            tokenId={metadata.tokenId}
            certNft={metadata!}
            rewards={rewards!}
            approvedBy={approvedBy}
          />
        )}
      </Layout>
    </>
  );
};

export default CertDetail;

export const getStaticPaths = async () => {
  const paths = await getAllPathParams();
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({
  params,
}: {
  params: { microchip: string };
}) => {
  const metadata = await getSEOMetadata(params.microchip);
  return {
    props: { seo: metadata },
    revalidate: 60,
  };
};
