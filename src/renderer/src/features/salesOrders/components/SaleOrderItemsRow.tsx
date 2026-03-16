import Input from "@renderer/shared/components/ui/Input";
import Price from "@renderer/shared/components/ui/Price";
import { ReactNode } from "react";
import { NumericFormat } from "react-number-format";
import { ReturnSalesOrderType } from "src/main/interfaces/ISalesOrderRepository";
import useUpdateData from "../hooks/useUpdateData";

type Props = {
  index: number;
  item: NonNullable<ReturnSalesOrderType["data"]>["items"][number];
  onChange: ReturnType<typeof useUpdateData>;
};

export default function SalesOrderItemsRow({
  index,
  item,
  onChange,
}: Props): ReactNode {
  return (
    <>
      <td>{item.product_name}</td>
      <td>{item.product_desc}</td>
      <td>
        <Input
          type="number"
          value={item.quantity}
          min={1}
          pattern="[1-9]+"
          onChange={(e) =>
            onChange((prev) => {
              const { value } = e.target;

              const { unit_price } = prev.items[index];

              const newQty = Number(value) || 0;

              const newItems = prev?.items?.map((i, idx) =>
                index === idx
                  ? {
                      ...i,
                      quantity: newQty,
                      line_total: newQty * unit_price,
                    }
                  : i,
              );

              return { items: newItems };
            })
          }
        />
      </td>
      <td className="text-right">
        <Price value={item.unit_cost} />
      </td>
      <td className="text-right">
        <NumericFormat
          allowNegative={false}
          value={(Number(item.unit_price) || 0) / 100}
          customInput={Input}
          onValueChange={(values) => {
            const { floatValue } = values;

            onChange((prev) => {
              const { quantity } = prev.items[index];

              if (floatValue === undefined) {
                return prev;
              }

              if (floatValue <= 0) {
                return prev;
              }

              const newItems = prev?.items?.map((i, idx) =>
                index === idx
                  ? {
                      ...i,
                      unit_price: floatValue * 100,
                      line_total: quantity * floatValue * 100,
                    }
                  : i,
              );

              return { items: newItems };
            });
          }}
          thousandSeparator
          className="text-right"
        />
      </td>
      <td className="text-right">
        <Price value={item.discount} />
      </td>
      <td className="text-right">
        <Price value={item.line_total} />
      </td>
    </>
  );
}
