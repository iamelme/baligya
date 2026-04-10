import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query'

type Props = {
  id: number | undefined
  onRemoveCart?: () => void
}

export default function useRemoveItem({
  id,
  onRemoveCart
}: Props): UseMutationResult<void, Error, number, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => {
      if (id) await window.apiCart.removeItem(itemId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      onRemoveCart?.()
      //   if (data?.items?.length === 1) {
      //     mutationRemoveCart.mutate()
      //   }
    }
  })
}
