import Summary from "../components/Summary";
import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import Input from "@renderer/shared/components/ui/Input";
import Price from "@renderer/shared/components/ui/Price";
import useBoundStore from "@renderer/shared/stores//boundStore";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Trash2 } from "react-feather";
import { NumericFormat } from "react-number-format";
import CartItems from "../components/CartItems";
import useCart from "../hooks/useCart";
import useInsertCartItem from "../hooks/useInsertCartItem";
import useRemoveCart from "../hooks/useRemoveCart";
import useDebounce from "@renderer/shared/hooks/useDebounce";
import useDiscount from "../hooks/useDiscount";
import useRemoveItem from "../hooks/useRemoveItem";
import useUpdateItemQty from "../hooks/useUpdateItemQty";
import usePlaceOrder from "../hooks/usePlaceOrder";
import { CartItemType, SettingsType } from "@renderer/shared/utils/types";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function POS(): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const inputRefNoRef = useRef<HTMLInputElement>(null);
  const inputRefCustName = useRef<HTMLInputElement>(null);
  const btnUpdateQtyRef = useRef({});

  const [discount, setDiscount] = useState(0);
  const queryClient = useQueryClient();
  const settings: SettingsType | undefined = queryClient.getQueryData([
    "settings",
  ]);

  const navigate = useNavigate();

  const setBtnRef = (item: CartItemType, el: HTMLElement | null): void => {
    if (el) {
      btnUpdateQtyRef.current[item.id] = el;
      btnUpdateQtyRef.current[item.id].quantity = item.quantity;
    } else {
      delete btnUpdateQtyRef.current[item.id];
    }
  };

  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const isFirstRender = useRef(true);

  const user = useBoundStore((state) => state.user);

  const { data, isPending, error } = useCart(user?.id);

  const mutationInsert = useInsertCartItem({
    id: data?.id,
    userId: user.id,
    inputRef,
  });

  const mutationRemoveCart = useRemoveCart({
    id: data?.id,
    onAmount: setAmount,
    onPaymentMethod: setPaymentMethod,
    inputRefNoRef,
    inputRefCustName,
  });

  const debounceValue = useDebounce(String(discount));

  const mutationUpdateDiscount = useDiscount({
    id: data?.id,
    total: data?.total || 0,
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mutationUpdateDiscount.mutate(Number(debounceValue));
  }, [debounceValue]);

  const mutationUpdateItemQty = useUpdateItemQty({
    id: data?.id,
    btnUpdateQtyRef,
  });

  const mutationPlaceOrder = usePlaceOrder({
    onRemoveCart: () => mutationRemoveCart.mutate(),
  });

  const mutationRemoveItem = useRemoveItem({
    id: data?.id,
    onRemoveCart:
      data?.items?.length === 1 ? () => mutationRemoveCart.mutate() : undefined,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (inputRef.current && data?.id && user.id && inputRef.current.value) {
      mutationInsert.mutate(Number(inputRef.current.value));
    }
  };

  const handleClearCart = async (): Promise<void> => {
    mutationRemoveCart.mutate();
  };

  const handlePlaceOrder = async (): Promise<void> => {
    if (!data?.id || !user.id || !data?.items?.length) {
      throw new Error("Cannot place an order");
    }

    const saleId = await mutationPlaceOrder.mutateAsync({
      cart: {
        items: data.items,
        sub_total: data.sub_total,
        discount: data.discount,
        vatable_sales: data.vatable_sales,
        vat_amount: data.vat_amount,
        tax: data.tax,
        total: data.total,
      },
      amount: amount ?? 0,
      reference_number: inputRefNoRef.current
        ? inputRefNoRef.current.value
        : "",
      customer_name: inputRefCustName.current
        ? inputRefCustName.current.value
        : "",
      method: paymentMethod,
      sale_id: data.id,
      user_id: user.id,
    });

    if (saleId?.id && settings?.is_redirect_to_sales) {
      navigate(`/sales/${saleId.id}`);
    }
  };
  console.log({ settings });

  const handleRemoveItem = async (id: number): Promise<void> => {
    mutationRemoveItem.mutate(id);
  };

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  return (
    <div className="flex min-h-full">
      <div className="flex-1">
        <form onSubmit={handleSubmit}>
          <Input autoFocus ref={inputRef} placeholder="" />
          {mutationInsert.error && (
            <Alert variant="danger" className="my-3">
              {mutationInsert.error.message}
            </Alert>
          )}
        </form>
        {data?.items && (
          <CartItems
            items={data.items}
            btnUpdateQtyRef={btnUpdateQtyRef}
            onBtnRef={setBtnRef}
            onUpdateItemQty={mutationUpdateItemQty.mutate}
            onRemoveItem={handleRemoveItem}
          />
        )}
      </div>

      <aside className="w-[250px] ms-3">
        <div className="mb-3 p-4 bg-white rounded-md border border-slate-300">
          <div className="flex justify-between gap-x-2 mb-3">
            <h2 className="font-bold mb-3">Order Summary</h2>
            <div>
              <Button
                disabled={!data?.items?.length}
                variant="danger"
                size="icon"
                title="Remove Order"
                onClick={handleClearCart}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          <Summary
            data={data}
            onChangeDiscount={(v) => {
              // console.log('on change summary', v)
              setDiscount(v);
            }}
          >
            <Summary.NoOfItems />
            <Summary.SubTotal />
            <Summary.Discount />
            <Summary.Tax />
            <Summary.Total />
          </Summary>
        </div>

        <div className="mb-3 p-4 bg-white rounded-md border border-slate-300">
          <h3 className="mb-2 font-bold">Customer</h3>
          <div className="my-3">
            <label htmlFor="customerNameRef">Name</label>
            <Input ref={inputRefCustName} id="customerNameRef" />
          </div>
        </div>

        <div className="mb-3 p-4 bg-white rounded-md border border-slate-300">
          <h3 className="mb-2 font-bold">Payment</h3>

          <div className="mb-3">
            <label htmlFor="method" className="block mb-1">
              Method
            </label>
            <select
              id="method"
              onChange={(e) => setPaymentMethod(e.target.value)}
              value={paymentMethod}
              className="w-full py-1 px-2 border border-slate-400 rounded-md"
            >
              <option value="e-wallet">E-wallet</option>
              <option value="cash">Cash</option>
            </select>

            {paymentMethod !== "cash" && (
              <div className="my-3">
                <label htmlFor="refNo">Reference No.</label>
                <Input ref={inputRefNoRef} id="refNo" />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="amount">Amount Paid</label>

            <NumericFormat
              getInputRef={inputAmountRef}
              onValueChange={(values) => {
                const { floatValue } = values;

                if (floatValue === undefined) {
                  setAmount(0);
                  return;
                }

                if (floatValue > -1) {
                  setAmount(floatValue);
                }
              }}
              value={amount}
              customInput={Input}
              thousandSeparator
              className="text-right"
            />
          </div>

          <div className="mb-3">
            <dl className="flex justify-between gap-x-2">
              <dt>Change Due:</dt>
              <dd>
                <Price value={amount * 100 - data?.total} />
              </dd>
            </dl>
          </div>
        </div>

        <div className="">
          {mutationPlaceOrder.error && (
            <Alert className="my-3" variant="danger">
              {mutationPlaceOrder.error.message}
            </Alert>
          )}
          <Button
            full
            onClick={handlePlaceOrder}
            disabled={!data?.items?.length || amount * 100 - data?.total < 0}
          >
            Place an Order
          </Button>
        </div>
      </aside>
    </div>
  );
}
