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

const CertDetail = () => {
  const router = useRouter();
  const { tokenId } = router.query;
  const { metadata } = useGetMetadataByMicrochip(tokenId! as string);
  const { rewards } = useGetRewardByMicrochip(tokenId! as string);
  const { approvedBy } = useGetApprovalDataByMicrochip(tokenId! as string);

  return (
    <Layout>
      <Head>
        <title key="title">{metadata[0].name}</title>
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
          content={`${metadata[0].name} #${metadata[0].microchip}`}
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
          content={`https://jaothui.com/cert/${metadata[0].microchip}`}
        />
        <meta
          key="og-image"
          name="og:image"
          property="og:image"
          content={`${metadata[0].image}`}
        />
        <meta
          key="twitter-title"
          name="twitter:title"
          content={metadata[0].name}
        />
        <meta
          key="twitter-description"
          name="twitter:description"
          content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jaothui" />
        <meta name="twitter:image" content={`${metadata[0].image}`} />

        <link rel="canonical" href="https://jaothui.com/" />
      </Head>
      {metadata == undefined || metadata == null || metadata.length <= 0 ? (
        <div className="min-h-screen flex justify-center">
          <Loading size="lg" />
        </div>
      ) : (
        <ProfileBoxV2
          certNft={metadata![0]}
          rewards={rewards}
          approvedBy={approvedBy}
        />
      )}
    </Layout>
  );
};

export default CertDetail;
