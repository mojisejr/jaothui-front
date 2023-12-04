import { useRouter } from "next/router";
import {
  useGetApprovalDataByMicrochip,
  useGetMetadataByMicrochip,
} from "../../blockchain/Metadata/read";
import { useGetRewardByMicrochip } from "../../blockchain/Reward/read";
import Layout from "../../components/Layouts";
import ProfileBoxV2 from "../../components/Cert/Detail/ProfileBoxV2";
import Loading from "../../components/Shared/Indicators/Loading";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { appRouter } from "../../server/routers/_app";

const CertDetail = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  // const router = useRouter();
  // const { tokenId } = router.query;
  // const { metadata } = useGetMetadataByMicrochip(tokenId! as string);
  const { data: metadata } = trpc.metadata.getByMicrochip.useQuery({
    microchip: props.tokenId,
  }) as any;

  const { rewards } = useGetRewardByMicrochip(props.tokenId! as string);
  const { approvedBy } = useGetApprovalDataByMicrochip(
    props.tokenId! as string
  );

  return (
    <Layout>
      {metadata == undefined ? null : (
        <Head>
          <title key="title">{metadata.name}</title>
          <meta
            key="keywords"
            name="keywords"
            content={`Jaothui, JaothuiNFT, NFT, Pedigree, Kwaithai, Jaothui Official`}
          />
          <meta
            key="description"
            name="description"
            content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
          />
          <meta
            key="og-title"
            name="og:title"
            property="og:title"
            content={`${metadata.name} #${metadata.microchip}`}
          />
          <meta
            key="og-description"
            name="og:description"
            property="og:description"
            content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
          />
          <meta
            key="og-url"
            name="og:url"
            property="og:url"
            content={`https://jaothui.com/cert/${metadata.microchip}`}
          />
          <meta
            key="og-image"
            name="og:image"
            property="og:image"
            content={`${metadata.image}`}
          />
          <meta
            key="twitter-title"
            name="twitter:title"
            content={metadata.name}
          />
          <meta
            key="twitter-description"
            name="twitter:description"
            content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@jaothui" />
          <meta name="twitter:image" content={`${metadata.image}`} />

          <link rel="canonical" href="https://jaothui.com/" />
        </Head>
      )}
      {metadata == undefined || metadata == null || metadata.length <= 0 ? (
        <div className="min-h-screen flex justify-center">
          <Loading size="lg" />
        </div>
      ) : (
        <ProfileBoxV2
          certNft={metadata!}
          rewards={rewards}
          approvedBy={approvedBy}
        />
      )}
    </Layout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ tokenId: string }>
) => {
  const helper = createServerSideHelpers({
    router: appRouter,
    ctx: {},
  });

  const tokenId = context.params?.tokenId as string;

  await helper.metadata.getByMicrochip.prefetch({ microchip: tokenId });

  return {
    props: {
      trpcState: helper.dehydrate(),
      tokenId,
    },
  };
};

export default CertDetail;
