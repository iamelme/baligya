import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReturnCartType } from '@renderer/shared/utils/types'

export default function useCart(id: number | undefined): UseQueryResult<ReturnCartType> {
  return useQuery({
    queryKey: ['cart', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('User not found')
        // return undefined
      }

      const { error, data } = await window.apiCart.getByUserId(id)

      if (error instanceof Error) {
        throw new Error(error.message)
      }

      return (
        data ?? {
          id: 0,
          items: [],
          sub_total: 0,
          discount: 0,
          vatable_sales: 0,
          vat_amount: 0,
          tax: 0,
          total: 0
        }
      )
    }
  })
}
