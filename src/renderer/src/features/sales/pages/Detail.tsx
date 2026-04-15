import Items from "@renderer/shared/components/Items";
import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import Price from "@renderer/shared/components/ui/Price";
import {
  arrKeyValueToObj,
  downloadblePDF,
  humanize,
} from "@renderer/shared/utils";
import { ReturnItemType } from "@renderer/shared/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, ReactNode, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBoundStore from "@renderer/shared/stores//boundStore";
import Return from "../components/Return";
import Badge from "@renderer/shared/components/ui/Badge";
import { FileText, Printer, XCircle } from "react-feather";
import { SettingsType } from "../../../shared/utils/types";
import Mark from "@renderer/features/salesOrders/components/Mark";
import Pay from "../components/Pay";
import SaleItemsRow from "../components/SaleItemsRow";
import { PaymentParams } from "src/main/interfaces/ISaleRepository";
import AppliedPayments from "../components/AppliedPayments";
import CreditAndReturn from "../components/CreditAndReturn";
const headers = [
  { label: "Name", className: "" },
  { label: "Unit", className: "" },
  { label: "Quantity", className: "text-right" },
  { label: "Returned", className: "text-right" },
  { label: "Unit Cost", className: "text-right" },
  { label: "Unit Price", className: "text-right" },
  { label: "Total", className: "text-right" },
];

export default function Detail(): ReactNode {
  const { id } = useParams();

  const user = useBoundStore((state) => state.user);

  const navigate = useNavigate();

  const refReturnBtn = useRef<HTMLButtonElement | null>(null);
  const refPayBtn = useRef<HTMLButtonElement | null>(null);

  const [selectedItems, setSelectedItems] = useState<
    Map<
      string,
      {
        isChecked: boolean;
        price: number;
        newQty: number;
        disposition: ReturnItemType["disposition"];
      }
    >
  >(new Map());

  const { data, isPending, error } = useQuery({
    queryKey: [id, "sales-detail"],
    queryFn: async () => {
      if (!Number(id)) {
        throw new Error("No invoice found");
      }
      const { data, error } = await window.apiSale.getById(Number(id));

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  const queryClient = useQueryClient();

  const mutationUpdateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!Number(id) && status === "voided") {
        return;
      }
      const { success, error } = await window.apiSale.updateSaleStatus({
        id: Number(id),
        status,
      });
      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [id] });
    },
  });

  const { mutate: mutatePayment, error: paymentError } = useMutation({
    mutationFn: async ({
      refNo,
      method,
      amount,
    }: Omit<PaymentParams, "id">) => {
      if (!id) {
        throw new Error("Something went wrong!");
      }

      const { error } = await window.apiSale.pay({
        id: Number(id),
        refNo,
        method,
        amount,
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [id, "sales-detail"] });
      if (refPayBtn.current) {
        refPayBtn.current?.click();
      }
    },
  });

  const mutationReturn = useMutation({
    mutationFn: async () => {
      if (!id || !user.id || !data || !data?.items) {
        throw new Error("Something went wrong!");
      }
      const items: Array<
        Omit<ReturnItemType, "id" | "created_at" | "return_id">
      > = [];
      for (const [key, value] of selectedItems) {
        const found = data.items.find((i) => i.id === Number(key));

        if (
          !found ||
          found.available_qty < 1 ||
          found.return_qty >= found.quantity
        ) {
          throw new Error(
            "Something went wrong while trying to process a return",
          );
        }

        items.push({
          product_id: found?.product_id,
          quantity:
            value.newQty > found.available_qty
              ? found.available_qty
              : value.newQty,
          old_quantity: found.inventory_qty,
          refund_price: value.price,
          inventory_id: found.inventory_id,
          available_qty: found.available_qty,
          disposition: value.disposition ?? "restock",
          user_id: user.id,
          sale_id: Number(id),
          sale_item_id: Number(key),
        });
      }

      const payload = {
        sale_id: Number(id),
        user_id: user.id,
        items,
        method: "cash" as const,
        amount: items.reduce(
          (acc, cur) => (acc += cur.refund_price * (cur.quantity ?? 0)),
          0,
        ),
      };

      const { error } = await window.apiReturn.create(payload);

      if (error instanceof Error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [id, "sales-detail"] });
      setSelectedItems(new Map());
      if (refReturnBtn?.current) {
        refReturnBtn?.current.click();
        setSelectedItems(new Map());
      }
    },
  });

  const handleToggleAll = (e: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = e.target;

    if (data) {
      if (checked) {
        const ids = data?.items.reduce((acc, cur) => {
          acc[cur.id] = {
            isChecked: e.target.checked,
            price:
              data?.items?.find((item) => item.id === cur.id)?.unit_price ?? 0,
            newQty:
              data?.items?.find((item) => item.id === cur.id)?.available_qty ??
              0,
          };

          return acc;
        }, {});
        setSelectedItems(new Map(Object.entries(ids)));
        return;
      }

      setSelectedItems(new Map());
    }
  };

  const handleToggleSelect =
    (id: string | number) => (e: ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;

      const items = new Map(selectedItems);

      checked
        ? items.set(`${id}`, {
            isChecked: true,
            price: data?.items?.find((item) => item.id === id)?.unit_price ?? 0,
            newQty: data?.items?.find((item) => item.id === id)?.quantity ?? 0,
            disposition: items.get(`${id}`)?.disposition || "restock",
          })
        : items.delete(`${id}`);

      if (items.size === data?.items.length && data?.items.length > 0) {
        if (!checked) {
          setSelectedItems(new Map());
          return;
        }
        const ids = data?.items.reduce((acc, cur) => {
          acc[cur.id] = {
            isChecked: true,
            price:
              data?.items?.find((item) => item.id === cur.id)?.unit_price ?? 0,
            newQty: items.get(`${cur.id}`)?.newQty || cur.available_qty,
            disposition: items.get(`${cur.id}`)?.disposition || "restock",
          };

          return acc;
        }, {});
        setSelectedItems(new Map(Object.entries(ids)));
        return;
      }

      setSelectedItems(items);
    };

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  if (!data) {
    return <Alert variant="danger">No Details for this Sale Record</Alert>;
  }

  const settingsArr: { key: keyof SettingsType; value: string }[] | undefined =
    queryClient.getQueryData(["settings"]);

  const settings = arrKeyValueToObj<keyof SettingsType, string>(settingsArr);

  const logo = settings?.["logo"];

  const handleDownloadPDF = async (): Promise<void> => {
    try {
      console.log({ data });
      const res = await window.apiElectron.createPDF({
        ...data,
        ...settings,
        logo: logo || "",
      });

      downloadblePDF({ res, invoiceNumber: data?.invoice_number });
    } catch (error) {
      console.error(error);
    }
  };

  const handlePrintPDF = async (): Promise<void> => {
    try {
      const res = await window.apiElectron.createPDF({
        ...data,
        ...settings,
        logo: logo ?? "",
      });

      await window.apiElectron.printPDF({
        arrayBuffer: res,
        isSilent:
          settings?.is_print_silent === undefined
            ? true
            : !!Number(settings?.is_print_silent),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const returnable = data?.items?.some((item) => item.available_qty > 0);

  const isLocked = ["void", "partial_return", "return"].find(
    (status) => status === data?.status,
  );

  // const cashRefund =
  //   data?.returns?.reduce(
  //     (acc, cur) => (cur.method !== "credit_memo" ? (acc += cur.amount) : 0),
  //     0,
  //   ) || 0;
  const creditRefund =
    data?.returns?.reduce(
      (acc, cur) => (acc += cur.method === "credit_memo" ? cur.amount : 0),
      0,
    ) || 0;

  const amount = data?.amount;
  const amountDue = data?.total - creditRefund - amount;

  // const isBalanceDue = data?.total > amount && amount;

  return (
    <div className="flex flex-col h-[100svh] py-4">
      <header className="shrink-0 flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
        <div className="">
          <div className="flex justify-end gap-x-2 mb-4">
            {!["complete", "void", "return"].find(
              (s) => s === data?.status,
            ) && (
              <div>
                <Pay
                  ref={refPayBtn}
                  maximumValue={data?.total - data?.amount}
                  errorMessage={paymentError?.message}
                  onSubmit={mutatePayment}
                />
              </div>
            )}
            <div>
              <Button variant="outline" size="sm" onClick={handlePrintPDF}>
                <Printer size={14} /> Print PDF
              </Button>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <FileText size={14} /> Download PDF
              </Button>
            </div>
            {data?.status !== "void" && returnable && (
              <Return
                ref={refReturnBtn}
                // status={data.status}
                items={data.items}
                onToggleAll={handleToggleAll}
                onToggleSelect={handleToggleSelect}
                selectedItems={selectedItems}
                onSelectedItems={setSelectedItems}
                errorMessage={mutationReturn.error?.message}
                onClear={mutationReturn.reset}
                onReturn={mutationReturn.mutate}
              />
            )}
            {!isLocked &&
              data?.status !== "complete" &&
              data?.status !== "partial_paid" && (
                <Button
                  variant="danger"
                  onClick={() => mutationUpdateStatus.mutate("void")}
                >
                  <XCircle size={14} /> Void
                </Button>
              )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between">
          <div className="my-3">
            {data?.customer_name && (
              <>
                <h4 className="font-medium">Customer's Name</h4>
                <p>{data?.customer_name}</p>
              </>
            )}
          </div>

          <div className="text-right">
            <h2 className="font-bold">Sale Record</h2>
            <p className="text-xl">{data?.invoice_number}</p>
            <p>{new Date(data.created_at).toLocaleString()}</p>
            <div className="flex gap-x-2 justify-end">
              <div>
                <Badge>{humanize(data.status)}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-x-3 my-3">
          <Mark
            isLocked={true}
            billTo={data?.bill_to}
            shipTo={data?.ship_to}
            onChange={() => {}}
          />
        </div>
        {data?.items && (
          <>
            <h3 className="font-medium mb-2">Line Items</h3>
            <div className="">
              <Items
                items={data.items}
                headers={headers}
                renderItems={(item) => (
                  <SaleItemsRow key={item.id} item={item} />
                )}
              />
            </div>
          </>
        )}

        <div className="flex justify-end px-2">
          <div className="flex flex-col gap-y-2 [&_dt]:text-slate-400">
            <dl className="flex justify-between gap-x-4">
              <dt className="">Sub Total:</dt>
              <dd>
                <Price value={data?.sub_total} />
              </dd>
            </dl>
            <dl className="flex justify-between gap-x-4">
              <dt className="">Discount:</dt>
              <dd>
                (
                <Price value={data?.discount} />)
              </dd>
            </dl>
            {/*
          <dl className="flex justify-between gap-x-4">
            <dt className="">Vat Sales:</dt>
            <dd>
              <Price value={data?.vatable_sales} />
            </dd>
          </dl>
          <dl className="flex justify-between gap-x-4">
            <dt className="">12% VAT:</dt>
            <dd>
              <Price value={data?.vat_amount} />
            </dd>
          </dl>
            */}
            <dl className="flex justify-between gap-x-4 font-bold">
              <dt className="">Total:</dt>
              <dd>
                <Price value={data?.total} />
              </dd>
            </dl>
          </div>
        </div>

        <div className="my-3">
          <h3 className="font-medium mb-2">Applied Payments</h3>
          <AppliedPayments items={data?.payments} />
          <CreditAndReturn items={data?.returns} />
        </div>

        <dl className="flex justify-end gap-x-4  my-3 py-3 text-xl">
          <dt className="">Amount Due:</dt>
          <dd>
            <Price value={amountDue} />
          </dd>
        </dl>
      </div>
    </div>
  );
}
