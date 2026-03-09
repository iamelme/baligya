import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ReturnAllProductType } from "@renderer/interfaces/IProductRepository";

type Params = {
  searchTerm: string | null;
};

export default function useProductSearch({
  searchTerm,
}: Params): UseQueryResult<ReturnAllProductType["data"]> {
  return useQuery({
    queryKey: ["product", { search: searchTerm }],
    queryFn: async (searchTerm) => {
      const value = searchTerm.queryKey[1].search;

      if (value) {
        const { data, error } = await window.apiProduct.searchProduct(
          String(value),
        );

        if (error instanceof Error) {
          throw new Error(error.message);
        }

        return data;
      }

      return {
        total: 0,
        results: null,
      };
    },
  });
}
