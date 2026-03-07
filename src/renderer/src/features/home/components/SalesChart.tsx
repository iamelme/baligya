import { ReactNode } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getCurrentQuarterDates } from "@renderer/shared/utils";
import { useQuery } from "@tanstack/react-query";
import Alert from "@renderer/shared/components/ui/Alert";
import { monthSaleMapper } from "../utils";
import Card from "@renderer/shared/components/ui/Card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Current Quarterly Sales",
    },
  },
};

export default function SalesChart(): ReactNode {
  const { start, end, months } = getCurrentQuarterDates();

  const { data, isPending, error } = useQuery({
    queryKey: ["revenue-quarterly"],
    queryFn: async () => {
      const { data, error } = await window.apiSale.getRevenue({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isQuarterly: true,
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

  if (error || !data) {
    return (
      <Alert variant="danger">{error?.message || "something went wrong"}</Alert>
    );
  }

  const normalizeData = Array.isArray(data) ? data : [];

  const d = {
    labels: months,
    datasets: [
      {
        label: "Net Sales",
        data: monthSaleMapper({
          months,
          data: normalizeData,
          key: "net_revenue",
        }),
        borderColor: "oklch(51.1% 0.262 276.966)",
        backgroundColor: "oklch(51.1% 0.262 276.966)",
      },

      // {
      //   label: "Total Returns",
      //   data: monthSaleMapper({
      //     months,
      //     data: normalizeData,
      //     key: "total_return",
      //   }),
      //   borderColor: "oklch(63.7% 0.237 25.331)",
      //   backgroundColor: "oklch(93.6% 0.032 17.717)",
      // },
    ],
  };

  return <Card content={<Bar options={options} data={d} />} />;
}
