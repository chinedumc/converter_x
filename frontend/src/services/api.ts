import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ConversionResponse {
	status: string;
	message: string;
	downloadUrl?: string;
}

interface HeaderField {
	tagName: string;
	tagValue: string;
}

class ApiError extends Error {
	constructor(message: string, public statusCode?: number) {
		super(message);
		this.name = "ApiError";
	}
}

const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000,
	headers: {
		"Content-Type": "multipart/form-data",
	},
});

// Add request interceptor for authentication
api.interceptors.request.use(
	(config) => {
		const token = sessionStorage.getItem("auth_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
		if (error.response?.status === 401) {
			// Handle session timeout
			sessionStorage.removeItem("auth_token");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export const convertExcelToXml = async (
	file: File,
	headerFields: HeaderField[]
): Promise<ConversionResponse> => {
	try {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("header_fields", JSON.stringify(headerFields));

		const response = await api.post<ConversionResponse>("/convert", formData);
		return response.data;
	} catch (error) {
		if (error instanceof AxiosError) {
			console.error("Backend error:", error.response?.data, error);
			const data = error.response?.data as any;
			const errorMessage =
				(typeof data === "string" && data) ||
				data?.message ||
				data?.detail ||
				"Failed to convert file";
			throw new ApiError(errorMessage, error.response?.status);
		}
		throw new ApiError("An unexpected error occurred");
	}
};

export const downloadXml = async (fileId: string): Promise<Blob> => {
	try {
		const response = await api.get(`/download/${fileId}`, {
			responseType: "blob",
		});
		return response.data;
	} catch (error) {
		if (error instanceof AxiosError) {
			console.error("Backend error:", error.response?.data, error);
			const data = error.response?.data as any;
			const errorMessage =
				(typeof data === "string" && data) ||
				data?.message ||
				data?.detail ||
				"Failed to convert file";
			throw new ApiError(errorMessage, error.response?.status);
		}
		throw new ApiError("An unexpected error occurred");
	}
};

export const checkHealth = async (): Promise<boolean> => {
	try {
		const response = await api.get("/health");
		return response.data.status === "healthy";
	} catch {
		return false;
	}
};
