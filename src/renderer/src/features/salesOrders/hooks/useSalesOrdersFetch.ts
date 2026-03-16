import { useQuery } from "@tanstack/react-query";
import allSalesOrderQuery from "../utils/allSalesOrderQuery";

export default function useSalesOrdersFetch() {
  return useQuery(allSalesOrderQuery());
}
