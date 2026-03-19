import dayjs from "dayjs";
import useProductSearch from "@renderer/features/product/hooks/useProductSearch";
import useDebounce from "@renderer/shared/hooks/useDebounce";
import { ChangeEvent, ReactNode, useRef, useState } from "react";
import Input from "@renderer/shared/components/ui/Input";
import ResultItems from "../components/ResultItems";
import useBoundStore from "@renderer/shared/stores/boundStore";
import { useParams } from "react-router-dom";
import Items from "@renderer/shared/components/Items";
import useSalesOrderPage from "../hooks/useSalesOrderPage";
import useUpdateData from "../hooks/useUpdateData";
import Textarea from "@renderer/shared/components/ui/Textarea";
import { headers, isStatusLocked, mapper } from "../utils";
import useCustomerSearch from "../hooks/useCustomerSearch";
import Summary from "@renderer/features/pos/components/Summary";
import SalesOrderItemsRow from "../components/SaleOrderItemsRow";
import CustomerSearch from "../components/CustomerSearch";
import { SalesOrderType } from "@renderer/shared/utils/types";
import { ReturnSalesOrderType } from "src/main/interfaces/ISalesOrderRepository";
import Mark from "../components/Mark";
import Alert from "@renderer/shared/components/ui/Alert";
import Actions from "../components/Actions";

export default function SalesOrder(): ReactNode {
  const { id } = useParams();
  const userId = useBoundStore((state) => state.user.id);

  const [searchTerm, setSearchTerm] = useState("");
  const { data } = useProductSearch({
    searchTerm: useDebounce(searchTerm, 450),
  });

  const [searchCust, setSearchCust] = useState("");
  const { data: customers, isPending } = useCustomerSearch({
    searchTerm: useDebounce(searchCust, 450),
  });

  const initialData = useRef<NonNullable<ReturnSalesOrderType["data"]>>(null);

  const { salesOrder, onSave, errors } = useSalesOrderPage({
    id: String(id),
    userId: String(userId),
  });

  if (salesOrder && initialData.current === null) {
    initialData.current = salesOrder;
  }

  const onChange = useUpdateData({ orderId: String(id) });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    onChange(() => ({ [name]: value }));
  };

  console.log({ salesOrder });
  console.log({ initialData });

  const handleDiscountChange = (v: number) => {
    onChange((prev) => {
      const discount = v * 100;

      const total = prev.sub_total - discount;
      return { discount, total };
    });
  };

  return (
    <>
      <h3>Sales Order</h3>
      <div className="flex gap-x-3 mb-3">
        <div>
          <CustomerSearch
            customer={salesOrder?.customer_name}
            onSearchCustomer={setSearchCust}
            customers={customers}
            onChange={onChange}
            isLoading={isPending}
          />
        </div>

        <div>
          <Input
            type="date"
            value={dayjs(salesOrder?.due_at).format("YYYY-MM-DD")}
            onChange={(e) =>
              onChange(() => ({
                due_at: dayjs(e.target.value).format("YYYY-MM-DD"),
              }))
            }
          />
        </div>
      </div>

      <div className="flex gap-x-3 mb-3">
        <Mark
          initialData={{
            bill_to: initialData.current?.bill_to ?? "",
            ship_to: initialData.current?.ship_to ?? "",
          }}
          billTo={salesOrder?.bill_to}
          shipTo={salesOrder?.ship_to}
          onChange={onChange}
        />
      </div>

      <Items
        headers={headers}
        items={salesOrder?.items}
        renderItems={(item, index) => (
          <SalesOrderItemsRow
            key={item.id || index}
            item={item}
            index={index}
            onChange={onChange}
          />
        )}
      />

      <div className="flex gap-x-3 justify-between">
        <div className="flex-1 max-w-[50%]">
          <Textarea
            name="notes"
            placeholder="Notes..."
            defaultValue={salesOrder?.notes}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-y-3 [&_dl]:gap-x-4">
          {salesOrder && (
            <Summary data={salesOrder} onChangeDiscount={handleDiscountChange}>
              <Summary.SubTotal />
              <Summary.Discount />
              <Summary.Total />
            </Summary>
          )}
        </div>
      </div>
      {errors && (
        <Alert variant="danger" className="mb-3">
          {JSON.stringify(errors, null, 2)}
        </Alert>
      )}
      <div className="flex gap-x-3">
        <Actions
          status={id === "new" ? undefined : salesOrder?.status}
          onSave={onSave}
        />
      </div>
    </>
  );
}
