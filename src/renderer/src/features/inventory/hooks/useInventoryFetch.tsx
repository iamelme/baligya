import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { InventoryMovementReturn } from "../utils/types";
import { InventoryType } from "@renderer/shared/utils/types";

type Params = {
  startDate?: string
  endDate?: string
  pageSize: number
  id?: string
  cursorId: string | null
  direction: string
  onHasLastItem: (v: boolean) => void
}

export default function useInventoryFetch({ startDate, endDate, pageSize, id, cursorId, direction, onHasLastItem }: Params):
  UseQueryResult<{
    productName: string,
    movements: InventoryMovementReturn[] | null
  }> {

export default function useInventoryFetch({
  startDate,
  endDate,
  pageSize,
  id,
  cursorId,
  direction,
  onHasLastItem,
}: Params): UseQueryResult<
  InventoryType & {
    productName: string;
    movements: InventoryMovementReturn[] | null;
  }
> {
  return useQuery({
    queryKey: ['inventory-products', startDate, endDate, pageSize, cursorId, direction],
    queryFn: async () => {

      if (!Number(id)) {
        throw new Error("Couldn't retrieve this inventory")
      }


      const { data, error } = await window.apiInventory.getInventoryById({
        startDate,
        endDate,
        pageSize,
        id: Number(id),
        cursorId: Number(cursorId) || 0,
        direction: direction as 'prev' | 'next'
      })

      if (!data) {
        return {
          id: 0,
          quantity: 0,
          product_id: 0,
          user_id: 0,
          movement_type: 0,
          reference_type: undefined,
          productName: "",
          movements: null,
        };
      }

      if (error instanceof Error) {
        throw new Error(error.message)
      }

      onHasLastItem(false)


      if (data && data?.movements && data?.movements?.length > pageSize) {
        onHasLastItem(true)
        data?.movements?.pop()
      }

      return direction == "next"
        ? data
        : {
            ...data,
            productName: data?.productName,
            movements: data?.movements?.toReversed() || null,
          };
    },
  });
}
