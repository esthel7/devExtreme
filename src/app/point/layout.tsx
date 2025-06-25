import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Point chart from devExtreme'
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
      <Link href="/point">Scatter Point</Link>
      <br />
      <Link href="/point/bubble">Bubble Point</Link>
      <br />
      {children}
    </>
  );
}
