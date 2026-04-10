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
import Summary from "@renderer/features/salesLog/components/Summary";
import SalesOrderItemsRow from "../components/SaleOrderItemsRow";
import CustomerSearch from "../components/CustomerSearch";
import { ReturnSalesOrderType } from "src/main/interfaces/ISalesOrderRepository";
import Mark from "../components/Mark";
import Actions from "../components/Actions";
import ListPage from "@renderer/shared/components/ListPage";
import ErrorList from "../components/ErrorList";

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

  const initialData = useRef<ReturnSalesOrderType["data"]>(null);

  const {
    salesOrder,
    onSave,
    errors,
    isPending: isSalesOrderPending,
    error,
  } = useSalesOrderPage({
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

  const handleDiscountChange = (v: number) => {
    onChange(() => {
      const discount = v * 100;

      return { discount };
    });
  };

  const isLocked = isStatusLocked(initialData?.current?.status ?? "draft");

  return (
    <ListPage
      header={{
        left: {
          title: `${id === "new" ? "New" : salesOrder?.order_number}`,
          subTitle: `Order`,
        },
      }}
      isPending={isSalesOrderPending}
      error={error}
      content={
        <>
          <div className="flex gap-x-3 mb-3">
            <div>
              <label className="block mb-1 font-medium">Customer's Name</label>

              <CustomerSearch
                customer={salesOrder?.customer_name}
                onSearchCustomer={setSearchCust}
                customers={customers}
                onChange={onChange}
                isLoading={isPending}
                isLocked={isLocked}
              />
            </div>

            <div>
              <label htmlFor="due_date" className="block mb-1 font-medium">
                Due Date
              </label>
              <Input
                type="date"
                id="due_date"
                name="due_date"
                disabled={isLocked}
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
              isLocked={isLocked}
              initialData={{
                bill_to: initialData.current?.bill_to ?? "",
                ship_to: initialData.current?.ship_to ?? "",
              }}
              billTo={salesOrder?.bill_to}
              shipTo={salesOrder?.ship_to}
              onChange={onChange}
            />
          </div>

          <div className="">
            {!isLocked && (
              <Input
                defaultValue={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product..."
                className=""
              />
            )}
            {data?.results && (
              <div className="my-3">
                <ResultItems
                  items={data?.results}
                  onAddItem={(product) =>
                    onChange((prev) => ({
                      items: mapper(
                        prev.items,
                        product,
                        initialData.current?.items,
                      ),
                    }))
                  }
                />
              </div>
            )}
          </div>

          <div className="mb-3">
            <Items
              headers={headers}
              items={salesOrder?.items}
              renderItems={(item, index) => (
                <SalesOrderItemsRow
                  key={item.id || index}
                  isLocked={isLocked}
                  item={item}
                  index={index}
                  onChange={onChange}
                />
              )}
            />
          </div>

          <div className="flex gap-x-3 justify-between mb-3">
            <div className="flex-1 max-w-[50%]">
              <label htmlFor="notes" className="block mb-1 font-medium">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                disabled={isLocked}
                defaultValue={salesOrder?.notes}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-y-3 [&_dl]:gap-x-4">
              {salesOrder && (
                <Summary
                  data={salesOrder}
                  onChangeDiscount={handleDiscountChange}
                >
                  <Summary.SubTotal />
                  <Summary.Discount displayType={isLocked ? "text" : "input"} />
                  <Summary.Total />
                </Summary>
              )}
            </div>
          </div>
        </>
      }
      footer={
        <>
          {errors && (
            <div className="mb-3">
              <ErrorList errors={errors} />
            </div>
          )}
          <div className="flex gap-x-1">
            <Actions
              status={id === "new" ? undefined : salesOrder?.status}
              onSave={onSave}
            />
          </div>
        </>
      }
    />
  );
}
