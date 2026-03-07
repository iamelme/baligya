// import FormInput from '@renderer/shared/components/form/FormInput'
// import FormWrapper from '@renderer/shared/components/form/FormWrapper'
// import Alert from '@renderer/shared/components/ui/Alert'
import Button from "@renderer/shared/components/ui/Button";
// import { ProdInventoryType } from '@renderer/interfaces/IInventoryRepository'
// import useBoundStore from '@renderer/shared/stores//boundStore'
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactNode, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import z from 'zod'
import useInventoryFetch from "../hooks/useInventoryFetch";
import Pagination from "@renderer/shared/components/Pagination";
import Input from "@renderer/shared/components/ui/Input";
import ListPage from "@renderer/shared/components/ListPage";
import DateFilter from "@renderer/shared/components/DateFilter";
import Items from "@renderer/shared/components/Items";
import { NumericFormat } from "react-number-format";
import { movementType } from "@renderer/shared/utils/types";
import { addDays, humanize } from "@renderer/shared/utils";
import Dialog from "@renderer/shared/components/ui/Dialog";
import Adjustment from "../components/Adjustment";

// const schema = z.object({
//   id: z.coerce.number().optional(),
//   product_id: z.coerce.number(),
//   quantity: z.coerce.number()
// })
//
// type ValuesType = z.infer<typeof schema>

export default function Detail(): ReactNode {
  const { id } = useParams();

  const navigate = useNavigate();

  const adjustmentRef = useRef<HTMLButtonElement | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [hasLastItem, setHasLastItem] = useState(false);

  const [startDate, setStartDate] = useState<string | Date>("");
  const [endDate, setEndDate] = useState<string | Date>("");

  const [pageSize, setPageSize] = useState(20);

  let dir = searchParams.get("dir");

  const cursorId = searchParams.get("cursorId");

  const { isPending, error, data } = useInventoryFetch({
    startDate: startDate && new Date(startDate).toISOString(),
    endDate: endDate && addDays(new Date(endDate), 1),

    pageSize,
    id,
    cursorId,
    direction: dir ?? "next",
    onHasLastItem: setHasLastItem,
  });

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <>{error.message}</>;
  }

  console.log({ data });

  return (
    <>
      <ListPage
        header={{
          left: {
            title: `${data?.productName}`,
            subTitle: `Current stock: ${data?.quantity ?? 0}`,
          },
          right: (
            <>
              <DateFilter
                startDate={startDate}
                endDate={endDate}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
              />
              <div className="flex gap-x-2 justify-end mt-3">
                <Dialog>
                  <Dialog.Trigger
                    ref={(el) => {
                      adjustmentRef.current = el;
                    }}
                  >
                    Adjustment
                  </Dialog.Trigger>
                  <Dialog.Content className="max-w-[500px]">
                    <Dialog.Header>
                      <h2 className="text-xl">Inventory Adjustment</h2>
                    </Dialog.Header>
                    <Adjustment
                      ref={adjustmentRef}
                      id={Number(id)}
                      quantity={data.quantity}
                      productId={data.product_id}
                    />
                  </Dialog.Content>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </div>
            </>
          ),
        }}
        isPending={isPending}
        error={error}
      >
        <>
          {data?.movements && (
            <>
              <Items
                items={data.movements}
                headers={[
                  { label: "Date" },
                  { label: "Last Quantity", className: "text-right" },
                  { label: "Movement Type" },
                  { label: "Ref Type" },
                ]}
                renderItems={(item) => (
                  <>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td>{movementType[item.movement_type ?? 0]}</td>
                    <td>
                      {item?.reference_type && humanize(item.reference_type)}
                    </td>
                  </>
                )}
              />
            </>
          )}
        </>
        <div className="flex items-end justify-between gap-x-2">
          <div>
            {data && data?.movements?.length !== undefined && (
              <Pagination
                direction={dir}
                firstId={data?.movements?.[0]?.id}
                lastId={data?.movements?.[data.movements.length - 1]?.id}
                hasLastItem={hasLastItem}
                searchParams={searchParams}
                onSearchParams={setSearchParams}
              />
            )}
          </div>
          <div>
            <span>Per page</span>
            <div className="w-[100px]">
              <NumericFormat
                defaultValue={pageSize}
                customInput={Input}
                onValueChange={(values) => {
                  const { floatValue } = values;

                  if (floatValue) {
                    setSearchParams({
                      ...searchParams,
                      cursorId: "0",
                    });
                    setPageSize(floatValue);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </ListPage>
    </>
  );
}
