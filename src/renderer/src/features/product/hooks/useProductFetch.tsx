import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ProductType } from "@renderer/shared/utils/types";

type Params = {
  id?: string;
};

export default function useProductFetch({
  id,
}: Params): UseQueryResult<Omit<ProductType, "id">> {
  return useQuery({
    queryKey: ["product", { id }],
    queryFn: async () => {
      if (!id) {
        throw new Error("Couldn't fetch this product");
      }

      if (id !== "new") {
        const { data, error } = await window.apiProduct.getProductById(
          Number(id),
        );

        if (error instanceof Error) {
          throw new Error(error.message);
        }

        return {
          ...data,
          price: data?.price / 100,
          cost: data?.cost / 100,
        };
      }

      return {
        name: "",
        sku: "",
        description: "",
        price: 0,
        quantity: 0,
        code: 0,
        cost: 0,
        is_active: 0,
        user_id: null,
        updated_by: null,
        category_id: null,
        inventory_id: null,
      };
    },
  });
}
