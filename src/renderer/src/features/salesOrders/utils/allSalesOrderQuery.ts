import { queryOptions } from "@tanstack/react-query";

type Params = {
  startDate: string;
  endDate: string;
  pageSize: number;
  currentPage: string;
};

export default function allSalesOrderQuery({
  startDate,
  endDate,
  pageSize,
  currentPage,
}: Params) {
  return queryOptions({
    queryKey: ["sales-orders", pageSize, currentPage, startDate, endDate],
    queryFn: async () => {
      console.log({ startDate, endDate, pageSize, currentPage });

      const { data, error } = await window.apiSalesOrder.getAll({
        startDate,
        endDate,
        offset: Number(currentPage),
        pageSize,
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
