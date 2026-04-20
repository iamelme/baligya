import { queryOptions } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function salesReturnQuery() {
  const { id } = useParams();
  return queryOptions({
    queryKey: ["sales-return", id],
    queryFn: async () => {
      if (!Number(id)) {
        throw new Error("Something went wrong while retrieving a sales return");
      }
      const { data, error } = await window.apiReturn.getById(Number(id));

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
