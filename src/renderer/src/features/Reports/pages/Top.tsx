import Items from "@renderer/shared/components/Items";
import ListPage from "@renderer/shared/components/ListPage";
// import Pagination from '@renderer/shared/components/Pagination'
import Alert from "@renderer/shared/components/ui/Alert";
import Input from "@renderer/shared/components/ui/Input";
import { addDays, csvDownload } from "@renderer/shared/utils";
import { ReactNode, useState } from "react";
import { NumericFormat } from "react-number-format";
import { Link } from "react-router-dom";
import DateFilter from "@renderer/shared/components/DateFilter";
import Button from "@renderer/shared/components/ui/Button";
import { Download } from "react-feather";
import useTopItems from "@renderer/shared/hooks/useTopItems";

const headers = [
  { label: "Name", className: "" },
  { label: "Total Sales", className: "text-right" },
];

export default function Top(): ReactNode {
  const [startDate, setStartDate] = useState<Date | string>("");
  const [endDate, setEndDate] = useState<Date | string>("");

  const [pageSize, setPageSize] = useState(10);

  const { data, isPending, error } = useTopItems({
    pageSize,
    startDate,
    endDate: endDate ? addDays(new Date(endDate), 1) : "",
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
            title: "Top Items",
            subTitle: "Top Items",
          },
          right: (
            <>
              <DateFilter
                startDate={startDate}
                endDate={endDate}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  title="Download CSV"
                  onClick={() =>
                    csvDownload({
                      header: ["Product", "Total"],
                      data: data?.map((d) => ({
                        name: d.name,
                        total: d.net_quantity_sold,
                      })),
                      title: `${startDate} ${endDate}`,
                    })
                  }
                >
                  <Download size={14} /> Download
                </Button>
              </div>
            </>
          ),
        }}
        isPending={isPending}
        error={error}
        content={
          data && (
            <>
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
                    <td className="text-right">{item.net_quantity_sold}</td>
                  </>
                )}
              />
            </>
          )
        }
        footer={
          <div className="flex items-center justify-end gap-x-2">
            <span>Per page</span>
            <div className="w-[100px]">
              <NumericFormat
                defaultValue={pageSize}
                customInput={Input}
                onValueChange={(values) => {
                  const { floatValue } = values;

                  if (floatValue) {
                    setPageSize(floatValue);
                  }
                }}
              />
            </div>
          </div>
        }
      />
    </>
  );
}
