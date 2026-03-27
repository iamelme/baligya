import { ReactNode, useState } from "react";
import Button from "@renderer/shared/components/ui/Button";
import useSalesOrdersFetch from "../hooks/useSalesOrdersFetch";
import ListPage from "@renderer/shared/components/ListPage";
import Items from "@renderer/shared/components/Items";
import { Link, useSearchParams } from "react-router-dom";
import { PlusCircle } from "react-feather";
import Price from "@renderer/shared/components/ui/Price";
import Pagination2 from "@renderer/shared/components/Pagination2";
import { addDays } from "@renderer/shared/utils";
import DateFilter from "@renderer/shared/components/DateFilter";
import BadgeStatus from "../components/SalesOrderBadgeStatus";

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
  const [pageSize, setPageSize] = useState(50);

  const [searchParams, setSearchParams] = useSearchParams();
  const [startDate, setStartDate] = useState<Date | string>("");
  const [endDate, setEndDate] = useState<Date | string>("");

  let currentPage = searchParams.get("currentPage") ?? "";

  const normalizedStart = startDate ? new Date(startDate)?.toISOString() : "";
  const normalizedEnd = endDate ? addDays(new Date(endDate), 1) : "";

  const { data, isPending, error } = useSalesOrdersFetch({
    pageSize,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    currentPage,
  });

  return (
    <>
      <ListPage
        header={{
          left: {
            title: "Order",
            subTitle: "List of all order",
          },
          right: (
            <>
              <div className="mb-3">
                <Action />
              </div>
              <DateFilter
                startDate={startDate}
                endDate={endDate}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
              />
            </>
          ),
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
                      {new Date(item.created_at).toLocaleDateString("en-PH", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="">
                      {new Date(item.due_at).toLocaleDateString("en-PH", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>{item?.customer_name ?? ""}</td>
                    <td>
                      <Price value={item.total} />
                    </td>
                    <td>
                      <BadgeStatus status={item.status} />
                    </td>
                  </>
                )}
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
