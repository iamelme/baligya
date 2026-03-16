import {
  SalesOrderItemType,
  SalesOrderType,
} from "@renderer/shared/utils/types";

export type CreateSalesOrderParams = Omit<
  UpdateSalesOrderParams,
  "id" | "status"
>;

export type UpdateSalesOrderParams = Omit<SalesOrderType, "created_at"> & {
  items: UpdateSalesOrderItemsParams[];
};

export type InsertSalesOrderItemsParams = Omit<
  SalesOrderItemType,
  "id" | "created_at"
>;

export type UpdateSalesOrderItemsParams = Omit<
  SalesOrderItemType,
  "created_at" | "sales_order_id"
>;

export type ReturnSalesOrderType = {
  data:
    | (SalesOrderType & {
        customer_name?: string;
        items: Array<
          SalesOrderItemType & {
            product_name: string;
            product_desc: string;
          }
        >;
      })
    | null;
  error: Error | string;
};

export type ReturnAllSalesOrderType = {
  data: {
    total: number;
    results: Array<SalesOrderType & { customer_name: string }> | null;
  };
  error: Error | string;
};

export type ReturnAllSalesOrderItemType = {
  data: {
    total: number;
    results: SalesOrderItemType[] | null;
  };
  error: Error | string;
};

export interface ISalesOrderRepository {
  create(params: CreateSalesOrderParams): {
    success: boolean;
    error: Error | string;
  };

  update(params: UpdateSalesOrderParams): {
    success: boolean;
    error: Error | string;
  };

  getAll(): ReturnAllSalesOrderType;

  getById(id: number): ReturnSalesOrderType;

  getAllItems(id: number): ReturnAllSalesOrderItemType;

  insertItem(params: InsertSalesOrderItemsParams): {
    success: boolean;
    error: Error | string;
  };

  updateItem(params: UpdateSalesOrderItemsParams): {
    success: boolean;
    error: Error | string;
  };
}
