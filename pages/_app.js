import { useEffect } from 'react';
import "@/styles/globals.css";
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.Kakao) {
        window.Kakao = {};
      }
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
      }
    }
  }, []);

  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}
