import { useQuery } from "@tanstack/react-query";

type Params = {
  id?: string;
};

export default function useCustomerFetch({ id }: Params) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {

      if(id === "new") {
        return {
          name: "",
          address: "",
          phone: ""
        }
      }

      const { data, error } = await window.apiCustomer.getById(Number(id));

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
