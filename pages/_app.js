import { useEffect } from 'react';
import "@/styles/globals.css";
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.async = true;
      script.onload = () => {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  return <Component {...pageProps} />;
}
