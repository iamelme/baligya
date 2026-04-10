import { ReturnItemType, SaleItemType } from "@renderer/shared/utils/types";
import Items from "@renderer/shared/components/Items";
import Dialog from "@renderer/shared/components/ui/Dialog";
import { ChangeEvent, ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import { NumericFormat } from "react-number-format";
import Input from "@renderer/shared/components/ui/Input";
import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import { numericFormatLimit } from "@renderer/shared/utils";
import { CornerUpLeft } from "react-feather";
import Select from "@renderer/shared/components/ui/Select";
// import Textarea from "@renderer/shared/components/ui/Textarea";

type ReturnProp = {
  ref: RefObject<HTMLButtonElement | null>;
  // status: SaleType["status"];
  items: SaleItemType[];
  onToggleAll: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleSelect: (
    id: string | number,
  ) => (e: ChangeEvent<HTMLInputElement>) => void;
  selectedItems: Map<
    string,
    {
      isChecked: boolean;
      price: number;
      newQty: number;
      disposition: ReturnItemType["disposition"];
    }
  >;
  onSelectedItems: (
    v: Map<
      string,
      {
        isChecked: boolean;
        price: number;
        newQty: number;
        disposition: ReturnItemType["disposition"];
      }
    >,
  ) => void;
  errorMessage?: string;
  onClear?: () => void;
  onReturn: () => void;
};

// const options = [
//   { value: "cash", label: "Cash" },
//   { value: "e-wallet", label: "E-wallet" },
//   { value: "credit_memo", label: "Credit Memo" },
// ];

const dispositionOptions = [
  { value: "restock", label: "Restock" },
  { value: "waste", label: "Waste" },
];

export default function Return({
  ref,
  // status,
  items,
  onToggleAll,
  onToggleSelect,
  selectedItems,
  onSelectedItems,
  errorMessage,
  onClear,
  onReturn,
}: ReturnProp): ReactNode {
  return (
    <Dialog>
      <Dialog.Trigger ref={ref} size="sm" variant="outline">
        <CornerUpLeft size={14} /> Return
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <h3 className="text-lg">Return</h3>
        </Dialog.Header>
        <Dialog.Body>
          {/*  {status === "complete" && <Select options={options} />}*/}

          <Items
            items={items}
            headers={[
              { label: "Name" },
              { label: "Sold", className: "text-right" },
              { label: "Returned", className: "text-right" },
              { label: "Available", className: "text-right" },
              { label: "Disposition", className: "" },
            ]}
            hasCheckBox
            onSelectAll={onToggleAll}
            onSelect={onToggleSelect}
            selected={selectedItems}
            renderItems={(item) => {
              const items = new Map(selectedItems);
              return (
                <>
                  <td className="text-left">
                    <Link to={`/products/${item.product_id}`}>
                      {item.name} - {item.code}
                    </Link>
                  </td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.return_qty}</td>
                  <td className="text-right">
                    <NumericFormat
                      displayType={
                        selectedItems.get(`${item.id}`) &&
                        item.available_qty > 0
                          ? "input"
                          : "text"
                      }
                      customInput={Input}
                      value={item.available_qty}
                      isAllowed={numericFormatLimit(item.available_qty)}
                      allowLeadingZeros={false}
                      decimalScale={0}
                      className="text-right"
                      onValueChange={(values) => {
                        const { floatValue } = values;
                        if (floatValue) {
                          onSelectedItems(
                            items.set(`${item.id}`, {
                              isChecked: true,
                              price: item.unit_price,
                              newQty: floatValue,
                              disposition:
                                items.get(`${item.id}`)?.disposition ||
                                "restock",
                            }),
                          );
                        } else {
                          items.delete(`${item.id}`);
                          onSelectedItems(items);
                        }
                      }}
                    />
                  </td>
                  <td>
                    <Select
                      disabled={!selectedItems.get(`${item.id}`)?.isChecked}
                      options={dispositionOptions}
                      onChange={(e) => {
                        // console.log({ selectedItems });
                        // console.log({ items });
                        onSelectedItems(
                          items.set(`${item.id}`, {
                            isChecked:
                              items.get(`${item.id}`)?.isChecked || false,
                            price: item.unit_price,
                            newQty: item.quantity,
                            disposition:
                              (e.target
                                .value as ReturnItemType["disposition"]) ||
                              "restock",
                          }),
                        );
                      }}
                    />
                  </td>
                </>
              );
            }}
          />

          {/* <Textarea value={""} placeholder="Reason..." />*/}
          {errorMessage && (
            <Alert variant="danger" className="text-left">
              {errorMessage}
            </Alert>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close variant="outline" onClick={() => onClear?.()}>
            Cancel
          </Dialog.Close>
          <Button onClick={() => onReturn()}>Return</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
