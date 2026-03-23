import useCreateSalesOrder from "./useCreateSalesOrder";
import useSalesOrderFetch from "./useSalesOrderFetch";
import useUpdateSalesOrder from "./useUpdateSalesOrder";
import validate from "../utils/validate";
import { useState } from "react";
import { SalesOrderType } from "@renderer/shared/utils/types";

export type Params = {
  id: string;
  userId: string;
};

export default function useSalesOrderPage({ id, userId }: Params) {
  const {
    data: salesOrder,
    isPending,
    error,
  } = useSalesOrderFetch(id || "new");

  const [errors, setErrors] = useState<Partial<
    Record<
      keyof NonNullable<typeof salesOrder> | "items" | "customer_name",
      string[]
    >
  > | null>(null);

  const { mutate: createSalesOrder } = useCreateSalesOrder();
  const { mutate: updateSalesOrder } = useUpdateSalesOrder();

  const handleSave = (status: SalesOrderType["status"] = "draft") => {
    if (!salesOrder) return;

    // const base = {
    //   due_at: salesOrder?.due_at ?? new Date().toISOString(),
    //   status: salesOrder?.status ?? ("draft" as const),
    //   order_number: "",
    //   bill_to: salesOrder?.bill_to ?? "",
    //   ship_to: salesOrder?.ship_to ?? "",
    //   sub_total: salesOrder?.sub_total ?? 0,
    //   discount: salesOrder?.discount ?? 0,
    //   total: salesOrder?.total ?? 0,
    //   vatable_sales: salesOrder?.vatable_sales ?? 0,
    //   vat_amount: salesOrder?.vat_amount ?? 0,
    //   tax: salesOrder?.tax ?? 0,
    //   notes: salesOrder?.notes ?? "",
    //   user_id: Number(userId),
    //   customer_id: salesOrder?.customer_id ?? null,
    //   items: salesOrder?.items ?? [],
    // };

    setErrors(null);

    const res = validate(salesOrder);

    if (!res.success) {
      setErrors(res.errors);
      return;
    }

    if (id !== "new") {
      updateSalesOrder({ ...res.data, status });
      return;
    }

    createSalesOrder({ ...res.data, status, user_id: Number(userId) });
  };

  return {
    errors,
    onSave: handleSave,
    salesOrder,
    isPending,
    error,
  };
}
