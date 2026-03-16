import { useQueryClient } from "@tanstack/react-query";
import salesOrderQueryOptions from "../utils/salesOrderQuery";
import {
  SalesOrderItemType,
  SalesOrderType,
} from "@renderer/shared/utils/types";

type Params = {
  orderId: string;
};

type SalesOrderWithItems = SalesOrderType & {
  items: Array<
    SalesOrderItemType & { product_name: string; product_desc: string }
  >;
};

export default function useUpdateData({ orderId }: Params) {
  const queryClient = useQueryClient();

  const onChange = (
    updater: (prev: SalesOrderWithItems) => Partial<SalesOrderWithItems>,
  ) => {
    const applyData = (old: SalesOrderWithItems | null | undefined) => {
      console.log("old", old);

      if (!old)
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

      const subTotal =
        updater(old)?.items?.reduce((acc, cur) => (acc += cur.line_total), 0) ??
        old.sub_total;

      const discount = updater(old)?.discount ?? old.discount;

      const total = subTotal - discount;

      console.log("updater old", updater(old));

      return { ...old, ...updater(old), sub_total: subTotal, total };
    };
    queryClient.setQueryData(
      salesOrderQueryOptions(orderId).queryKey,
      applyData,
    );
  };

  return onChange;
}
