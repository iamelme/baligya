import { ReactNode, useId } from "react";
import FormWrapper from "@renderer/shared/components/form/FormWrapper";
import z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Alert from "@renderer/shared/components/ui/Alert";
import GeneralForm from "../components/GeneralForm";
import Logo from "../components/Logo";
import { SettingsParamType } from "../utils/type";

const schema = z.object({
  tax: z.coerce.number(),
  locale: z.string().default("en-PH"),
  is_redirect_to_sales: z.coerce.number().default(0),
  company_name: z.string(),
  address1: z.string(),
  address2: z.string().optional(),
  state_province: z.string(),
  city: z.string(),
  zip: z.coerce.number("Must be a number"),
  phone: z.coerce.string(),
});

type ValuesType = z.infer<typeof schema>;

export default function GeneralPage(): ReactNode {
  const navigate = useNavigate();

  const id = useId();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isPending,
    error,
  } = useQuery({
    queryKey: [id, "settings"],
    queryFn: async () => {
      const { data, error } = await window.apiSettings.getSettings();

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      const t = data?.reduce((acc, { key, value }) => {
        if (value) {
          acc[key] = Number(value) >= 0 ? Number(value) : value;
        }

        return acc;
      }, {} as ValuesType);

      return t;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<SettingsParamType>) => {
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

  if (error || !settings) {
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
        defaultValues={settings}
        schema={schema}
        onSubmit={mutation.mutate}
      >
        <GeneralForm />
      </FormWrapper>
    </>
  );
}
