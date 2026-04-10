import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query'

type Props = {
  id: number | undefined
  total: number
}

export default function useDiscount({
  id,
  total
}: Props): UseMutationResult<void, Error, number, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (discount: number) => {
      if (!id) {
        return
      }

      await window.apiCart.updateDiscount({ discount, total, cart_id: id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  })
}
