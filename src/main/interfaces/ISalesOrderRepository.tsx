import {
  SalesOrderItemType,
  SalesOrderType,
} from "@renderer/shared/utils/types";

export type CreateSalesOrderParams = Omit<UpdateSalesOrderParams, "id">;

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

export type GetAllSalesOrderParams = {
  startDate: string;
  endDate: string;
  pageSize: number;
  offset: number;
  userId?: number;
};

export type ReturnSalesOrderType = {
  data:
    | (SalesOrderType & {
        customer_name?: string;
        items: Array<
          SalesOrderItemType & {
            product_unit: string;
            product_name: string;
            product_desc: string;
            available: number;
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

  getAll(params: GetAllSalesOrderParams): ReturnAllSalesOrderType;

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

  deleteItem(id: number): {
    success: boolean;
    error: Error | string;
  };
}
