import Items from "@renderer/shared/components/Items";
import Price from "@renderer/shared/components/ui/Price";
import { ReturnType } from "@renderer/shared/utils/types";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  items?: ReturnType[];
};

export default function CreditAndReturn({ items }: Props): ReactNode {
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
            {item?.method === "credit_memo" ? (
              "Credit Memo"
            ) : (
              <Link to={`/returns/${item.id}`}>Refund</Link>
            )}
            <p>
              <small>{new Date(item.created_at).toLocaleDateString()}</small>
            </p>
          </td>
          <td className="text-right">
            (<Price value={item.amount} />)
          </td>
        </>
      )}
    />
  );
}
