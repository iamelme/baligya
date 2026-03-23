import Button from "@renderer/shared/components/ui/Button";
import { ReactNode } from "react";
import { ReturnAllProductType } from "src/main/interfaces/IProductRepository";

type Props = {
  items?: ReturnAllProductType["data"]["results"];
  onAddItem: (item: NonNullable<Props["items"]>[number]) => void;
};

export default function ResultItems({ items, onAddItem }: Props): ReactNode {
  return (
    <>
      {items?.map((item) => (
        <div key={item.id} className="flex justify-between">
          <p>
            {item.name} {item.category_name} - <strong>Available:</strong>
            {item.available}
          </p>
          <Button
            variant="outline"
            size="xs"
            disabled={item.available < 1}
            onClick={() => onAddItem(item)}
          >
            {" "}
            Add{" "}
          </Button>
        </div>
      ))}
    </>
  );
}
