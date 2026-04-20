import ListPage from "@renderer/shared/components/ListPage";
import useSalesReturnFetch from "../hooks/useSalesReturnFetch";
import Items from "@renderer/shared/components/Items";
import { Link } from "react-router-dom";
import Button from "@renderer/shared/components/ui/Button";
import Price from "@renderer/shared/components/ui/Price";
import { localeDate } from "@renderer/shared/utils";
import Card from "@renderer/shared/components/ui/Card";

const Action = (): React.JSX.Element => (
  <div className="flex justify-end">
    <Link to="/returns">
      <Button variant="outline" size="sm">
        Go Back
      </Button>
    </Link>
  </div>
);

const headers = [
  { label: "Product Name" },
  { label: "Unit" },
  { label: "Qty", className: "text-right" },
  { label: "Amount", className: "text-right" },
];

export default function Detail() {
  const { data, error, isPending } = useSalesReturnFetch();
  console.log({ data });
  return (
    <ListPage
      header={{
        left: {
          title: `Sales Return`,
        },
        right: <Action />,
      }}
      isPending={isPending}
      error={error}
      content={
        <>
          <Card
            className="mb-6"
            content={
              <>
                <dl className="flex gap-x-4 mb-3">
                  <dt className="">ID:</dt>
                  <dd>{String(data?.id).padStart(8, "0")}</dd>
                </dl>
                <dl className="flex gap-x-4 mb-3">
                  <dt className="">Date:</dt>
                  <dd>{localeDate({ date: data?.created_at })}</dd>
                </dl>
                <dl className="flex gap-x-4">
                  <dt className="">Sale ID:</dt>
                  <dd>
                    <Link
                      to={`/sales/${data?.sale_id}`}
                      className="text-indigo-700"
                    >
                      {data?.invoice_number}
                    </Link>
                  </dd>
                </dl>
              </>
            }
          />

          {data?.items && (
            <Items
              headers={headers}
              items={data?.items}
              renderItems={(item) => (
                <>
                  <td>{item.name}</td>
                  <td>{item.unit}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">
                    (<Price value={item.refund_price} />)
                  </td>
                </>
              )}
            />
          )}
          <div className="flex justify-end">
            <dl className="flex justify-between gap-x-4 font-bold">
              <dt className="">Total:</dt>
              <dd>
                {data?.amount && (
                  <>
                    (<Price value={data?.amount} />)
                  </>
                )}
              </dd>
            </dl>
          </div>
        </>
      }
    />
  );
}
