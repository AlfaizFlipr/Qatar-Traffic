import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { useAdminAuth } from '../context/AdminAuthContext'
import type { Paginated } from '../api/admin'

interface State<T> {
  items: T[]
  total: number
  totalAmount: number
  totalViolations: number
  page: number
  loading: boolean
  error: string | null
  search: string
}

const initial = {
  items: [],
  total: 0,
  totalAmount: 0,
  totalViolations: 0,
  page: 1,
  loading: true,
  error: null,
  search: '',
}

/** Loads paginated admin data, handling search, paging, and 401-logout. */
export function usePagedData<T>(
  fetcher: (params: { page: number; limit: number; search: string }) => Promise<Paginated<T>>,
  limit: number,
) {
  const { logout } = useAdminAuth()
  const [state, setState] = useState<State<T>>(initial as State<T>)

  const load = useCallback(
    async (page: number, search: string) => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await fetcher({ page, limit, search })
        setState({
          items: data.items,
          total: data.total,
          totalAmount: data.totalAmount ?? 0,
          totalViolations: data.totalViolations ?? 0,
          page: data.page,
          loading: false,
          error: null,
          search,
        })
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return logout()
        setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Failed to load' }))
      }
    },
    [fetcher, limit, logout],
  )

  useEffect(() => {
    load(1, '')
  }, [load])

  return {
    state,
    onSearch: (q: string) => load(1, q),
    onPage: (p: number) => load(p, state.search),
  }
}
