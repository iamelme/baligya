import FormWrapper from "@renderer/shared/components/form/FormWrapper";
import { ReactNode } from "react";
import CustomerForm from "../components/CustomerForm";
import z from "zod";
import { useParams } from "react-router-dom";
import useSubmit from "../hooks/useSubmit";
import useCustomerFetch from "../hooks/useCustomerFetch";
import Alert from "@renderer/shared/components/ui/Alert";

const schema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
});

type ValuesType = z.infer<typeof schema>;

export default function Detail(): ReactNode {
  const { id } = useParams();

  console.log({ id });
  const { data, error } = useCustomerFetch({ id });
  const { mutate } = useSubmit({ id });

  console.log({ data });

  if (error) {
    return (
      <Alert variant="danger" className="my-6">
        {error.message}
      </Alert>
    );
  }

  return (
    <div className="py-4">
      <FormWrapper<ValuesType>
        defaultValues={data ?? {}}
        schema={schema}
        onSubmit={mutate}
      >
        <CustomerForm />
      </FormWrapper>
    </div>
  );
}
