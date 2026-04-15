import FormWrapper from "@renderer/shared/components/form/FormWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import z from "zod";
import useBoundStore from "@renderer/shared/stores//boundStore";
import useProductFetch from "../hooks/useProductFetch";
import useSubmit from "../hooks/useSubmit";
import ProductDetailForm from "../components/ProductDetailForm";
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
    name: z.string().min(2),
    sku: z.string().min(2),
    description: z.string().optional(),
    price: z.coerce.number(),
    cost: z.coerce.number(),
    code: z.coerce.number(),
    unit: z.string().min(1),
    is_active: z.coerce.number(),
    category_id: z.coerce.number().nullish(),
    inventory_id: z.coerce.number().nullish(),
  })
  .superRefine(async (data, ctx) => {
    console.log({ data }, { ctx });

    const normalizeCode = Number(data?.code);

    if (!data.category_id) {
      ctx.addIssue({
        code: "custom",
        message: "There must be a category.",
        path: ["category_id"],
      });
    }

    if (normalizeCode) {
      const product = await window.apiProduct.getProductByCode(normalizeCode);

      if (product.data && product.data?.id !== data?.id) {
        ctx.addIssue({
          code: "custom",
          message: "Code is already taken.",
          path: ["code"],
        });
      }
    }

    const productName = await window.apiProduct.getProductByName(data?.name);

    if (productName.data && productName.data?.id !== data?.id) {
      ctx.addIssue({
        code: "custom",
        message: "Name is already taken.",
        path: ["name"],
      });
    }
    const productSku = await window.apiProduct.getProductBySku(data?.sku);

    if (productSku.data && productSku.data?.id !== data?.id) {
      ctx.addIssue({
        code: "custom",
        message: "SKU is already taken.",
        path: ["sku"],
      });
    }
  });

type ValuesType = z.infer<typeof schema>;

export default function Detail(): React.JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useBoundStore((state) => state.user);

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data } = await window.apiCategory.getAllCategories({
        offset: 0,
        pageSize: 10,
      });
      return data;
    },
  });

  const { isPending, error, data } = useProductFetch({ id });

  const queryClient = useQueryClient();

  const { mutate, error: mutateError } = useSubmit({
    id,
    userId: user.id ?? 0,
    onNavigate: navigate,
    onInvalidate: queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const categoryOptions = categories?.results?.map((cat) => ({
    label: cat.name,
    value: String(cat.id),
  }));

  return (
    <ListPage
      header={{
        left: {
          title: `${data?.user_id ? "" : "New"} Product`,
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
            onSubmit={mutate}
            key={id}
          >
            <ProductDetailForm
              categoryOptions={categoryOptions}
              errorMessage={mutateError?.message}
            />
          </FormWrapper>
        </div>
      }
    />
  );
}
