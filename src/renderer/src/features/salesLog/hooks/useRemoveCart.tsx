import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { RefObject } from 'react'

type Props = {
  id: number | undefined
  onAmount: (v: number) => void
  onPaymentMethod: (v: string) => void
  inputRefNoRef: RefObject<HTMLInputElement | null>
  inputRefCustName: RefObject<HTMLInputElement | null>
}

export default function useRemoveCart({
  id,
  onAmount,
  onPaymentMethod,
  inputRefNoRef,
  inputRefCustName
}: Props): UseMutationResult<boolean, Error, void, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!id) {
        throw new Error("Couldn't find the cart")
      }
      const { error } = await window.apiCart.deleteAllItems(id)

      if (error instanceof Error) {
        throw new Error(error.message)
      }

      return true
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      //   mutationInsert.reset()
      onAmount(0)
      onPaymentMethod('cash')
      if (inputRefNoRef.current) {
        inputRefNoRef.current.value = ''
      }
      if (inputRefCustName.current) {
        inputRefCustName.current.value = ''
      }
    }
  })
}
