import Button from "@renderer/shared/components/ui/Button";
import { SalesOrderType } from "@renderer/shared/utils/types";
import { ReactNode } from "react";

type Props = {
  status?: SalesOrderType["status"];
  onSave: (status?: Props["status"]) => void;
};

export default function Actions({ status, onSave }: Props): ReactNode {
  switch (status) {
    case "complete":
    case "cancelled":
      return null;
    case "fulfilled":
      return <Button onClick={() => onSave("complete")}>Complete Order</Button>;
    case "confirmed":
      return (
        <>
          <Button onClick={() => onSave("cancelled")} variant="danger">
            Cancel Order
          </Button>
          <Button onClick={() => onSave("fulfilled")}>Fulfilled Order</Button>
        </>
      );
    case "draft":
      return (
        <>
          <Button onClick={() => onSave("cancelled")} variant="danger">
            Cancel Order
          </Button>
          <Button onClick={() => onSave("confirmed")}>Confirmed Order</Button>
        </>
      );
    default:
      return (
        <>
          <Button onClick={() => onSave()} variant="outline">
            Save as draft
          </Button>
          <Button onClick={() => onSave("confirmed")}>Confirmed Order</Button>
        </>
      );
  }
}
