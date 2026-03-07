import Items from "@renderer/shared/components/Items";
import Pagination from "@renderer/shared/components/Pagination";

import Price from "@renderer/shared/components/ui/Price";
import Alert from "@renderer/shared/components/ui/Alert";
import useBoundStore from "@renderer/shared/stores//boundStore";
import { addDays, humanize } from "@renderer/shared/utils";
import { SaleType } from "@renderer/shared/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ListPage from "@renderer/shared/components/ListPage";
import DateFilter from "@renderer/shared/components/DateFilter";
import { NumericFormat } from "react-number-format";
import Input from "@renderer/shared/components/ui/Input";
import Badge from "@renderer/shared/components/ui/Badge";

const headers = [
  { label: "Invoice No.", className: "" },
  { label: "Date", className: "" },
  { label: "Subtotal", className: "text-right" },
  { label: "Discount", className: "text-right" },
  { label: "Tax", className: "text-right" },
  { label: "Total", className: "text-right" },
  { label: "Status", className: "" },
];

const StatusWrapper = ({
  status,
  children,
}: {
  status: SaleType["status"];
  children: ReactNode;
}): ReactNode => {
  switch (status) {
    case "complete":
      return <Badge variant="success">{children}</Badge>;
    case "return":
      return <Badge>{children}</Badge>;
    default:
      return <Badge>{children}</Badge>;
  }
};

export default function Sales(): ReactNode {
  const user = useBoundStore((state) => state.user);

  const [searchParams, setSearchParams] = useSearchParams();

  const [hasLastItem, setHasLastItem] = useState(false);
  const [pageSize, setPageSize] = useState(50);

  const [startDate, setStartDate] = useState<Date | string>("");
  const [endDate, setEndDate] = useState<Date | string>("");

  let dir = searchParams.get("dir");

  const normalizedStart = startDate ? new Date(startDate)?.toISOString() : "";
  const normalizedEnd = endDate ? addDays(new Date(endDate), 1) : "";

  const {
    data: sales,
    isPending,
    error,
  } = useQuery({
    queryKey: [
      "sales",
      normalizedStart,
      normalizedEnd,
      user.id,
      searchParams.get("cursorId"),
      pageSize,
      dir,
    ],
    queryFn: async (): Promise<SaleType[] | null> => {
      if (!user.id) {
        throw new Error("User not found");
      }

      const cursorId = searchParams.get("cursorId")
        ? Number(searchParams.get("cursorId"))
        : 0;

      dir = dir ?? "next";

      const { data, error } = await window.apiSale.getAll({
        startDate: normalizedStart,
        endDate: normalizedEnd,
        pageSize,
        cursorId: cursorId,
        userId: user.id,
        direction: dir as "prev" | "next",
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      if (!data) {
        return null;
      }

      setHasLastItem(false);

      if (data.length > pageSize) {
        setHasLastItem(true);
        data.pop();
      }

      return dir == "next" ? data : data?.toReversed();
    },
  });

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  return (
    <>
      <ListPage
        header={{
          left: {
            title: "Sales",
            subTitle: "Sales Invoice",
          },
          right: (
            <>
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
      >
        <>
          {sales && (
            <Items
              items={sales}
              headers={headers}
              renderItems={(item) => (
                <>
                  <td>
                    <Link to={`/sales/${item.id}`}>{item.invoice_number}</Link>
                  </td>
                  <td>
                    {String(new Date(item.created_at).toLocaleDateString())}
                  </td>
                  <td className="text-right">
                    <Price value={item.sub_total} />
                  </td>
                  <td className="text-right">
                    <Price value={item.discount} />
                  </td>
                  <td className="text-right">
                    <Price value={item.tax} />
                  </td>
                  <td className="text-right">
                    <Price value={item.total} />
                  </td>
                  <td className="">
                    <Link to={`/sales/${item.id}`}>
                      <StatusWrapper status={item.status}>
                        {humanize(item.status)}
                      </StatusWrapper>
                    </Link>
                  </td>
                </>
              )}
            />
          )}
        </>

        <div className="flex items-center justify-end gap-x-2">
          <span>Per page</span>
          <div className="w-[100px]">
            <NumericFormat
              defaultValue={pageSize}
              customInput={Input}
              onValueChange={(values) => {
                const { floatValue } = values;

                if (floatValue) {
                  setSearchParams({
                    ...searchParams,
                    cursorId: "0",
                  });
                  setPageSize(floatValue);
                }
              }}
            />
          </div>
        </div>
      </ListPage>

      {sales && (
        <Pagination
          direction={dir}
          firstId={sales[0]?.id}
          lastId={sales[sales.length - 1]?.id}
          hasLastItem={hasLastItem}
          searchParams={searchParams}
          onSearchParams={setSearchParams}
        />
      )}
    </>
  );
}
