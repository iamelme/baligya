import { useQuery } from "@tanstack/react-query";
import allSalesReturnQuery from "../utils/allSalesReturnQuery";

type Params = {
  pageSize: number;
  normalizedStart: string;
  normalizedEnd: string;
  offset: string;
};

export default function useSalesReturnsFetch({
  pageSize,
  normalizedStart,
  normalizedEnd,
  offset,
}: Params) {
  return useQuery(
    allSalesReturnQuery({
      pageSize,
      normalizedStart,
      normalizedEnd,
      offset,
    }),
  );
}
