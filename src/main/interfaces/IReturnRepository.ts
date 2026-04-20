import {
  ErrorType,
  ProductType,
  ReturnItemType,
  ReturnType,
  SaleType,
} from "../../renderer/src/shared/utils/types";

export type Return = {
  data: null;
  error: ErrorType;
};

export type ReturnAllParams = {
  startDate: string;
  endDate: string;
  pageSize: number;
  offset: number;
};

export type ReturnAllType = {
  data: {
    total: number;
    results: ReturnType[] | null;
  } | null;
  error: ErrorType;
};

export type ReturnByIdType = {
  data:
    | (ReturnType &
        SaleType & {
          items: Array<ReturnItemType & ProductType>;
        })
    | null;
  error: ErrorType;
};

export interface IReturnRepository {
  getAll(params: ReturnAllParams): ReturnAllType;
  getById(id: number): ReturnByIdType;
  create({ sale_id, user_id, items, amount }: ReturnType): Return;
}
