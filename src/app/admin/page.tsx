import AdminDashboard from '@/components/AdminDashboard';
import Script from 'next/script';

export default function AdminPage() {
  return (
    <>
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-90EL2LXW9V" strategy="afterInteractive" />
      <Script id="google-analytics-admin" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-90EL2LXW9V');
        `}
      </Script>
      <main>
        <AdminDashboard />
      </main>
    </>
  );
}
