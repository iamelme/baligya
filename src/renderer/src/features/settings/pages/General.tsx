import { ReactNode } from "react";
import FormWrapper from "@renderer/shared/components/form/FormWrapper";
import z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsType } from "../utils/type";
import { useNavigate } from "react-router-dom";
import Alert from "@renderer/shared/components/ui/Alert";
import GeneralForm from "../components/GeneralForm";
import Logo from "../components/Logo";

const schema = z.object({
  tax: z.coerce.number(),
  is_tax_inclusive: z.coerce.number().default(1),
  is_redirect_to_sales: z.coerce.number().default(0),
});

type ValuesType = z.infer<typeof schema>;

export default function GeneralPage(): ReactNode {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await window.apiSettings.getSettings();

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<SettingsType>) => {
      const { error } = await window.apiSettings.update(data);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      navigate(-1);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  if (isPending) {
    return <>Loading...</>;
  }

  if (error || !data) {
    return (
      <Alert variant="danger">
        {error?.message || "Something wen't wrong"}
      </Alert>
    );
  }

  return (
    <>
      <Logo />
      <FormWrapper<ValuesType>
        defaultValues={data}
        schema={schema}
        onSubmit={mutation.mutate}
      >
        <GeneralForm />
      </FormWrapper>
    </>
  );
}
