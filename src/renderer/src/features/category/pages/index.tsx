import Items from "@renderer/shared/components/Items";
import ListPage from "@renderer/shared/components/ListPage";
import Button from "@renderer/shared/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "react-feather";
import { Link } from "react-router-dom";

const Action = (): React.JSX.Element => (
  <div className="flex justify-end">
    <Link to="/categories/new">
      <Button>
        <PlusCircle size={14} />
        Add
      </Button>
    </Link>
  </div>
);

const headers = [
  { label: "Name", className: "" },
  { label: "", className: "text-right" },
];

export default function CategoryPage(): React.JSX.Element {
  const { isPending, error, data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await window.apiCategory.getAllCategories();
      return data;
    },
  });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: number) => window.apiCategory.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleDelete = (id: number): void => {
    mutation.mutate(id);
  };

  return (
    <ListPage
      header={{
        left: {
          title: "Categories",
          subTitle: "All Product Categories",
        },
        right: <Action />,
      }}
      isPending={isPending}
      error={error}
    >
      <Items
        headers={headers}
        items={data}
        renderItems={(item) => (
          <>
            <td>
              <Link to={`/categories/${item.id}`}>{item.name}</Link>
            </td>
            <td className="text-right">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 size={14} />
              </Button>
            </td>
          </>
        )}
      />
    </ListPage>
  );
}
