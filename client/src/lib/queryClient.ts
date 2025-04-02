
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const path = queryKey[0] as string;
        console.log("Fetching from path:", path);
        const response = await apiRequest("GET", path);
        return response.json();
      },
    },
  },
});

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
) {
  // Fix double api prefix issue
  const normalizedPath = path.startsWith('/api') ? path : `/api${path}`;
  const response = await fetch(normalizedPath, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body, (key, value) => {
      // Properly serialize Date objects
      return value instanceof Date ? value.toISOString() : value;
    }) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}
