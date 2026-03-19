import Address from "@renderer/shared/components/Address";
import Card from "@renderer/shared/components/ui/Card";
import { ChangeEvent, ReactNode } from "react";
import { Edit2, MapPin } from "react-feather";
import useUpdateData from "../hooks/useUpdateData";
import Dialog from "@renderer/shared/components/ui/Dialog";
import Textarea from "@renderer/shared/components/ui/Textarea";

type Props = {
  initialData?: {
    bill_to: string;
    ship_to: string;
  };
  billTo?: string;
  shipTo?: string;
  onChange: ReturnType<typeof useUpdateData>;
};

export default function Mark({
  initialData,
  billTo,
  shipTo,
  onChange,
}: Props): ReactNode {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(() => ({ [name]: value }));
  };

  const handleDiscard = (name: "bill_to" | "ship_to") => {
    console.log("name", name);
    onChange(() => ({ [name]: initialData?.[name] }));
  };
  return (
    <>
      <Card
        className="flex-1"
        content={
          <Address
            title={
              <div className="flex justify-between">
                <h3 className="flex gap-x-2 items-center">
                  <MapPin size={14} /> Bill To
                </h3>

                <Dialog>
                  <Dialog.Trigger variant="ghost" size="icon">
                    <Edit2 size={14} />
                  </Dialog.Trigger>
                  <Dialog.Content className="max-w-[36em]">
                    <Dialog.Header>
                      <h3 className="flex gap-x-2 items-center">
                        <MapPin size={14} /> Bill to
                      </h3>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Textarea
                        name="bill_to"
                        defaultValue={billTo ?? ""}
                        onChange={handleChange}
                      />
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Dialog.Close
                        variant="outline"
                        onClick={() => handleDiscard("bill_to")}
                      >
                        Discard
                      </Dialog.Close>
                      <Dialog.Close>Done</Dialog.Close>
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog>
              </div>
            }
            address={billTo ?? ""}
          />
        }
      />
      <Card
        className="flex-1"
        content={
          <Address
            title={
              <div className="flex justify-between">
                <h3 className="flex gap-x-2 items-center">
                  <MapPin size={14} /> Ship To
                </h3>

                <Dialog>
                  <Dialog.Trigger variant="ghost" size="icon">
                    <Edit2 size={14} />
                  </Dialog.Trigger>
                  <Dialog.Content className="max-w-[36em]">
                    <Dialog.Header>
                      <h3 className="flex gap-x-2 items-center">
                        <MapPin size={14} /> Ship To
                      </h3>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Textarea
                        name="ship_to"
                        defaultValue={shipTo ?? ""}
                        onChange={handleChange}
                      />
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Dialog.Close
                        variant="outline"
                        onClick={() => handleDiscard("ship_to")}
                      >
                        Discard
                      </Dialog.Close>
                      <Dialog.Close>Done</Dialog.Close>
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog>
              </div>
            }
            address={shipTo ?? ""}
          />
        }
      />
    </>
  );
}
