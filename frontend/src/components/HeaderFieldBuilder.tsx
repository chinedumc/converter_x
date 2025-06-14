"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface HeaderField {
	tagName: string;
	tagValue: string;
	isValid?: boolean;
}

interface HeaderFieldBuilderProps {
	fields: HeaderField[];
	setFields: (fields: HeaderField[]) => void;
	preview: string;
	setPreview: (preview: string) => void;
	disabled?: boolean;
	onValidationChange?: (isValid: boolean) => void;
}

export default function HeaderFieldBuilder({
	fields,
	setFields,
	preview,
	setPreview,
	disabled = false,
	onValidationChange,
}: HeaderFieldBuilderProps) {
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	const addField = useCallback(() => {
		setFields([...fields, { tagName: "", tagValue: "", isValid: true }]);
	}, [fields, setFields]);

	const removeField = useCallback(
		(index: number) => {
			setFields(fields.filter((_, i) => i !== index));
			setValidationErrors(validationErrors.filter((_, i) => i !== index));
		},
		[fields, setFields, validationErrors]
	);

	const updateField = useCallback(
		(index: number, field: Partial<HeaderField>) => {
			const newFields = [...fields];
			newFields[index] = { ...newFields[index], ...field };

			// Validate tag name if it's being updated
			if ("tagName" in field) {
				const isValid = validateTagName(field.tagName || "");
				newFields[index].isValid = isValid;

				const newErrors = [...validationErrors];
				if (!isValid && field.tagName) {
					newErrors[index] =
						"Tag name must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens";
				} else {
					newErrors[index] = "";
				}
				setValidationErrors(newErrors);
			}

			setFields(newFields);
		},
		[fields, setFields, validationErrors]
	);

	// XML validation regex patterns
	const tagNamePattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

	const validateTagName = useCallback((tagName: string): boolean => {
		return tagNamePattern.test(tagName);
	}, []);

	// Check overall form validity
	useEffect(() => {
		const isValid = fields.every(
			(field) =>
				(!field.tagName && !field.tagValue) || // Empty fields are considered valid
				(field.tagName && field.tagValue && validateTagName(field.tagName))
		);
		onValidationChange?.(isValid);
	}, [fields, validateTagName, onValidationChange]);

	// Generate XML preview
	useEffect(() => {
		const xmlContent = fields
			.filter((field) => field.tagName && field.tagValue && field.isValid)
			.map(
				(field) => `  <${field.tagName}>${field.tagValue}</${field.tagName}>`
			)
			.join("\n");

		const fullXml = xmlContent ? `<HEADER>\n${xmlContent}\n</HEADER>` : "";
		setPreview(fullXml);
	}, [fields, setPreview]);

	return (
		<div
			className="space-y-4"
			role="region"
			aria-label="XML Header Fields Builder"
		>
			<div className="space-y-6">
				{fields.map((field, index) => (
					<div
						key={index}
						className="flex gap-4 items-start p-4 rounded-lg bg-gray-50"
						role="group"
						aria-label={`Header Field ${index + 1}`}
					>
						<div className="flex-1 space-y-2">
							<label
								className="form-label block font-medium mb-1"
								htmlFor={`tagName-${index}`}
							>
								Tag Name
							</label>
							<input
								type="text"
								id={`tagName-${index}`}
								className={`input-field w-full transition-colors duration-200 mt-1 mb-3 ml-1 mr-2 px-3 py-2 rounded border
									${
										field.tagName && !field.isValid
											? "border-red-500 focus:border-red-500"
											: "border-gray-300 focus:border-wine-500"
									}
								`}
								value={field.tagName}
								onChange={(e) =>
									updateField(index, { tagName: e.target.value })
								}
								placeholder="e.g., CALLREPORT_ID"
								disabled={disabled}
								aria-invalid={
									field.tagName && !field.isValid ? true : undefined
								}
								aria-describedby={
									validationErrors[index] ? `error-${index}` : undefined
								}
							/>
							{validationErrors[index] && (
								<p
									id={`error-${index}`}
									className="error-text text-sm"
									role="alert"
								>
									{validationErrors[index]}
								</p>
							)}
						</div>

						<div className="flex-1 space-y-2">
							<label
								className="form-label block font-medium mb-1"
								htmlFor={`tagValue-${index}`}
							>
								Tag Value
							</label>
							<input
								type="text"
								id={`tagValue-${index}`}
								className="input-field w-full mt-1 mb-3 ml-1 mr-2 px-3 py-2 rounded border border-gray-300 focus:border-wine-500"
								value={field.tagValue}
								onChange={(e) =>
									updateField(index, { tagValue: e.target.value })
								}
								placeholder="e.g., DTR001"
								disabled={disabled}
							/>
						</div>

						{fields.length > 1 && (
							<button
								onClick={() => removeField(index)}
								className="p-2 text-red-500 hover:text-red-700 rounded-full
									hover:bg-red-50 transition-colors duration-200
									focus:outline-none focus:ring-2 focus:ring-red-500"
								aria-label={`Remove field ${index + 1}`}
								disabled={disabled}
							>
								<XCircleIcon className="h-6 w-6" aria-hidden="true" />
							</button>
						)}
					</div>
				))}
			</div>

			<button
				onClick={addField}
				className={`
					btn-primary w-full flex items-center justify-center gap-2 py-3
					transition-all duration-200 ease-in-out
					hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2
					${disabled ? "opacity-50 cursor-not-allowed" : ""}
				`}
				type="button"
				disabled={disabled}
			>
				<PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
				<span>Add Field</span>
			</button>

			{preview && (
				<div className="mt-6" role="region" aria-label="XML Preview">
					<h3 className="text-lg font-semibold mb-2">Preview</h3>
					<pre
						className="bg-gray-100 p-4 rounded-lg overflow-x-auto"
						tabIndex={0}
						role="textbox"
						aria-label="XML Preview Content"
						aria-readonly="true"
					>
						{preview}
					</pre>
				</div>
			)}
		</div>
	);
}
