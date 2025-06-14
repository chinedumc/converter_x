"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ExcelUploaderProps {
	file: File | null;
	setFile: (file: File | null) => void;
	disabled?: boolean;
	onError?: (error: string) => void;
}

export default function ExcelUploader({
	file,
	setFile,
	disabled = false,
	onError,
}: ExcelUploaderProps) {
	const [error, setError] = useState("");
	const [isDragReject, setIsDragReject] = useState(false);

	const handleError = (message: string) => {
		setError(message);
		onError?.(message);
	};

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			setError("");
			setIsDragReject(false);
			const file = acceptedFiles[0];

			// Validate file type
			const validTypes = [
				"application/vnd.ms-excel",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			];

			if (!validTypes.includes(file.type)) {
				handleError("Please upload only Excel files (.xls or .xlsx)");
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				handleError("File size must be less than 10MB");
				return;
			}

			setFile(file);
		},
		[setFile, handleError]
	);

	const { getRootProps, getInputProps, isDragActive, isDragAccept } =
		useDropzone({
			onDrop,
			disabled,
			accept: {
				"application/vnd.ms-excel": [".xls"],
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
					".xlsx",
				],
			},
			multiple: false,
			onDropRejected: () => setIsDragReject(true),
		});

	const removeFile = useCallback(() => {
		setFile(null);
		setError("");
		setIsDragReject(false);
	}, [setFile]);

	return (
		<div
			className="space-y-4"
			role="region"
			aria-label="Excel file upload area"
		>
			<div
				{...getRootProps()}
				className={`
					border-2 border-dashed rounded-lg p-6 text-center
						transition-all duration-200 ease-in-out
						${isDragActive && !isDragReject ? "border-wine-500 bg-wine-50/30" : ""}
						${isDragAccept ? "border-green-500 bg-green-50/30" : ""}
						${isDragReject ? "border-red-500 bg-red-50/30" : ""}
						${
							!isDragActive && !disabled
								? "border-gray-300 hover:border-wine-500 hover:bg-gray-50/50 cursor-pointer"
								: ""
						}
						${disabled ? "opacity-50 cursor-not-allowed bg-gray-50/50" : ""}
				`}
				aria-disabled={disabled}
			>
				<input {...getInputProps()} aria-label="Excel file input" />
				<div className="flex flex-col items-center justify-center space-y-1">
					{/* Excel upload icon with increased size */}
					<img
						src="/excel-icon.png"
						alt="Excel upload"
						className="mx-auto mb-2"
						style={{ width: 100, height: 100 }}
					/>
					<div className="text-center">
						<p
							className={`text-sm font-medium ${
								isDragReject
									? "text-red-600"
									: isDragActive
									? "text-wine-600"
									: "text-gray-700"
							}`}
						>
							{isDragReject
								? "This file type is not supported"
								: isDragActive
								? "Drop the Excel file here..."
								: "Drag & drop an Excel file here"}
						</p>
						<p className="text-xs text-gray-500 mt-1">
							{!isDragActive && "or click to select"}
						</p>
						<p className="text-xs text-gray-400 mt-2">
							Supported: .xls, .xlsx (max 10MB)
						</p>
					</div>
				</div>
			</div>

			{error && (
				<p className="error-text" role="alert" aria-live="polite">
					{error}
				</p>
			)}

			{file && !error && (
				<div
					className="flex items-center justify-between bg-green-50 p-4 rounded-lg"
					role="status"
					aria-label="Selected file"
				>
					<div className="flex items-center overflow-hidden">
						<img
							src="/excel-icon.png"
							alt="Excel file"
							className="flex-shrink-0"
							style={{
								width: 20,
								height: 20,
								marginRight: 12,
								padding: 4,
								display: "inline-block",
								verticalAlign: "middle",
							}}
						/>
						<span
							className="text-sm text-green-700 truncate align-middle"
							title={file.name}
							style={{
								marginLeft: 0,
								paddingLeft: 0,
								lineHeight: "20px",
								display: "inline-block",
								verticalAlign: "middle",
							}}
						>
							{file.name}
						</span>
					</div>
					<button
						onClick={removeFile}
						className="text-green-700 hover:text-green-900 px-3 py-1 rounded-full
							hover:bg-green-100 transition-colors duration-200
							focus:outline-none focus:ring-2 focus:ring-green-500 text-xs font-medium"
						disabled={disabled}
						aria-label="Remove file"
						name="remove-excel-file-button"
					>
						Remove File
					</button>
				</div>
			)}
		</div>
	);
}
