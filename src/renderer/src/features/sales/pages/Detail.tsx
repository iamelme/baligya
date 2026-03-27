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
import { Link, useNavigate, useParams } from "react-router-dom";
import useBoundStore from "@renderer/shared/stores//boundStore";
import Return from "../components/Return";
import Badge from "@renderer/shared/components/ui/Badge";
import { FileText, Printer, XCircle } from "react-feather";
import { SettingsType } from "../../../shared/utils/types";
import Mark from "@renderer/features/salesOrders/components/Mark";
const headers = [
  { label: "Name", className: "" },
  { label: "Quantity", className: "text-right" },
  { label: "Unit Cost", className: "text-right" },
  { label: "Unit Price", className: "text-right" },
  { label: "Total", className: "text-right" },
];

export default function Detail(): ReactNode {
  const { id } = useParams();

  const user = useBoundStore((state) => state.user);

  const navigate = useNavigate();

  const refReturnBtn = useRef<HTMLButtonElement | null>(null);

  const [selectedItems, setSelectedItems] = useState<
    Map<string, { isChecked: boolean; price: number; newQty: number }>
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
          user_id: user.id,
          sale_id: Number(id),
          sale_item_id: Number(key),
        });
      }

      const payload = {
        sale_id: Number(id),
        user_id: user.id,
        items,
        refund_amount: items.reduce(
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

  const returnable = data?.items?.every((item) => item.available_qty > 0);

  return (
    <div className="py-4">
      <div className="flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
        <div className="text-right">
          <div className="flex justify-end gap-x-2 mb-4">
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
                items={data.items}
                onToggleAll={handleToggleAll}
                onToggleSelect={handleToggleSelect}
                selectedItems={selectedItems}
                onSelectedItems={setSelectedItems}
                errorMessage={mutationReturn.error?.message}
                onReturn={mutationReturn.mutate}
              />
            )}
            {!["void", "partial_return", "return"].find(
              (status) => status === data?.status,
            ) && (
              <Button
                variant="danger"
                onClick={() => mutationUpdateStatus.mutate("void")}
              >
                <XCircle size={14} /> Void
              </Button>
            )}
          </div>

          <h2 className="font-bold">Sale Record</h2>
          <p className="text-xl">{data?.invoice_number}</p>
          <p>{new Date(data.created_at).toLocaleString()}</p>
          <p>
            {mutationUpdateStatus.error && (
              <Alert className="my-3" variant="danger">
                {mutationUpdateStatus.error?.message}
              </Alert>
            )}

            <Badge>{humanize(data.status)}</Badge>
          </p>
        </div>
      </div>
      <div className="my-3">
        <h4 className="font-medium">Customer's Name</h4>
        <p>{data?.customer_name}</p>
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
          <h3 className="font-medium">Line Items</h3>
          <div className="">
            <Items
              items={data.items}
              headers={headers}
              renderItems={(item) => (
                <>
                  <td>
                    <Link to={`/products/${item.product_id}`}>
                      {item.name}
                      {item.code}
                    </Link>
                  </td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">
                    <Price value={item.unit_cost} />
                  </td>
                  <td className="text-right">
                    <Price value={item.unit_price} />
                  </td>
                  <td className="text-right">
                    <Price value={item.unit_price * item.quantity} />
                  </td>
                </>
              )}
            />
          </div>
        </>
      )}

      <div className="flex justify-end">
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
          <dl className="flex justify-between gap-x-4 ">
            <dt className="">Paid Amount:</dt>
            <dd>
              <Price value={data?.amount} />
            </dd>
          </dl>
          <dl className="flex justify-between gap-x-4 ">
            <dt className="">Change Due:</dt>
            <dd>
              <Price value={data?.total - data?.amount} />
            </dd>
          </dl>

          <dl className="flex justify-between gap-x-4 border-t border-b my-3 py-3">
            <dt className="">Payment Method:</dt>
            <dd>{humanize(data?.method)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
