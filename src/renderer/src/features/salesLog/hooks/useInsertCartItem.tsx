import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { RefObject } from 'react'

type Props = {
  id: number | undefined
  userId: number | undefined
  inputRef: RefObject<HTMLInputElement | null>
}

export default function useInsertCartItem({
  id,
  userId,
  inputRef
}: Props): UseMutationResult<void, Error, number, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: number): Promise<void> => {
      const { error, data: product } = await window.apiProduct.getProductByCode(code)
      console.log({ error, product })

      if (product) {
        if (inputRef.current && id && userId) {
          const payload = {
            cart_id: id,
            user_id: userId,
            product_id: product.id
          }
          const { error } = await window.apiCart.insertItem(payload)
          if (error instanceof Error) {
            console.error(error.message)
            throw new Error(error.message)
          }
        }
      }

      if (error instanceof Error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  })
}
