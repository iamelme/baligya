type Data = {
  month: number;
  gross_revenue: number;
  total_return: number;
  gross_percent_change: number;
  return_percent_change: number;
  net_percent_change: number;
  net_revenue: number;
}[];

type Key = keyof Data[number];

export function monthSaleMapper({
  months,
  data,
  key,
}: {
  months: string[];
  key: Key;
  data: Data;
}) {
  return months.map((_, index) => {
    const sameMonth = data.find((d) => Number(d.month) - 1 === index);

    if (sameMonth) {
      return (sameMonth?.[key] ?? 0) / 100;
    }

    return 0;
  });
}
