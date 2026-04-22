import { SalesOrderType } from "@renderer/shared/utils/types";
import * as z from "zod";

const nonDraftStatuses = ["confirmed", "fulfilled", "complete"] as const;

const base = {
  id: z.coerce.number(),
  due_at: z.string().min(1, { message: "Due date is required." }),
  bill_to: z.string(),
  ship_to: z.string(),
  sub_total: z.number(),
  discount: z.number(),
  total: z.number(),
  vatable_sales: z.number(),
  vat_amount: z.number(),
  tax: z.number(),
  notes: z.string(),
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
};

const schema = z.discriminatedUnion("status", [
  z.object({
    ...base,
    status: z.literal("draft"),
    customer_id: z.number().nullable(),
  }),
  z.object({
    ...base,
    status: z.literal("cancelled"),
    customer_id: z.number().nullable(),
  }),
  ...nonDraftStatuses.map((s) =>
    z.object({
      ...base,
      status: z.literal(s),
      customer_id: z.number({ error: "Customer is required." }),
    }),
  ),
]);

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
