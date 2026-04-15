import Items from "@renderer/shared/components/Items";
import ListPage from "@renderer/shared/components/ListPage";
import Pagination2 from "@renderer/shared/components/Pagination2";
import Button from "@renderer/shared/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlusCircle, Trash2 } from "react-feather";
import { Link, useSearchParams } from "react-router-dom";

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
  { label: "ID", className: "" },
  { label: "Name", className: "" },
  { label: "", className: "text-right" },
];

export default function CategoryPage(): React.JSX.Element {
  const [pageSize, setPageSize] = useState(50);

  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("currentPage")) || 0;

  const { isPending, error, data } = useQuery({
    queryKey: ["categories", pageSize, currentPage],
    queryFn: async () => {
      const { data, error } = await window.apiCategory.getAllCategories({
        offset: currentPage,
        pageSize,
      });
      if (error instanceof Error) {
        throw new Error(error.message);
      }
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
      content={
        data?.results ? (
          <>
            <Items
              headers={headers}
              items={data.results}
              renderItems={(item) => (
                <>
                  <td>
                    <Link to={`/categories/${item.id}`}>{item.id}</Link>
                  </td>
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
          </>
        ) : null
      }
      footer={
        data ? (
          <Pagination2
            pageSize={pageSize}
            paginateSize={5}
            total={data.total}
            searchParams={searchParams}
            onSearchParams={setSearchParams}
            currentPage={Number(currentPage) || 0}
            onPageSize={setPageSize}
          />
        ) : null
      }
    />
  );
}
