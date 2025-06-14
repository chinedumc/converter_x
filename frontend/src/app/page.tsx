"use client";

import { useState } from "react";
import HeaderFieldBuilder from "../components/HeaderFieldBuilder";
import ExcelUploader from "../components/ExcelUploader";
import ConvertButton from "../components/ConvertButton";
import ProgressIndicator from "../components/ProgressIndicator";
import { convertExcelToXml } from "../services/api";

interface HeaderField {
	tagName: string;
	tagValue: string;
}

export default function Home() {
	const [headerFields, setHeaderFields] = useState<HeaderField[]>([
		{ tagName: "", tagValue: "" },
	]);
	const [file, setFile] = useState<File | null>(null);
	const [converting, setConverting] = useState(false);
	const [progress, setProgress] = useState(0);
	const [xmlPreview, setXmlPreview] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState(false);

	const handleConversion = async () => {
		if (!file || !isValid) {
			setError(
				"Please ensure all fields are valid and an Excel file is uploaded"
			);
			return;
		}

		try {
			setConverting(true);
			setProgress(0);
			setError(null);

			// Start progress indication
			const progressInterval = setInterval(() => {
				setProgress((prev) => Math.min(prev + 10, 90));
			}, 500);

			// Call the API for conversion
			const response = await convertExcelToXml(file, headerFields);

			// Clear the progress interval
			clearInterval(progressInterval);
			setProgress(100);

			// Handle the download URL
			if (response.downloadUrl) {
				window.location.href = response.downloadUrl;
			} else {
				throw new Error("No download URL received from server");
			}
		} catch (error) {
			console.error("Conversion failed:", error);
			setError(
				error instanceof Error
					? `Conversion failed: ${error.message}`
					: "An unexpected error occurred during conversion. Please try again."
			);
			setProgress(0);
		} finally {
			setConverting(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-8">
			<h1 className="text-4xl font-bold text-center text-white mb-8">
				Excel to XML Converter
			</h1>

			<div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
				<section aria-label="Excel File Upload" className="space-y-4">
					<h2 className="text-2xl font-semibold text-gray-800">
						1. Upload Excel File
					</h2>
					<ExcelUploader
						file={file}
						setFile={setFile}
						disabled={converting}
						onError={(errorMessage) => setError(errorMessage)}
					/>
				</section>

				<section aria-label="Header Fields Configuration" className="space-y-4">
					<h2 className="text-2xl font-semibold text-gray-800">
						2. Configure Header Fields
					</h2>
					<HeaderFieldBuilder
						fields={headerFields}
						setFields={setHeaderFields}
						preview={xmlPreview}
						setPreview={setXmlPreview}
						disabled={converting}
						onValidationChange={setIsValid}
					/>
				</section>

				<section aria-label="Conversion Actions" className="space-y-4">
					<h2 className="text-2xl font-semibold text-gray-800">
						3. Convert to XML
					</h2>
					<ConvertButton
						onClick={handleConversion}
						disabled={!file || !isValid || converting}
						loading={converting}
					/>
					{converting && <ProgressIndicator progress={progress} />}
				</section>

				{error && (
					<div
						className="bg-red-50 border-l-4 border-red-400 p-4 mt-4"
						role="alert"
					>
						<p className="text-red-700">{error}</p>
					</div>
				)}

				{xmlPreview && (
					<section aria-label="XML Preview" className="space-y-2">
						<h2 className="text-2xl font-semibold text-gray-800">Preview</h2>
						<pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
							{xmlPreview}
						</pre>
					</section>
				)}
			</div>
		</div>
	);
}
