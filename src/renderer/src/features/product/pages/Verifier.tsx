import Input from "@renderer/shared/components/ui/Input";
import { useEffect, useRef, useState } from "react";
import useProductSearch from "../hooks/useProductSearch";
import useDebounce from "@renderer/shared/hooks/useDebounce";
import Items from "@renderer/shared/components/Items";
import { Link } from "react-router-dom";
import Price from "@renderer/shared/components/ui/Price";
import Alert from "@renderer/shared/components/ui/Alert";

const headers = [
  { label: "Name", className: "" },
  { label: "SKU", className: "" },
  { label: "Code", className: "" },
  { label: "Category", className: "" },
  { label: "Qty", className: "" },
  { label: "Price", className: "text-right" },
  { label: "", className: "text-right" },
];

export default function Verifier(): React.ReactElement {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const { isPending, error, data } = useProductSearch({
    searchTerm: useDebounce(searchTerm),
  });

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef?.current.focus();
    }
    const handleKeyDown = (e): void => {
      if (e.metaKey || e.ctrlKey) {
        if (searchInputRef.current) {
          searchInputRef?.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  return (
    <>
      <Input
        placeholder="Search"
        ref={searchInputRef}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {data && (
        <Items
          items={data}
          headers={headers}
          renderItems={(item) => (
            <>
              <td>
                <Link to={`/products/${item.id}`} tabIndex={-1}>
                  {item.name}
                </Link>
              </td>
              <td>{item.sku}</td>
              <td>{item.code}</td>
              <td>
                <Link to={`/categories/${item.category_id}`} tabIndex={-1}>
                  {item.category_name}
                </Link>
              </td>
              <td className="">{item.quantity}</td>
              <td className="text-right">
                <Price value={item.price} />
              </td>
            </>
          )}
        />
      )}
    </>
  );
}
