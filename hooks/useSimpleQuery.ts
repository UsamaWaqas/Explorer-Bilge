import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { get } from "../api/apiHelper";

export type ApiError = {
  error: boolean;
  message: string;
  statusCode?: number;
};

export const useSimpleQuery = <TData = unknown>(
  key: string,
  url: string,
  params: Record<string, unknown> = {},
  options?: Omit<UseQueryOptions<TData, ApiError>, "queryKey" | "queryFn">,
) => {
  const hasInvalidUrl = url.includes("undefined") || url.includes("null");

  return useQuery<TData, ApiError>({
    queryKey: [key, params],

    queryFn: async () => {
      const response = await get(url, params);

      if (response?.error) {
        throw {
          error: true,
          message: response?.message ?? "Something went wrong",
          statusCode: response?.statusCode,
        } satisfies ApiError;
      }

      return response as TData;
    },

    networkMode: "always",
    retry: (failureCount, error) => {
      if (error?.statusCode === 404 || error?.statusCode === 401) return false;
      return failureCount < 2;
    },

    staleTime: 0,          
    gcTime: 1000 * 60 * 5,
    refetchOnMount: true,  
    refetchOnWindowFocus: true,

    ...options,

    enabled: hasInvalidUrl ? false : (options?.enabled ?? true),
  });
};