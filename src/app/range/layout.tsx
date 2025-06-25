import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Range chart from devExtreme'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <br />
      <h5>Range Section</h5>
      <Link href="/range">Range Bar</Link>
      <br />
      <Link href="/range/area">Range Area</Link>
      <br />
      {children}
    </>
  );
}
