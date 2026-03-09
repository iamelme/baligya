import {
  CustomResponseType,
  ErrorType,
  ProductType,
} from "../shared/utils/types";

type CreateProduct = Omit<ProductType, "id">;

export type ReturnType = { data: ProductType | null; error: Error | string };

export type ReturnAllProductType = {
  data: {
    total: number;
    results: Array<
      ProductType & {
        inventory_id: number;
        quantity: number;
        category_name: string;
      }
    > | null;
  };
  error: ErrorType;
};

export type GetAllParams = {
  startDate: string;
  endDate: string;
  pageSize: number;
  offset: number;
  userId?: number;
};

export interface IProductRepository {
  getAll(params: GetAllParams): ReturnAllProductType;
  getById(id: number): ReturnType;
  getByName(name: string): ReturnType;
  getByCode(code: number): ReturnType;
  getBySku(sku: string): ReturnType;
  search(term: string): ReturnAllProductType;
  create(params: CreateProduct): CustomResponseType;
  update(
    params: ProductType & { quantity: number; user_id: number },
  ): CustomResponseType;
  delete(id: number): CustomResponseType;
}
