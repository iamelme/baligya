import Items from "@renderer/shared/components/Items";
import ListPage from "@renderer/shared/components/ListPage";
import Button from "@renderer/shared/components/ui/Button";
import Input from "@renderer/shared/components/ui/Input";
import Price from "@renderer/shared/components/ui/Price";
import useBoundStore from "@renderer/shared/stores//boundStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Download, PlusCircle, Trash2, Upload } from "react-feather";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useProductsFetch from "../hooks/useProductsFetch";
import useDebounce from "@renderer/shared/hooks/useDebounce";
import Pagination2 from "@renderer/shared/components/Pagination2";
import Badge from "@renderer/shared/components/ui/Badge";
import { csvDownload } from "@renderer/shared/utils";
import { toast } from "react-toastify";

const Action = ({
  onHandleCSV,
}: {
  onHandleCSV: () => void;
}): React.JSX.Element => (
  <div className="flex justify-end gap-x-3">
    <Link to="/products/new" tabIndex={-1}>
      <Button variant="default">
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
          header: ["name", "sku", "unit", "description", "cost", "price"],
          data: [],
          title: `product-upload-template`,
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
  { label: "Name", className: "" },
  { label: "SKU", className: "" },
  { label: "Code", className: "" },
  { label: "Category", className: "" },
  { label: "Unit", className: "" },
  { label: "Qty", className: "" },
  { label: "Available", className: "" },
  { label: "Price", className: "text-right" },
  { label: "Status" },
  { label: "", className: "text-right" },
];

export default function ProductPage(): React.JSX.Element {
  const user = useBoundStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");

  const [pageSize, setPageSize] = useState(50);

  const dataGridRef = useRef<HTMLTableElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("currentPage")) || 0;

  const navigate = useNavigate();

  if (!user.id) {
    navigate("/");
  }

  useEffect(() => {
    function focusElem(): void {
      if (
        dataGridRef.current &&
        dataGridRef.current.contains(document.activeElement)
      ) {
        console.log("dataGridRef", dataGridRef.current);

        console.log("Focus is inside the container");
      }
    }
    window.addEventListener("keydown", focusElem);

    return () => {
      window.removeEventListener("keydown", focusElem);
    };
  }, []);

  const { isPending, error, data } = useProductsFetch({
    pageSize,
    searchTerm: useDebounce(searchTerm),
    currentPage,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => window.apiProduct.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleUploadCSV = async () => {
    try {
      const { error } = await window.apiElectron.uploadCSV({
        stmt: `
          INSERT INTO products (name, sku, unit, description, code, cost, price, category_id, user_id)
          VALUES(:name, :sku, :unit, :description, :code, :cost, :price, :category_id, ${user.id})
        `,
      });

      if (error instanceof Error) {
        toast.error(error.message);
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  return (
    <>
      <ListPage
        header={{
          left: {
            title: "Products",
            subTitle: "All products",
          },
          right: (
            <>
              <div className="flex gap-x-2 mb-3">
                <Input
                  placeholder="Search a product..."
                  autoFocus
                  defaultValue={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-x-2">
                <Action onHandleCSV={handleUploadCSV} />
              </div>
            </>
          ),
        }}
        isPending={isPending}
        error={error}
        content={
          data?.results && (
            <>
              <Items
                ref={dataGridRef}
                items={data.results}
                headers={headers}
                renderItems={(item) => {
                  const { is_active: isActive } = item;

                  return (
                    <>
                      <td>
                        <Link to={`/products/${item.id}`} tabIndex={-1}>
                          {item.name}
                        </Link>
                      </td>
                      <td>{item.sku}</td>
                      <td>{item.code}</td>
                      <td>
                        <Link
                          to={`/categories/${item.category_id}`}
                          tabIndex={-1}
                        >
                          {item.category_name}
                        </Link>
                      </td>
                      <td className="">{item.unit}</td>
                      <td className="">{item.quantity}</td>
                      <td className="">{item.available}</td>
                      <td className="text-right">
                        <Price value={item.price} />
                      </td>
                      <td className="">
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="text-right">
                        {isActive ? (
                          <Button
                            variant="outline"
                            size="icon"
                            tabIndex={-1}
                            onClick={() => mutation.mutate(Number(item.id))}
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : null}
                      </td>
                    </>
                  );
                }}
              />
            </>
          )
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
    </>
  );
}
