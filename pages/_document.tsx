import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <title>Jaothui NFT Official</title>
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
