import {
  CustomResponseType,
  Direction,
  ProductType,
} from "../shared/utils/types";

type CreateProduct = Omit<ProductType, "id">;

export type ReturnType = { data: ProductType | null; error: Error | string };

export interface IProductRepository {
  getAll(params: {
    pageSize: number;
    cursorId: number;
    userId: number;
    direction?: Direction;
  }): {
    data: Array<
      ProductType & {
        inventory_id: number;
        quantity: number;
        category_name: string;
      }
    > | null;
    error: Error | string;
  };
  getById(id: number): ReturnType;
  getByName(name: string): ReturnType;
  getByCode(code: number): ReturnType;
  getBySku(sku: string): ReturnType;
  search(term: string): {
    data: Array<
      ProductType & { quantity: number; category_name: string }
    > | null;
    error: Error | string;
  };
  create(params: CreateProduct): CustomResponseType;
  update(
    params: ProductType & { quantity: number; user_id: number },
  ): CustomResponseType;
  delete(id: number): CustomResponseType;
}
