// pages/_app.js
import '../styles/globals.css'; // ✅ Keep this!
import Head from 'next/head';
import { NotificationProvider } from '../contexts/NotificationContext';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>DevSolver</title>
        <meta
          name="description"
          content="Get programming help with official docs and community solutions"
        />
        <link rel="icon" href="/favicon.ico" />
        {/* ❌ Removed Google Fonts */}
      </Head>
      <NotificationProvider>
        <Component {...pageProps} />
      </NotificationProvider>
    </>
  );
}

export default MyApp;
