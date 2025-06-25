import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Financial chart from devExtreme'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <br />
      <h5>Financial Section</h5>
      <Link href="/financial">Financial</Link>
      <br />
      <Link href="/financial/candlestick">Candlestick Financial</Link>
      <br />
      {children}
    </>
  );
}
