import Items from "@renderer/shared/components/Items";

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
import Badge from "@renderer/shared/components/ui/Badge";
import Pagination2 from "@renderer/shared/components/Pagination2";

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
    case "partial_return":
      return <Badge variant="warning">{children}</Badge>;
    case "return":
      return <Badge>{children}</Badge>;
    default:
      return <Badge variant="danger">{children}</Badge>;
  }
};

export default function Sales(): ReactNode {
  const user = useBoundStore((state) => state.user);

  const [searchParams, setSearchParams] = useSearchParams();

  const [pageSize, setPageSize] = useState(50);

  const [startDate, setStartDate] = useState<Date | string>("");
  const [endDate, setEndDate] = useState<Date | string>("");

  let currentPage = searchParams.get("currentPage");

  const normalizedStart = startDate ? new Date(startDate)?.toISOString() : "";
  const normalizedEnd = endDate ? addDays(new Date(endDate), 1) : "";

  const { data, isPending, error } = useQuery({
    queryKey: [
      "sales",
      pageSize,
      normalizedStart,
      normalizedEnd,
      user.id,
      searchParams.get("currentPage"),
    ],
    queryFn: async (): Promise<{
      total: number;
      results: SaleType[] | null;
    }> => {
      if (!user.id) {
        throw new Error("User not found");
      }

      const { data, error } = await window.apiSale.getAll({
        startDate: normalizedStart,
        endDate: normalizedEnd,
        pageSize,
        offset: Number(currentPage) || 0,
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  const { results: sales, total } = data;

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

        <div className="flex items-center justify-end gap-x-2"></div>
      </ListPage>

      <Pagination2
        pageSize={pageSize}
        paginateSize={3}
        total={total}
        searchParams={searchParams}
        onSearchParams={setSearchParams}
        currentPage={Number(currentPage) || 0}
        onPageSize={setPageSize}
      />

      {
        // <Pagination
        //   direction={dir}
        //   firstId={sales[0]?.id}
        //   lastId={sales[sales.length - 1]?.id}
        //   hasLastItem={hasLastItem}
        //   searchParams={searchParams}
        //   onSearchParams={setSearchParams}
        // />
      }
    </>
  );
}
