import Input from "@renderer/shared/components/ui/Input";
import Price from "@renderer/shared/components/ui/Price";
import { ReactNode } from "react";
import { NumericFormat } from "react-number-format";
import { ReturnSalesOrderType } from "src/main/interfaces/ISalesOrderRepository";
import useUpdateData from "../hooks/useUpdateData";
import Button from "@renderer/shared/components/ui/Button";
import { Trash2 } from "react-feather";

type Props = {
  index: number;
  isLocked: boolean;
  item: NonNullable<ReturnSalesOrderType["data"]>["items"][number];
  onChange: ReturnType<typeof useUpdateData>;
};

export default function SalesOrderItemsRow({
  index,
  isLocked,
  item,
  onChange,
}: Props): ReactNode {
  return (
    <>
      <td>{item.product_name}</td>
      <td>{item.product_desc}</td>
      <td>
        {isLocked ? (
          item.quantity
        ) : (
          <Input
            type="number"
            value={item.quantity}
            min={1}
            max={item.available}
            pattern="[1-9]+"
            onChange={(e) =>
              onChange((prev) => {
                const { value } = e.target;

                const parseQty = Number(value) || 0;
                const quantity =
                  parseQty >= item.available ? item.available : parseQty;
                const { unit_price } = prev.items[index];

                const newItems = prev?.items?.map((i, idx) =>
                  index === idx
                    ? {
                        ...i,
                        quantity,
                        line_total: quantity * unit_price,
                      }
                    : i,
                );

                return { items: newItems };
              })
            }
          />
        )}
      </td>
      <td>{item.product_unit}</td>
      <td className="text-right">
        <Price value={item.unit_cost} />
      </td>
      <td className="text-right">
        <NumericFormat
          displayType={isLocked ? "text" : "input"}
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
      <td className="text-right">
        {!isLocked && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              onChange((prev) => {
                const newItems = prev?.items?.filter((_, idx) => idx !== index);

                return { items: newItems };
              });
            }}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </td>
    </>
  );
}
