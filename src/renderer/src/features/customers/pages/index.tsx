import Items from "@renderer/shared/components/Items";
import ListPage from "@renderer/shared/components/ListPage";
import Pagination2 from "@renderer/shared/components/Pagination2";
import Button from "@renderer/shared/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { PlusCircle, Trash2 } from "react-feather";
import { Link, Outlet, useSearchParams } from "react-router-dom";

const Action = (): React.JSX.Element => (
  <div className="flex justify-end">
    <Link to="new">
      <Button>
        <PlusCircle size={14} />
        Add
      </Button>
    </Link>
  </div>
);

const headers = [
  { label: "Name", className: "" },
  { label: "Address", className: "" },
  { label: "Phone", className: "" },
  { label: "", className: "text-right" },
];

export default function Index(): ReactNode {
  const [pageSize, setPageSize] = useState(50);

  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("currentPage")) || 0;
  const { data, isPending, error } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await window.apiCustomer.getAll();

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (id: number) => window.apiCustomer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  if (isPending) {
    return <>Loading...</>;
  }

  return (
    <>
      <ListPage
        header={{
          left: {
            title: "Customers",
            subTitle: "All Customers",
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
                      <Link to={`/customers/${item.id}`}>{item.name}</Link>
                    </td>
                    <td>{item.address}</td>
                    <td>{item.phone}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => mutate(item.id)}
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
      <Outlet />
    </>
  );
}
