import useCreateSalesOrder from "./useCreateSalesOrder";
// import useCustomerSearch from "./useCustomerSearch";
import useSalesOrderFetch from "./useSalesOrderFetch";
import useUpdateSalesOrder from "./useUpdateSalesOrder";

export type Params = {
  id: string;
  userId: string;
};

export default function useSalesOrderPage({ id, userId }: Params) {
  const { data: salesOrder } = useSalesOrderFetch(id || "new");

  const { mutate: createSalesOrder } = useCreateSalesOrder();
  const { mutate: updateSalesOrder } = useUpdateSalesOrder();

  const handleSave = () => {
    const base = {
      due_at: salesOrder?.due_at ?? new Date().toISOString(),
      status: salesOrder?.status ?? ("draft" as const),
      order_number: "",
      sub_total: salesOrder?.sub_total ?? 0,
      discount: salesOrder?.discount ?? 0,
      total: salesOrder?.total ?? 0,
      vatable_sales: salesOrder?.vatable_sales ?? 0,
      vat_amount: salesOrder?.vat_amount ?? 0,
      tax: salesOrder?.tax ?? 0,
      notes: salesOrder?.notes ?? "",
      user_id: Number(userId),
      customer_id: salesOrder?.customer_id ?? null,
      items: salesOrder?.items ?? [],
    };

    if (id !== "new") {
      updateSalesOrder({ id: Number(id), ...base });
    } else {
      createSalesOrder(base);
    }
  };

  return {
    onSave: handleSave,
    salesOrder,
  };
}
