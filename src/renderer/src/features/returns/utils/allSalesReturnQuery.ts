import { queryOptions } from "@tanstack/react-query";

type Params = {
  pageSize: number;
  normalizedStart: string;
  normalizedEnd: string;
  offset: string;
};

export default function allSalesReturnQuery({
  pageSize,
  normalizedStart,
  normalizedEnd,
  offset,
}: Params) {
  return queryOptions({
    queryKey: [
      "sales-returns",
      pageSize,
      normalizedStart,
      normalizedEnd,
      offset,
    ],
    queryFn: async () => {
      const { data, error } = await window.apiReturn.getAll({
        pageSize,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        offset: Number(offset) || 0,
      });

      // {
      //         startDate,
      //         endDate,
      //         offset: Number(currentPage),
      //         pageSize,
      //       }

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
