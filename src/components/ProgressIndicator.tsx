"use client";

interface ProgressIndicatorProps {
	progress: number;
}

export default function ProgressIndicator({
	progress,
}: ProgressIndicatorProps) {
	const roundedProgress = Math.round(progress);
	const status = progress < 100 ? "Converting..." : "Conversion complete!";

	return (
		<div
			className="mt-6 space-y-2"
			role="region"
			aria-label="Conversion Progress"
		>
			<div
				className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
				role="progressbar"
				aria-valuenow={roundedProgress}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuetext={`${status} ${roundedProgress}%`}
			>
				<div
					className="bg-red-600 h-full rounded-full transition-all duration-300 ease-in-out"
					style={{ width: `${roundedProgress}%` }}
				/>
			</div>
			<p className="text-sm text-gray-700 text-center font-medium">
				{status} ({roundedProgress}%)
			</p>
		</div>
	);
}
