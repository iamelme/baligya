import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { ReturnAllProductType } from "@renderer/interfaces/IProductRepository";

type Params = {
  userId?: number;
  pageSize: number;
  searchTerm: string;
  currentPage: number;
};

export default function useProductsFetch({
  pageSize,
  searchTerm,
  currentPage,
}: Params): UseQueryResult<ReturnAllProductType["data"]> {
  return useQuery({
    queryKey: [
      "products",
      { search: searchTerm },
      String(pageSize),
      String(currentPage),
    ],
    queryFn: async (searchTerm) => {
      const term = searchTerm?.queryKey?.[1]?.search;

      if (term) {
        const { data, error } = await window.apiProduct.searchProduct(
          String(term),
        );

        if (error instanceof Error) {
          throw new Error(error.message);
        }

        return data;
      }

      const { data, error } = await window.apiProduct.getAllProducts({
        pageSize,
        offset: Number(currentPage) || 0,
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
