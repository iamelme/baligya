import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CreateSalesOrderParams } from "src/main/interfaces/ISalesOrderRepository";

export default function useCreateSalesOrder() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: CreateSalesOrderParams) => {
      const { success, error } = await window.apiSalesOrder.create(data);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return success;
    },
    onSuccess: () => {
      navigate(-1);
    },
  });
}
