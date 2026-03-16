import { queryOptions } from "@tanstack/react-query";

export default function salesOrderQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["sales-order", id],
    queryFn: async () => {
      console.log("query id ", id);
      if (id !== "new") {
        const { data, error } = await window.apiSalesOrder.getById(Number(id));

        if (error instanceof Error) {
          throw new Error(error.message);
        }

        return data;
      }
      return {
        id: 0,
        created_at: new Date().toISOString(),
        due_at: new Date().toISOString(),
        order_number: "",
        status: "draft" as const,
        sub_total: 0,
        discount: 0,
        total: 0,
        vatable_sales: 0,
        vat_amount: 0,
        tax: 0,
        notes: "",
        user_id: 0,
        customer_id: null,
        items: [],
      };

      //       {
      // id: number;
      //   created_at: string;
      //   quantity: number;
      //   unit_price: number;
      //   unit_cost: number;
      //   discount: number;
      //   line_total: number;
      //   product_id: number;
      //   sales_order_id: number;
      //   user_id: number;
      //       }
    },
  });
}
