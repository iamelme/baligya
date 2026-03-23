import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ProductType } from "../utils/types";

type Props = {
  pageSize?: number;
  startDate: Date | string;
  endDate: Date | string;
};

type Res = Array<
  Pick<ProductType, "id" | "name"> & { net_quantity_sold: number }
> | null;

export default function useTopItems({
  pageSize = 10,
  startDate,
  endDate,
}: Props): UseQueryResult<Res, Error> {
  return useQuery({
    queryKey: ["top-items", startDate, endDate, pageSize],
    queryFn: async () => {
      const { data, error } = await window.apiSale.getTopItems({
        pageSize,
        cursorId: 0,
        lastTotal: 0,
        startDate: !isNaN(new Date(startDate).valueOf())
          ? new Date(startDate).toISOString()
          : "",
        endDate: !isNaN(new Date(endDate).valueOf())
          ? new Date(endDate).toISOString()
          : "",
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
