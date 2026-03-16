import { ReactNode } from "react";
import Button from "@renderer/shared/components/ui/Button";
import useSalesOrdersFetch from "../hooks/useSalesOrdersFetch";
import ListPage from "@renderer/shared/components/ListPage";
import Items from "@renderer/shared/components/Items";
import { Link } from "react-router-dom";
import { PlusCircle } from "react-feather";
import Price from "@renderer/shared/components/ui/Price";

const Action = (): React.JSX.Element => (
  <div className="flex justify-end">
    <Link to="/so/new" tabIndex={-1}>
      <Button variant="default">
        <PlusCircle size={14} />
        Add
      </Button>
    </Link>
  </div>
);

const headers = [
  { label: "ID", className: "" },
  { label: "Date", className: "" },
  { label: "Due Date", className: "" },
  { label: "Customer", className: "" },
  { label: "Total", className: "" },
  { label: "Status", className: "" },
];

export default function SalesOrder(): ReactNode {
  const { data, isPending, error } = useSalesOrdersFetch();

  console.log(data);

  return (
    <>
      <ListPage
        header={{
          left: {
            title: "Sales Order",
            subTitle: "List of all sales order",
          },
          right: <Action />,
        }}
        isPending={isPending}
        error={error}
        content={
          data?.results && (
            <>
              <Items
                items={data.results}
                headers={headers}
                renderItems={(item) => (
                  <>
                    <td>
                      <Link to={`/so/${item.id}`} tabIndex={-1}>
                        {item.order_number}
                      </Link>
                    </td>
                    <td className="">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="">
                      {new Date(item.due_at).toLocaleDateString()}
                    </td>
                    <td>{item?.customer_name ?? ""}</td>
                    <td>
                      <Price value={item.total} />
                    </td>
                    <td>{item.status}</td>
                  </>
                )}
              />
            </>
          )
        }
        // footer={
        //   <div className="flex items-center justify-end gap-x-2">
        //     <span>Per page</span>
        //     <div className="w-[100px]">
        //       <NumericFormat
        //         defaultValue={pageSize}
        //         customInput={Input}
        //         onValueChange={(values) => {
        //           const { floatValue } = values;
        //
        //           if (floatValue) {
        //             setPageSize(floatValue);
        //           }
        //         }}
        //       />
        //     </div>
        //   </div>
        // }
      />
    </>
  );
}
