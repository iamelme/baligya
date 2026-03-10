import FormInput from "@renderer/shared/components/form/FormInput";
import FormWrapper from "@renderer/shared/components/form/FormWrapper";
import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import useBoundStore from "@renderer/shared/stores/boundStore";
import { InventoryType } from "@renderer/shared/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, RefObject } from "react";
import z from "zod";

const schema = z.object({
  quantity: z.coerce.number(),
});

type ValueType = z.infer<typeof schema>;

type Props = {
  ref: RefObject<HTMLButtonElement | null>;
  id: number;
  productId: number;
  quantity: number;
};

export default function Adjustment({
  ref,
  id,
  productId,
  quantity,
}: Props): ReactNode {
  const user = useBoundStore((state) => state.user);

  const queryClient = useQueryClient();

  const { error, mutate } = useMutation({
    mutationFn: async (data: InventoryType) => {
      if (!user.id) {
        throw new Error("User not found. Please try to login again.");
      }
      if (!data.quantity) {
        throw new Error("You cannot adjust the stock with 0 value");
      }

      const { error } = await window.apiInventory.updateInventory({
        id,
        user_id: user.id,
        product_id: productId,
        quantity: data.quantity,
        movement_type: data.quantity < 0 ? 1 : 0,
      });

      if (error instanceof Error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-product"] });
      ref.current?.click();
    },
  });

  return (
    <div className="p-3">
      <FormWrapper<ValueType>
        defaultValues={{
          quantity: 0,
        }}
        schema={schema}
        onSubmit={mutate}
      >
        <div className="grid grid-cols-7 gap-x-5 mb-3">
          <div className="col-span-3">
            <h3 className="font-medium">Current Stock:</h3>
            {/*
               <p className="text-xs text-slate-500"></p>

              */}
          </div>
          <div className="col-span-4">{quantity}</div>
        </div>

        <FormInput
          type="number"
          name="quantity"
          label="Quantity"
          helpertext="To decrease the current stock. You need to put (-) negative sign"
        />
        {error && (
          <Alert variant="danger" className="mb-3">
            {error.message}
          </Alert>
        )}
        <Button type="submit">Submit</Button>
      </FormWrapper>
    </div>
  );
}
