import Price from "@renderer/shared/components/ui/Price";
import Alert from "@renderer/shared/components/ui/Alert";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import Card from "@renderer/shared/components/ui/Card";
import Badge from "@renderer/shared/components/ui/Badge";

export default function Sales(): ReactNode {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const { data, isPending, error } = useQuery({
    queryKey: ["revenue"],
    queryFn: async () => {
      const { data, error } = await window.apiSale.getRevenue({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
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

  if (error || Array.isArray(data)) {
    return (
      <Alert variant="danger">{error?.message || "something went wrong"}</Alert>
    );
  }

  return (
    <div className="flex gap-3 mb-3">
      <div className="flex-1">
        <Card
          className="bg-white"
          header={
            <div className="flex justify-between">
              <div>
                <h2 className="text-md font-bold">Gross Revenue</h2>
                <p className="text-xs opacity-70">This month</p>
              </div>
            </div>
          }
          content={
            <>
              <div className="inline-block mr-2 text-3xl">
                <Price value={data?.gross_revenue} />
              </div>
              {data && (
                <Badge
                  variant={
                    data?.gross_percent_change === 0
                      ? "default"
                      : data?.gross_percent_change > 0
                        ? "success"
                        : "danger"
                  }
                >
                  <>
                    <span className="text-xs">
                      {data?.gross_percent_change}%
                    </span>
                    {data?.gross_percent_change === 0 ? (
                      ""
                    ) : (
                      <div
                        className={`inline-block w-0 h-0 ml-1 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] ${
                          data?.gross_percent_change > 0
                            ? "border-b-green-400"
                            : "border-b-red-500"
                        }`}
                      ></div>
                    )}
                  </>
                </Badge>
              )}
            </>
          }
        />
      </div>

      <div className="flex-1">
        <Card
          className="bg-white"
          header={
            <div className="flex justify-between">
              <div>
                <h2 className="text-md font-bold">Total Returns</h2>
                <p className="text-xs opacity-70">This month</p>
              </div>
            </div>
          }
          content={
            <>
              <div className="inline-block mr-2 text-3xl">
                <Price value={data?.total_return} />
              </div>
              {data && (
                <Badge
                  variant={
                    data?.return_percent_change === 0
                      ? "default"
                      : data?.return_percent_change > 0
                        ? "success"
                        : "danger"
                  }
                >
                  <>
                    <span className="text-xs">
                      {data?.return_percent_change || 0}%
                    </span>
                    {data?.return_percent_change === 0 ? (
                      ""
                    ) : (
                      <div
                        className={`inline-block w-0 h-0 ml-1 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] ${
                          data?.return_percent_change < 0
                            ? "border-b-green-400"
                            : "border-b-red-500"
                        }`}
                      ></div>
                    )}
                  </>
                </Badge>
              )}
            </>
          }
        />
      </div>

      <div className="flex-1">
        <Card
          className="bg-white"
          header={
            <div className="flex justify-between">
              <div>
                <h2 className="text-md font-bold">Net Sales</h2>
                <p className="text-xs opacity-70">This month</p>
              </div>
            </div>
          }
          content={
            <>
              <div className="inline-block mr-2 text-3xl">
                <Price value={data?.net_revenue} />
              </div>
              {data && (
                <Badge
                  variant={
                    data?.net_percent_change === 0
                      ? "default"
                      : data?.net_percent_change > 0
                        ? "success"
                        : "danger"
                  }
                >
                  <>
                    <span className="text-xs">
                      {data?.prev_gross_revenue === null
                        ? "New"
                        : `${data?.net_percent_change || 0}%`}
                    </span>
                    {data?.net_percent_change === 0 ? (
                      ""
                    ) : (
                      <div
                        className={`inline-block w-0 h-0 ml-1 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] ${
                          data?.net_percent_change > 0
                            ? "border-b-green-400"
                            : "border-b-red-500 rotate-180"
                        }`}
                      ></div>
                    )}
                  </>
                </Badge>
              )}
            </>
          }
        />
      </div>
    </div>
  );
}
