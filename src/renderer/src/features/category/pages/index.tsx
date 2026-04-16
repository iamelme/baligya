import Items from "@renderer/shared/components/Items";
import ListPage from "@renderer/shared/components/ListPage";
import Pagination2 from "@renderer/shared/components/Pagination2";
import Button from "@renderer/shared/components/ui/Button";
import { csvDownload } from "@renderer/shared/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, PlusCircle, Trash2, Upload } from "react-feather";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const Action = ({
  onHandleCSV,
}: {
  onHandleCSV: () => void;
}): React.JSX.Element => (
  <div className="flex justify-end gap-x-3">
    <Link to="/categories/new">
      <Button>
        <PlusCircle size={14} />
        Add
      </Button>
    </Link>

    <Button
      variant="outline"
      size="sm"
      title="Download CSV"
      onClick={() =>
        csvDownload({
          header: ["name"],
          data: [],
          title: `category-upload-template`,
        })
      }
    >
      <Download size={14} /> Download Template
    </Button>

    <Button
      variant="outline"
      size="sm"
      title="Upload CSV"
      onClick={() => onHandleCSV()}
    >
      <Upload size={14} /> Upload CSV
    </Button>
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

  const handleUploadCSV = async () => {
    try {
      const { error } = await window.apiElectron.uploadCSV({
        stmt: `
          INSERT INTO categories (name)
          VALUES(:name)
        `,
      });

      if (error instanceof Error) {
        toast.error(error.message);
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  return (
    <ListPage
      header={{
        left: {
          title: "Categories",
          subTitle: "All Product Categories",
        },
        right: <Action onHandleCSV={handleUploadCSV} />,
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
