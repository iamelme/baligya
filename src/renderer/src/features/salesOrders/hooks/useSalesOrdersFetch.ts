import { useQuery } from "@tanstack/react-query";
import allSalesOrderQuery from "../utils/allSalesOrderQuery";

type Params = {
  startDate: string;
  endDate: string;
  pageSize: number;
  currentPage: string;
};

export default function useSalesOrdersFetch({
  startDate,
  endDate,
  pageSize,
  currentPage,
}: Params) {
  return useQuery(
    allSalesOrderQuery({ startDate, endDate, pageSize, currentPage }),
  );
}
