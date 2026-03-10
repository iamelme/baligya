import {
  InventoryMovementParams,
  InventoryMovementReturn,
} from "../../renderer/src/features/inventory/utils/types";
import {
  CustomResponseType,
  Direction,
  ErrorType,
  InventoryType,
  ProductType,
} from "../../renderer/src/shared/utils/types";

export type ProductInventoryType = ProductType & InventoryType;

export type ProdInventoryType = {
  id: number;
  quantity: number;
  product_id: number;
  product_name: string;
  product_sku: string;
};

export type ReturnInventoryByIdType =
  | (InventoryType & {
      productName: string;
      productIsActive: number;
      movements: InventoryMovementReturn[] | null;
    })
  | null;

export interface IInventoryRepository {
  getAll(params: {
    pageSize: number;
    cursorId: number;
    direction?: Direction;
  }): {
    data: Array<ProductInventoryType> | null;
    error: ErrorType;
  };
  getById(params: InventoryMovementParams): {
    data: ReturnInventoryByIdType;
    error: ErrorType;
  };

  create(params: InventoryType): CustomResponseType;
  update(params: InventoryType): CustomResponseType;
  delete(id: number): CustomResponseType;
}
