import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import config from "@/data/config";

export const metadata = {
  title: {
    default: `${config.name} · Developer & Systems Builder`,
    template: `%s | ${config.name}`,
  },
  description: config.tagline,
  authors: [{ name: config.name }],
  openGraph: {
    type: "website",
    siteName: config.name,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
