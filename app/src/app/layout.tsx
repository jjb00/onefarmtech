import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StructuredData from "@/components/StructuredData";
import UmamiAnalytics from "@/components/UmamiAnalytics";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/publicSeo";
import { whatsappNumber } from "@/lib/whatsapp";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fresh Produce Supplier for Nigerian Buyers | OneFarmTech",
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Fresh Produce Supplier for Nigerian Buyers",
    description: DEFAULT_DESCRIPTION,
    url: "/",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh Produce Supplier for Nigerian Buyers",
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: [{url: "/favicon.ico"}, {url: "/icon.png", type: "image/png"}],
    apple: [{url: "/apple-icon.png"}],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StructuredData
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/icon.png`,
              areaServed: {"@type": "Country", name: "Nigeria"},
              ...(whatsappNumber
                ? {
                    contactPoint: {
                      "@type": "ContactPoint",
                      telephone: `+${whatsappNumber}`,
                      contactType: "customer service",
                      areaServed: "NG",
                      availableLanguage: ["English"],
                    },
                  }
                : {}),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              publisher: {"@id": `${SITE_URL}/#organization`},
              inLanguage: "en-NG",
            },
          ]}
        />
        {children}
      </body>
      <UmamiAnalytics />
    </html>
  );
}
