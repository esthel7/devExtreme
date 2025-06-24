import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Doughnut chart from devExtreme'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <br />
      <h5>Doughnut Section</h5>
      <Link href="/doughnut">Doughnut</Link>
      <br />
      <Link href="/doughnut/multiple">Multiple Doughnut</Link>
      <br />
      {children}
    </>
  );
}
