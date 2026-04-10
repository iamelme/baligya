import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { RefObject } from 'react'

type Props = {
  id: number | undefined
  btnUpdateQtyRef: RefObject<Record<number, { quantity: number } & HTMLElement>>
}

export default function useUpdateItemQty({
  id,
  btnUpdateQtyRef
}: Props): UseMutationResult<void, Error, number, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => {
      if (!id) {
        return
      }

      const quantity = btnUpdateQtyRef?.current[itemId].quantity
      console.log({ quantity })

      await window.apiCart.updateItemQty({ id: itemId, cart_id: id, quantity })
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })

      if (btnUpdateQtyRef.current) {
        btnUpdateQtyRef.current[variables].click()
        btnUpdateQtyRef.current[variables].quantity = 0
      }
    }
  })
}
