import { useRouter } from "next/router";
import {
  useGetApprovalDataByMicrochip,
  // useGetMetadataByMicrochip,
} from "../../../blockchain/Metadata/read";
import { useGetRewardByMicrochip } from "../../../blockchain/Reward/read";
import Layout from "../../../components/Layouts";
import ProfileBoxV2 from "../../../components/Cert/Detail/ProfileBoxV2";
import Loading from "../../../components/Shared/Indicators/Loading";
import { trpc } from "../../../utils/trpc";
// import { createServerSideHelpers } from "@trpc/react-query/server";
// import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";

const CertDetail = () =>
  // props: InferGetServerSidePropsType<typeof getServerSideProps>
  {
    const router = useRouter();
    const { microchip, i } = router.query;
    // const { metadata } = useGetMetadataByMicrochip(tokenId! as string);
    const { data: metadata } = trpc.metadata.getByMicrochip.useQuery({
      // microchip: props.tokenId,
      tokenId: +(i as string),
      microchip: microchip! as string,
    }) as any;

    const { rewards } = useGetRewardByMicrochip(microchip! as string);
    const { approvedBy } = useGetApprovalDataByMicrochip(microchip as string);

    return (
      <Layout>
        {/* <Head>
        <title key="title">{`${props.seo.name} #${props.seo.certify.microchip}`}</title>
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
          content={`${props.seo.name} #${props.seo.certify.microchip}`}
        />
        <meta
          key="og-title"
          name="og:title"
          property="og:title"
          content={`${props.seo.name} #${props.seo.certify.microchip}`}
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
          content={`https://jaothui.com/cert/${props.seo.certify.microchip}`}
        />
        <meta
          key="og-image"
          name="og:image"
          property="og:image"
          content={`${props.seo.imageUri}`}
        />
        <meta
          key="twitter-title"
          name="twitter:title"
          content={props.seo.name}
        />
        <meta
          key="twitter-description"
          name="twitter:description"
          content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jaothui" />
        <meta name="twitter:image" content={`${props.seo.imageUri}`} />

        <link rel="canonical" href="https://jaothui.com/" />
      </Head> */}
        {metadata == undefined || metadata == null || metadata.length <= 0 ? (
          <div className="min-h-screen flex justify-center">
            <Loading size="lg" />
          </div>
        ) : (
          <ProfileBoxV2
            tokenId={i as string}
            certNft={metadata!}
            rewards={rewards}
            approvedBy={approvedBy}
          />
        )}
      </Layout>
    );
  };

// export const getServerSideProps = async (
//   context: GetServerSidePropsContext<{ tokenId: string }>
// ) => {
//   const helper = createServerSideHelpers({
//     router: appRouter,
//     ctx: {},
//   });

//   const tokenId = context.params?.tokenId as string;

//   await helper.metadata.getByMicrochip.prefetch({ microchip: tokenId });

//   return {
//     props: {
//       trpcState: helper.dehydrate(),
//       tokenId,
//       seo: helper.dehydrate().queries[0].state.data as any,
//     },
//   };
// };

export default CertDetail;
