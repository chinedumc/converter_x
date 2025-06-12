import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Excel to XML Converter",
	description: "A secure and modern Excel to XML conversion tool",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				className={`${inter.className} min-h-screen bg-gradient-to-br from-red-800 via-gray-900 to-red-900 antialiased`}
			>
				<main className="container mx-auto px-4 py-12 min-h-screen">
					{children}
				</main>
			</body>
		</html>
	);
}
