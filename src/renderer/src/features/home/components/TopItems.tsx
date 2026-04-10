import Card from "@renderer/shared/components/ui/Card";
import Alert from "@renderer/shared/components/ui/Alert";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import useTopItems from "@renderer/shared/hooks/useTopItems";

export default function TopItems(): ReactNode {
  const date = new Date();
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const { data, isPending, error } = useTopItems({ startDate, endDate });
  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  if (!data) {
    return;
  }

  return (
    <Card
      className="h-full"
      header={
        <div className="flex justify-between ">
          <div>
            <h2 className="text-md font-bold">Top Items</h2>
            <p className="text-xs opacity-70">This month</p>
          </div>
          {data?.length > 4 && <Link to="/reports/sales">See more</Link>}
        </div>
      }
      content={
        <ul>
          {data?.map((item) => (
            <li key={item.id} className="flex justify-between mb-2">
              <h3>{item.name}</h3>

              <h4 className="font-bold">{item.net_quantity_sold}</h4>
            </li>
          ))}
        </ul>
      }
    />
  );
}
