import { SalesOrderType } from "@renderer/shared/utils/types";
import * as z from "zod";

const schema = z.object({
  id: z.coerce.number(),
  due_at: z.string().min(1, { message: "Due date is required." }),
  status: z
    .union([
      z.literal("draft"),
      z.literal("confirmed"),
      z.literal("fulfilled"),
      z.literal("complete"),
      z.literal("cancelled"),
    ])
    .default("draft"),
  bill_to: z.string(),
  ship_to: z.string(),
  sub_total: z.number(),
  discount: z.number(),
  total: z.number(),
  vatable_sales: z.number(),
  vat_amount: z.number(),
  tax: z.number(),
  notes: z.string(),
  customer_id: z.number("Customer is required."),
  user_id: z.number(),
  items: z
    .array(
      z.object({
        id: z.number(),
        created_at: z.string().default(new Date().toISOString()),
        quantity: z.number(),
        unit_price: z.number(),
        unit_cost: z.number(),
        discount: z.number(),
        line_total: z.number().min(1, { message: "Cannot go below 1" }),
        product_id: z.number(),
        sales_order_id: z.number(),
        user_id: z.number(),
      }),
      { message: "At least 1 item." },
    )
    .nonempty({ message: "Please add an item." }),
});

type ValueType = z.infer<typeof schema>;

export default function validate(data: SalesOrderType):
  | { success: true; data: ValueType }
  | {
      success: false;
      errors: z.ZodFlattenedError<SalesOrderType>["fieldErrors"];
    } {
  const res = schema.safeParse(data);

  if (!res.success) {
    return { success: false, errors: z.flattenError(res.error).fieldErrors };
  }
  return { success: true, data: res.data };
}
