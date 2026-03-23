import { SalesOrderType } from "@renderer/shared/utils/types";
import { ReturnAllProductType } from "src/main/interfaces/IProductRepository";
import { SalesOrderWithItems } from "../hooks/useUpdateData";

type ItemType = NonNullable<ReturnAllProductType["data"]["results"]>[number];

export function mapper(
  items: SalesOrderWithItems["items"],
  item: ItemType,
  initialItems?: SalesOrderWithItems["items"],
) {
  const base = {
    product_id: item.id,
    product_name: item.name,
    product_desc: item.description ?? "",
    quantity: 1,
    unit_cost: item.cost,
    unit_price: item.price,
    discount: 0,
    line_total: item.price,
    available: item.available,
  };
  if (!items?.length) {
    return [
      {
        created_at: new Date().toISOString(),
        id: 0,
        sales_order_id: 0,
        user_id: 0,
        ...base,
      },
    ];
  }

  const found = items?.find((i) => i.product_id === item.id);

  if (!found) {
    return [
      ...items,
      {
        created_at: new Date().toISOString(),
        id: new Date().getTime(),
        sales_order_id: 0,
        user_id: 0,
        ...base,
      },
    ];
  }

  const initialItem = initialItems?.find((it) => it.product_id === item.id);

  const available = (initialItem?.quantity ?? 0) + (item?.available ?? 0);

  if (available <= found.quantity) {
    return items;
  }

  return items?.map((i) =>
    i.product_id === item.id
      ? {
          ...i,
          base,
          quantity: i.quantity + 1,
          line_total: (i.quantity + 1) * i.unit_price,
        }
      : i,
  );
}

export const headers = [
  { label: "Product", className: "" },
  { label: "Desc", className: "" },
  { label: "QTY", className: "" },
  { label: "Unit cost", className: "text-right" },
  { label: "Unit price", className: "text-right" },
  { label: "Discount", className: "text-right" },
  { label: "Line Total", className: "text-right" },
  { label: "", className: "text-right" },
];

export const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Complete", value: "complete" },
  { label: "Cancelled", value: "cancelled" },
];

export const isStatusLocked = (status: SalesOrderType["status"]): boolean => {
  switch (status) {
    case "complete":
      return true;
    case "cancelled":
      return true;
    default:
      return false;
  }
};
