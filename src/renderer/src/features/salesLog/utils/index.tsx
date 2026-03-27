import { ReturnCartType } from "@renderer/shared/utils/types";

export function placeOrderMapper({
  data,
  userId,
}: {
  data: ReturnCartType;
  userId: number;
}) {
  return {
    items: data.items?.map((item) => ({
      quantity: item.quantity,
      product_id: item.product_id,
      price: item.price,
      cost: item.cost,
      user_id: userId,
    })),

    sub_total: data.sub_total,
    discount: data.discount,
    vatable_sales: data.vatable_sales,
    vat_amount: data.vat_amount,
    tax: data.tax,
    total: data.total,
  };
}
