import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import Dialog from "@renderer/shared/components/ui/Dialog";
import Input from "@renderer/shared/components/ui/Input";
import { ReactNode, RefObject, useState } from "react";
import { NumericFormat } from "react-number-format";
import { PaymentParams } from "src/main/interfaces/ISaleRepository";

type Props = {
  ref: RefObject<HTMLButtonElement | null>;
  maximumValue: number;
  onSubmit: ({ amount, refNo, method }: Omit<PaymentParams, "id">) => void;
  errorMessage?: string;
};

export default function Pay({
  ref,
  maximumValue,
  onSubmit,
  errorMessage,
}: Props): ReactNode {
  const [value, setValue] = useState(0);
  // const [refNo, setRefNo] = useState("");
  // const [method, setMethod] = useState<PaymentParams["method"]>("cash");

  return (
    <>
      <Dialog>
        <Dialog.Trigger ref={ref}>Pay</Dialog.Trigger>
        <Dialog.Content className="max-w-[320px]">
          <Dialog.Header>Payment</Dialog.Header>
          <Dialog.Body>
            <NumericFormat
              value={value}
              allowNegative={false}
              customInput={Input}
              isAllowed={(values) => {
                const { floatValue } = values;
                return floatValue === undefined || floatValue <= maximumValue;
              }}
              onValueChange={(values) => {
                const { floatValue } = values;

                if (floatValue) {
                  if (floatValue > maximumValue) {
                    setValue(maximumValue);
                    return;
                  }
                  setValue(floatValue);
                }
              }}
            />

            {errorMessage && (
              <Alert variant="danger" className="mx-3">
                {errorMessage}
              </Alert>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close variant="outline">Cancel</Dialog.Close>
            <Button
              onClick={() =>
                onSubmit({ amount: value, refNo: "", method: "cash" })
              }
            >
              Payment
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
