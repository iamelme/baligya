import Button, { ButtonProps } from "@renderer/shared/components/ui/Button";
import Dialog from "@renderer/shared/components/ui/Dialog";
import { SalesOrderType } from "@renderer/shared/utils/types";
import { ReactNode } from "react";

type Props = {
  status?: SalesOrderType["status"];
  onSave: (status?: Props["status"]) => void;
};

type ModalProps = {
  title: string;
  content: string;
  variant: ButtonProps["variant"];
  onSave: () => void;
};

const Modal = ({ onSave, title, content, variant }: ModalProps) => {
  return (
    <Dialog>
      <Dialog.Trigger variant={variant}> {title} </Dialog.Trigger>
      <Dialog.Content className="max-w-[320px]">
        <Dialog.Header>{title}</Dialog.Header>
        <Dialog.Body>{content}</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close variant="ghost">Close</Dialog.Close>
          <Button onClick={() => onSave()}>Proceed</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
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
          <Modal
            variant="ghost"
            title="Cancel Order"
            content="Are you sure you want to cancel this order?"
            onSave={() => onSave("cancelled")}
          />
          <Button onClick={() => onSave("confirmed")} variant="outline">
            Save
          </Button>
          <Button onClick={() => onSave("fulfilled")}>Fulfilled Order</Button>
        </>
      );
    case "draft":
      return (
        <>
          <Modal
            variant="ghost"
            title="Cancel Order"
            content="Are you sure you want to cancel this order?"
            onSave={() => onSave("cancelled")}
          />
          <Button onClick={() => onSave()} variant="outline">
            Save{" "}
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
