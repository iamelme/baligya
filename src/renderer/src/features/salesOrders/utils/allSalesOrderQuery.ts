import { queryOptions } from "@tanstack/react-query";

export default function allSalesOrderQuery() {
  return queryOptions({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const { data, error } = await window.apiSalesOrder.getAll();

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
