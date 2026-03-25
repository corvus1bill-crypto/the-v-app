/**
 * API Client with retry logic and error handling
 */

export interface ApiOptions extends RequestInit {
  retry?: number;
  retryDelay?: number;
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function apiCall<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    retry = 3,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      // Bail early if already aborted externally
      if (fetchOptions.signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

      // Create abort controller for timeout, linked to any external signal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // If an external signal fires, also abort this request
      const externalSignal = fetchOptions.signal as AbortSignal | undefined;
      const onExternalAbort = () => controller.abort();
      externalSignal?.addEventListener('abort', onExternalAbort);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Parse response
      const data = await response.json();
      return data as T;

    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.name === 'AbortError' ||
        error instanceof ApiError && error.status && error.status >= 400 && error.status < 500
      ) {
        throw error;
      }

      // Retry if we have attempts left
      if (attempt < retry) {
        console.log(`⚠️ API call failed, retrying (${attempt + 1}/${retry})...`);
        await delay(retryDelay * (attempt + 1)); // Exponential backoff
        continue;
      }

      // No more retries
      throw error;
    }
  }

  throw lastError || new Error('Unknown error');
}

/**
 * Optimistic update helper
 */
export function createOptimisticUpdate<T>(
  optimisticFn: () => void,
  apiFn: () => Promise<T>,
  rollbackFn: () => void
): Promise<T> {
  // Apply optimistic update immediately
  optimisticFn();

  // Execute API call
  return apiFn().catch((error) => {
    // Rollback on error
    rollbackFn();
    throw error;
  });
}