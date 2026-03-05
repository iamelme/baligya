import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { PlaceOrderType, SaleType } from "@renderer/shared/utils/types";

type Props = {
  onRemoveCart?: () => void;
};

export default function usePlaceOrder({
  onRemoveCart,
}: Props): UseMutationResult<
  Pick<SaleType, "id"> | null,
  Error,
  PlaceOrderType,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PlaceOrderType) => {
      const { data, error } = await window.apiSale.placeOrder(payload);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      console.log("data place order", data);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      onRemoveCart?.();
      return data;
    },
  });
}
