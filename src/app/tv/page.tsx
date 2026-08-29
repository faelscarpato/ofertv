import TVPlayer from '@/components/TVPlayer';
import Script from 'next/script';

export default function TVPage() {
  return (
    <>
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-N93RZ9JR8N" strategy="afterInteractive" />
      <Script id="google-analytics-tv" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-N93RZ9JR8N');
        `}
      </Script>
      <main className="bg-black min-h-screen">
        <TVPlayer />
      </main>
    </>
  );
}
