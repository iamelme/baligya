import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { UpdateSalesOrderParams } from "src/main/interfaces/ISalesOrderRepository";

export default function useUpdateSalesOrder() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: UpdateSalesOrderParams) => {
      const { success, error } = await window.apiSalesOrder.update(data);

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
