import { useQuery } from "@tanstack/react-query";
import salesOrderQueryOptions from "../utils/salesOrderQuery";

export default function useSalesOrderFetch(id: string) {
  return useQuery(salesOrderQueryOptions(id));
}
