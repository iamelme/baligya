import ListPage from "@renderer/shared/components/ListPage";
import { ReactNode, useState } from "react";
import useSalesReturnsFetch from "../hooks/useSalesReturnsFetch";
import Items from "@renderer/shared/components/Items";
import { addDays, humanize, localeDate } from "@renderer/shared/utils";
import Price from "@renderer/shared/components/ui/Price";
import { Link, useSearchParams } from "react-router-dom";
import Pagination2 from "@renderer/shared/components/Pagination2";
import DateFilter from "@renderer/shared/components/DateFilter";

const headers = [
  { label: "ID" },
  { label: "Date" },
  { label: "Method" },
  { label: "Amount", className: "text-right" },
];

export default function ReturnsPage(): ReactNode {
  const [pageSize, setPageSize] = useState(50);

  const [searchParams, setSearchParams] = useSearchParams();

  const [startDate, setStartDate] = useState<Date | string>("");
  const [endDate, setEndDate] = useState<Date | string>("");

  let currentPage = searchParams.get("currentPage");

  const normalizedStart = startDate ? new Date(startDate)?.toISOString() : "";
  const normalizedEnd = endDate ? addDays(new Date(endDate), 1) : "";
  const { data, isPending, error } = useSalesReturnsFetch({
    pageSize,
    normalizedStart,
    normalizedEnd,
    offset: searchParams.get("currentPage") || "",
  });
  console.log({ data });
  return (
    <ListPage
      header={{
        left: {
          title: "Sales Return",
          subTitle: "All sales returns",
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
      content={
        data?.results && (
          <Items
            headers={headers}
            items={data?.results}
            renderItems={(item) => (
              <>
                <td>
                  <Link to={`/returns/${item.id}`} className="text-indigo-700">
                    {String(item.id).padStart(8, "0")}
                  </Link>
                </td>
                <td>{localeDate({ date: item.created_at })}</td>
                <td>{humanize(item.method)}</td>
                <td className="text-right">
                  (<Price value={item?.amount} />)
                </td>
              </>
            )}
          />
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
  );
}
