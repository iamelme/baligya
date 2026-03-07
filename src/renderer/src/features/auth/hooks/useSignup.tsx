import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { NavigateFunction } from "react-router-dom";
import { UserType } from "src/renderer/src/shared/utils/types";

type Params = {
  navigate: NavigateFunction;
};

export default function useSignup({
  navigate,
}: Params): UseMutationResult<void, Error, UserType, unknown> {
  return useMutation({
    mutationFn: async (data: UserType): Promise<void> => {
      await window.apiUser.create(data);
    },
    onSuccess: () => {
      navigate("/auth");
    },
  });
}
