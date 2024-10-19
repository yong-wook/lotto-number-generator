import { useEffect } from 'react';
import "@/styles/globals.css";
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const kakaoScript = document.createElement('script');
      kakaoScript.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      kakaoScript.async = true;
      kakaoScript.onload = () => {
        if (window.Kakao) {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
            console.log('Kakao SDK initialized');
          }
        }
      };
      document.head.appendChild(kakaoScript);
    }
  }, []);

  return <Component {...pageProps} />;
}
