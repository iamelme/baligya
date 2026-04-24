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
  months: { long: string; numeric: number }[];
  key: Key;
  data: Data;
}) {
  return months.map((m) => {
    const sameMonth = data.find((d) => Number(d.month) === m.numeric);

    if (sameMonth) {
      return (sameMonth?.[key] ?? 0) / 100;
    }

    return 0;
  });
}
