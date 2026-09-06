import './globals.css';
import { Space_Grotesk, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';

// App UI: Space Grotesk for text, JetBrains Mono for anything numeric.
// Fixed-width digits matter here — money, hours and regos sit in columns that
// are read by eye and compared down the page.
const sans = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});
// Printed documents only — a document serif reads as conservative and formal,
// which is what a customer or insurer expects on a quote.
const serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata = {
  title: 'SmashQuote',
  description: 'Quoting & estimating for smash repair shops',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      {/* Extensions (Grammarly, password managers) inject attributes onto <body>
          before React hydrates. Suppression here is one level deep, so real
          mismatches inside the app still surface. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
