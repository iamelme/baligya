import {
  ErrorType,
  PlaceOrderType,
  ReturnRevenueType,
  ReturnSaleType,
  SaleItemType,
  SaleType,
} from "../shared/utils/types";

export type ReturnType = {
  data: ReturnSaleType | null;
  error: ErrorType;
};

export type SaleItem = {
  sale_id: number;
  // item_id: number
  product_id: number;
  user_id: number;
};

export type TopItemsType = {
  id: number;
  created_at: string;
  name: string;
  net_quantity_sold: number;
};

export type Direction = "prev" | "next";

export interface ISaleRepository {
  getAll(params: {
    startDate: string;
    endDate: string;
    pageSize: number;
    cursorId: number;
    userId: number;
    direction?: Direction;
  }): {
    data: SaleType[] | null;
    error: ErrorType;
  };
  getByUserId(id: number): {
    data: (SaleType & { items: SaleItemType[] }) | null;
    error: ErrorType;
  };
  getById(id: number): ReturnType;
  // getTransactions(params: { startDate: string; endDate: string }): {
  //   data: number[] | null;
  //   error: ErrorType;
  // };
  getRevenue(params: {
    startDate: string;
    endDate: string;
    isQuarterly?: boolean;
  }): {
    data: ReturnRevenueType | null;
    error: ErrorType;
  };
  getTopItems({
    pageSize,
    cursorId,
    lastTotal,
    startDate,
    endDate,
    direction,
  }: {
    pageSize: number;
    cursorId: number;
    lastTotal: number;
    startDate: string;
    endDate: string;
    direction?: Direction;
  }): {
    data: TopItemsType[] | null;
    error: ErrorType;
  };
  create(userId: number): { data: SaleType | null; error: ErrorType };
  placeOrder(params: PlaceOrderType): {
    data: Pick<SaleType, "id"> | null;
    error: ErrorType;
  };
  insertItem(params: SaleItem): {
    data:
      | (Pick<SaleType, "id" | "sub_total" | "discount" | "total"> & {
          items: SaleItemType[];
        })
      | null;
    error: ErrorType;
  };
  updateStatus(params: { id: number; status: SaleType["status"] }): {
    success: boolean;
    error: ErrorType;
  };
  deleteAllItems(saleId: number): { success: boolean; error: ErrorType };
}
