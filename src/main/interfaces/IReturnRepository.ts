import { ErrorType, ReturnType } from "../../renderer/src/shared/utils/types";

export type Return = {
  data: null;
  error: ErrorType;
};

export interface IReturnRepository {
  create({ sale_id, user_id, items, amount }: ReturnType): Return;
}
