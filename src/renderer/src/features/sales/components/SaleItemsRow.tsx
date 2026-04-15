import Price from "@renderer/shared/components/ui/Price";
import { SaleItemType } from "@renderer/shared/utils/types";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  item: SaleItemType;
};

export default function SaleItemsRow({ item }: Props): ReactNode {
  return (
    <>
      <td>
        <Link to={`/products/${item.product_id}`}>
          {item.name}
          {item.code}
        </Link>
      </td>
      <td className="">{item.unit}</td>
      <td className="text-right">{item.quantity}</td>
      <td className="text-right">{item.return_qty}</td>
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
  );
}
