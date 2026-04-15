import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CreateSalesOrderParams } from "src/main/interfaces/ISalesOrderRepository";

export default function useCreateSalesOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSalesOrderParams) => {
      const {
        success,
        data: returnData,
        error,
      } = await window.apiSalesOrder.create(data);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      if (success) {
        return returnData;
      }

      return success;
    },
    onSuccess: (data) => {
      if (data) {
        navigate(`/so/${data.id}`);
      }

      queryClient.invalidateQueries({
        queryKey: ["sales-order", `${data ? data.id : ""}`],
      });
    },
  });
}
