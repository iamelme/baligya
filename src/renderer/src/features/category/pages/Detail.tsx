import FormWrapper from "@renderer/shared/components/form/FormWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import z from "zod";
import DetailForm from "../components/DetailForm";
import useSubmit from "../hooks/useSubmit";
import ListPage from "@renderer/shared/components/ListPage";
import Button from "@renderer/shared/components/ui/Button";

const Action = (): React.JSX.Element => (
  <div className="flex justify-end">
    <Link to="/products">
      <Button variant="outline">Go Back</Button>
    </Link>
  </div>
);

const schema = z
  .object({
    id: z.coerce.number().optional(),
    name: z.string().min(2, { message: "At least two characters" }),
  })
  .superRefine(async (data, ctx) => {
    const category = await window.apiCategory.getCategoryByName(data.name);
    console.log({ category });

    if (category.data && category.data?.id !== data.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category name is already taken.",
        path: ["name"],
      });
    }
  });

type ValuesType = z.infer<typeof schema>;

export default function Detail(): React.JSX.Element {
  const { id } = useParams();

  const navigate = useNavigate();

  const { isPending, error, data } = useQuery({
    queryKey: ["category", { id }],
    queryFn: async () => {
      if (Number(id)) {
        console.log(id);

        const { data } = await window.apiCategory.getCategoryById(Number(id));
        console.log("data", data);

        if (data) {
          return data;
        }
      }

      return {
        name: "",
      };
    },
  });

  const queryClient = useQueryClient();

  const { mutate, error: mutateError } = useSubmit({
    id,
    onNavigate: navigate,
    onInvalidate: queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
  const handleSubmit = async (data): Promise<void> => {
    console.log("submit", data);

    mutate(data);
  };

  return (
    <ListPage
      header={{
        left: {
          title: `${data?.name ? "" : "New"} Category`,
        },
        right: <Action />,
      }}
      isPending={isPending}
      error={error}
      content={
        <div className="p-4 bg-white border border-slate-200 rounded-md">
          <FormWrapper<ValuesType>
            defaultValues={data || {}}
            schema={schema}
            onSubmit={handleSubmit}
          >
            <DetailForm errorMessage={mutateError?.message ?? ""} />
          </FormWrapper>
        </div>
      }
    />
  );
}
