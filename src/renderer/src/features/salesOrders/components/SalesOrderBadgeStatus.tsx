import Badge from "@renderer/shared/components/ui/Badge";
import { humanize } from "@renderer/shared/utils";
import { SalesOrderType } from "@renderer/shared/utils/types";

type Params = {
  status: SalesOrderType["status"];
};

export default function SalesOrderBadgeStatus({ status }: Params) {
  const s = humanize(status);
  switch (status) {
    case "cancelled":
      return <Badge variant="danger">{s}</Badge>;
    case "confirmed":
      return <Badge variant="warning">{s}</Badge>;
    case "fulfilled":
      return <Badge variant="info">{s}</Badge>;
    case "complete":
      return <Badge variant="success">{s}</Badge>;
    default:
      return <Badge>{s}</Badge>;
  }
}
