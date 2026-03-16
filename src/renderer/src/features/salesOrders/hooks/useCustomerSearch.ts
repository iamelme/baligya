import { useQuery } from "@tanstack/react-query";

type Params = {
  searchTerm?: string;
};

export default function useCustomerSearch({ searchTerm }: Params) {
  return useQuery({
    queryKey: ["customer", searchTerm],
    queryFn: async () => {
      if (searchTerm) {
        const { data, error } = await window.apiCustomer.search(searchTerm);
        if (error instanceof Error) {
          throw new Error(error.message);
        }

        return data;
      }

      return null;
    },
  });
}
