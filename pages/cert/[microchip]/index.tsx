import { useRouter } from "next/router";
import Head from "next/head";
import { InferGetServerSidePropsType } from "next";
import { trpc } from "../../../utils/trpc";
import { getSEOMetadata } from "../../../server/services/seo.service";
import BuffaloDetailV2 from "../../../components/Cert/Detail/BuffaloDetailV2";
import { V2Layout, Spinner } from "../../../components/v2";

const CertDetail = ({
  seo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { microchip, e, vote } = router.query;
  const { data: metadata } = trpc.metadata.getByMicrochip.useQuery({
    microchip: microchip! as string,
  }) as any;

  const { data: rewards } = trpc.metadata.getRewardByMicrochip.useQuery(
    microchip as string
  );

  const loading =
    metadata == undefined || metadata == null || metadata.length <= 0;

  return (
    <>
      <Head>
        <title>{seo?.title}</title>
        {/* Open Graph Meta Tags */}
        <meta property="og:type" key="og-url" name="og:url" content="website" />
        <meta property="og:url" key="og-url" name="og:url" content={seo?.ogUrl} />
        <meta property="og:title" key="og-title" name="og:title" content={seo?.title} />
        <meta
          property="og:description"
          key="og-description"
          name="og:description"
          content={seo?.description}
        />
        <meta
          property="og:image"
          key="og-image"
          name="og:image"
          content={`https://jaothui.com/api/seo/og?tokenId=${seo?.tokenId}`}
        />
      </Head>
      {loading ? (
        <V2Layout activeTab="buffalo">
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </V2Layout>
      ) : (
        <BuffaloDetailV2
          tokenId={metadata.tokenId}
          certNft={metadata!}
          rewards={rewards!}
          vote={Boolean(vote)!}
          eventId={e as string}
        />
      )}
    </>
  );
};

export default CertDetail;

export const getServerSideProps = async (context: {
  params: { microchip: string };
}) => {
  const { microchip } = context.params!;
  const seo = await getSEOMetadata(microchip);

  return {
    props: { seo },
  };
};
