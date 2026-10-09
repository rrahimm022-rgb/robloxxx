import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Asset Forge — Creator Toolkit', description: 'An all-in-one workspace for Roblox creators and digital asset workflows.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
