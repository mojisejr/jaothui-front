import Document, { Html, Head, Main, NextScript } from "next/document";
import { useRouter } from "next/router";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta
            name="description"
            content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
          />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;500;600;800&display=swap"
            rel="stylesheet"
          />

          <title>Jaothui Official</title>
          <meta
            key="keywords"
            name="keywords"
            content={`Jaothui, JaothuiNFT, NFT, Pedigree, Kwaithai, Jaothui Official`}
          />
          <meta
            key="og-title"
            name="og:title"
            property="og:title"
            content={`Jaothui NFT Official`}
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
            content={`https://jaothui.com`}
          />
          <meta
            key="og-image"
            name="og:image"
            property="og:image"
            // content={`https://nftstorage.link/ipfs/bafkreifuxnild7y5degh4bt4puu3cnkk6r74cqcboukih5rwipr2xzaeoy`}
            content={`https://jaothui.com/api/og`}
            // content={`http://localhost:3000/api/og?tokenId=${tokenId}`}
          />
          <meta
            key="twitter-title"
            name="twitter:title"
            content={"Jaothui NFT Official"}
          />
          <meta
            key="twitter-description"
            name="twitter:description"
            content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@jaothui" />
          <meta
            name="twitter:image"
            content={`https://nftstorage.link/ipfs/bafkreifuxnild7y5degh4bt4puu3cnkk6r74cqcboukih5rwipr2xzaeoy`}
          />

          <link rel="canonical" href="https://jaothui.com/" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
