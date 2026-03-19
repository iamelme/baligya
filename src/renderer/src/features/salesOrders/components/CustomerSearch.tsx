import { CustomerType } from "@renderer/shared/utils/types";
import { ReactNode } from "react";
import useUpdateData from "../hooks/useUpdateData";
import Combobox from "@renderer/shared/components/ui/Combobox";
// import Combobox from "./Combobox";

type Props = {
  isLoading: boolean;
  customer?: string | null;
  customers?: CustomerType[] | null;
  onSearchCustomer: (v: string) => void;
  onChange: ReturnType<typeof useUpdateData>;
};

export default function CustomerSearch({
  isLoading,
  customer,
  customers,
  onSearchCustomer,
  onChange,
}: Props): ReactNode {
  return (
    <>
      <Combobox
        options={
          customers?.map((cust) => ({
            label: cust.name,
            value: String(cust.id),
          })) ?? []
        }
        isLoading={isLoading}
      >
        <Combobox.Input
          key={customer}
          defaultValue={customer ?? ""}
          onChange={(e) => onSearchCustomer(e.target.value)}
          placeholder="Search customer..."
        />
        <Combobox.List
          onSelect={(value) =>
            onChange(() => {
              const found = customers?.find((c) => c.id === Number(value));

              return {
                customer_id: Number(value),
                customer_name: found?.name,
                bill_to: found?.address ?? "",
                ship_to: found?.address ?? "",
              };
            })
          }
        />
      </Combobox>

      {/*

      <Combobox
        options={
          customers?.map((cust) => ({
            label: cust.name,
            value: String(cust.id),
          })) ?? []
        }
      >
        <Combobox.Input
          defaultValue={customer ?? ""}
          key={customer ?? ""}
          onChange={(e) => onSearchCustomer(e.target.value)}
          placeholder="Search customer..."
        />
        <Combobox.List
          onSelect={(v) =>
            onChange(() => ({
              customer_id: Number(v.value),
              customer_name: v.label,
            }))
          }
        />
      </Combobox>






          <Input
        defaultValue={customer ?? ""}
        onChange={(e) => onSearchCustomer(e.target.value)}
        placeholder="Search customer..."
      />
      {customers?.map((cust) => (
        <div
          key={cust.id}
          onClick={() => onChange(() => ({ customer_id: cust.id }))}
        >
          {cust.name}
        </div>
      ))}

*/}
    </>
  );
}
