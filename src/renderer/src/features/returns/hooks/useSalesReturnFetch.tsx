import { useQuery } from "@tanstack/react-query";
import salesReturnQuery from "../utils/salesReturnQuery";

export default function useSalesReturnFetch() {
  return useQuery(salesReturnQuery())
}
