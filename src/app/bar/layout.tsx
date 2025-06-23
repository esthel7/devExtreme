import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Bar chart from devExtreme'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <br />
      <h5>Bar Section</h5>
      <Link href="/bar">Standard Bar</Link>
      <br />
      <Link href="/bar/side-by-side">Side By Side Bar</Link>
      <br />
      <Link href="/bar/stacked">Stacked Bar</Link>
      <br />
      <Link href="/bar/drill-down">Drill Down Bar</Link>
      <br />
      {children}
    </>
  );
}
