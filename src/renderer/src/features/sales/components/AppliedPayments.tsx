import Items from "@renderer/shared/components/Items";
import Price from "@renderer/shared/components/ui/Price";
import { humanize } from "@renderer/shared/utils";
import { PaymentType } from "@renderer/shared/utils/types";
import { ReactNode } from "react";

type Props = {
  items?: PaymentType[];
};

export default function AppliedPayments({ items }: Props): ReactNode {
  if (!items) {
    return null;
  }
  return (
    <Items
      headers={[]}
      items={items}
      renderItems={(item) => (
        <>
          <td>
            {humanize(item.method)}
            <p>
              <small>{new Date(item.created_at).toLocaleDateString()}</small>
            </p>
          </td>
          <td className="text-right">
            <Price value={item.amount} />
          </td>
        </>
      )}
    />
  );
}
