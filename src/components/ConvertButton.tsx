"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface ConvertButtonProps {
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
}

export default function ConvertButton({
	onClick,
	disabled = false,
	loading = false,
}: ConvertButtonProps) {
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			aria-busy={loading}
			aria-label={loading ? "Converting file to XML" : "Convert file to XML"}
			className={`
				btn-primary w-full flex items-center justify-center gap-2 py-3 px-6
				transition-all duration-200 ease-in-out
				hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2
				disabled:cursor-not-allowed disabled:opacity-70
				active:transform active:scale-95
			`}
		>
			{loading && (
				<ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
			)}
			<span className="text-lg font-semibold">
				{loading ? "Converting..." : "Convert to XML"}
			</span>
		</button>
	);
}
