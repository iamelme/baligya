import { createContext, ReactNode, useContext } from "react";
import { NumericFormat } from "react-number-format";

import Price from "@renderer/shared/components/ui/Price";
import { ReturnCartType } from "@renderer/shared/utils/types";
import Input from "@renderer/shared/components/ui/Input";

type Summary = ReturnCartType & {
  handleDiscount: (v: number) => void;
};

const SummaryContext = createContext<Summary | undefined>(undefined);

export default function Summary({
  data,
  onChangeDiscount,
  children,
}: {
  data: ReturnCartType;
  onChangeDiscount: (v: number) => void;
  children: ReactNode;
}): ReactNode {
  // console.log('ctx data', data)

  // const handleDiscount = (v: number): void => setDiscount(v)
  const handleDiscount = (v: number): void => onChangeDiscount(v);
  // const handleDiscount = (v: number): void => {
  //   onChangeDiscount(v)
  // }

  return (
    <SummaryContext
      value={{
        ...data,
        // discount,
        handleDiscount,
      }}
    >
      <div className="flex flex-col gap-y-3 [&_dt]:text-slate-500">
        {children}
      </div>
    </SummaryContext>
  );
}

const useSummaryContext = (): Summary => {
  const ctx = useContext(SummaryContext);

  if (!ctx) {
    throw new Error("Component should be inside the context");
  }

  return ctx;
};

function NoOfItems(): ReactNode {
  const ctx = useSummaryContext();

  const num = ctx?.items?.reduce((acc, cur) => (acc += cur.quantity), 0);

  return (
    <dl className="flex justify-between">
      <dt>No. of Items:</dt>
      <dd data-testid="noOfItems">{num ?? 0}</dd>
    </dl>
  );
}

function SubTotal(): ReactNode {
  const ctx = useSummaryContext();

  //   const subTotal = ctx?.reduce((acc, cur) => (acc += cur.quantity * cur.price), 0)

  return (
    <dl className="flex justify-between">
      <dt>Sub Total:</dt>
      <dd data-testid="subTotal">
        <Price value={ctx.sub_total} />
      </dd>
    </dl>
  );
}

function Discount(): ReactNode {
  const ctx = useSummaryContext();

  // console.log('discount ctx', ctx)

  return (
    <dl className="flex justify-between gap-x-3">
      <dt>Discount:</dt>
      <dd>
        <NumericFormat
          data-testid="discount-textfield"
          value={ctx.discount / 100}
          customInput={Input}
          onValueChange={(values) => {
            const { floatValue } = values;

            if (floatValue === undefined) {
              ctx.handleDiscount(0);
              return;
            }

            if (floatValue <= 0) {
              ctx.handleDiscount(0);
              return;
            }
            ctx.handleDiscount(floatValue);
          }}
          thousandSeparator
          className="text-right"
        />
      </dd>
    </dl>
  );
}

function Tax(): ReactNode {
  const ctx = useSummaryContext();

  return (
    <dl className="flex justify-between">
      <dt>Tax (Inclusive):</dt>
      <dd>{ctx?.tax ?? 0}%</dd>
    </dl>
  );
}

function Total(): ReactNode {
  const ctx = useSummaryContext();

  return (
    <dl className="flex justify-between font-bold">
      <dt className="">Total:</dt>
      <dd data-testid="total">
        <Price value={ctx.total} />
      </dd>
    </dl>
  );
}

Summary.NoOfItems = NoOfItems;
Summary.SubTotal = SubTotal;
Summary.Discount = Discount;
Summary.Tax = Tax;
Summary.Total = Total;
