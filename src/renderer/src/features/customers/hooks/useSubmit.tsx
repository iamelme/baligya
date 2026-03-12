import { CustomerType } from "@renderer/shared/utils/types";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

type Params = {
  id?: string;
};

export default function useSubmit({
  id,
}: Params): UseMutationResult<void, Error, CustomerType, unknown> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      console.log("submit data", data);
      const { error } =
        id !== "new"
          ? await window.apiCustomer.update({ ...data, id: Number(id) })
          : await window.apiCustomer.create(data);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      navigate(-1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
