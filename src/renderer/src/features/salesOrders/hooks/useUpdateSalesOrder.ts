import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { UpdateSalesOrderParams } from "src/main/interfaces/ISalesOrderRepository";

export default function useUpdateSalesOrder() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSalesOrderParams) => {
      const {
        success,
        data: returnData,
        error,
      } = await window.apiSalesOrder.update(data);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      if (success) {
        return returnData;
      }

      return success;
    },
    onSuccess: (data, variables) => {
      console.log(variables.id);
      queryClient.invalidateQueries({
        queryKey: ["sales-order", `${variables?.id}`],
      });

      console.log({ data, variables });

      if (data && data?.id) {
        navigate(`/sales/${data.id}`);
        return;
      }

      if (variables?.id) {
        navigate(`/so/${variables.id}`);
      }
    },
  });
}
