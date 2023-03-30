import { useCallback, useContext } from "react"
import { AppContext } from "../utils/context"
import { fakeFetch, RegisteredEndpoints } from "../utils/fetch"
import { useWrappedRequest } from "./useWrappedRequest"

export function useCustomFetch() {
  const { cache, currentTransactionRequest } = useContext(AppContext)
  const { loading, wrappedRequest } = useWrappedRequest()

  const fetchWithCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData | null>(async () => {
        if (currentTransactionRequest) {
          currentTransactionRequest.current = currentTransactionRequest.current += 1
        }
        const current = currentTransactionRequest?.current

        const cacheKey = getCacheKey(endpoint, params)
        const cacheResponse = cache?.current.get(cacheKey)

        if (cacheResponse) {
          const data = JSON.parse(cacheResponse)
          return data as Promise<TData>
        }

        const result = await fakeFetch<TData>(endpoint, params)
        cache?.current.set(cacheKey, JSON.stringify(result))

        /* Return null to prevent fakeFetch result overriding 
           transactions from cacheResponse if returned between 
           fakeFetch invocation and its associated resolve. 
        */
        if (current !== currentTransactionRequest?.current && endpoint !== "employees") {
          return null
        }

        return result
      }),
    [cache, wrappedRequest, currentTransactionRequest]
  )

  const fetchWithoutCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const result = await fakeFetch<TData>(endpoint, params)
        return result
      }),
    [wrappedRequest]
  )

  const clearCache = useCallback(() => {
    if (cache?.current === undefined) {
      return
    }

    cache.current = new Map<string, string>()
  }, [cache])

  const clearCacheByEndpoint = useCallback(
    (endpointsToClear: RegisteredEndpoints[]) => {
      if (cache?.current === undefined) {
        return
      }

      const cacheKeys = Array.from(cache.current.keys())

      for (const key of cacheKeys) {
        const clearKey = endpointsToClear.some((endpoint) => key.startsWith(endpoint))

        if (clearKey) {
          cache.current.delete(key)
        }
      }
    },
    [cache]
  )

  const clearCacheByKey = useCallback(
    (key: string) => {
      if (cache?.current === undefined) {
        return
      }
      cache.current.delete(key)
    },
    [cache]
  )

  return {
    fetchWithCache,
    fetchWithoutCache,
    clearCache,
    clearCacheByEndpoint,
    clearCacheByKey,
    loading,
  }
}

function getCacheKey(endpoint: RegisteredEndpoints, params?: object) {
  return `${endpoint}${params ? `@${JSON.stringify(params)}` : ""}`
}
