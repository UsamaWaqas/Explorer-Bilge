// src/hooks/useSimpleQuery.ts

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { get } from '../api/apiHelper';

type ApiError = {
  error: boolean;
  message: string;
};

export const useSimpleQuery = <TData = unknown>(
  key: string,
  url: string,
  params: Record<string, any> = {},
  options?: Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn">
) => {
  return useQuery<TData, Error>({
    queryKey: [key, params],

    queryFn: async () => {
      const response = await get(url, params);

      if (response?.error) {
        throw new Error(response.message);
      }

      return response as TData;
    },

    networkMode: 'always',
    retry: 2,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,

    ...options,
  });
};