import { CustomerType, ErrorType } from "@renderer/shared/utils/types";

export type ReturnAllCustomerType = {
  data: {
    total: number;
    results: CustomerType[] | null;
  };
  error: ErrorType;
};

export type ReturnCustomerType = {
  data: CustomerType | null;
  error: ErrorType;
};

export interface ICustomerRepository {
  getAll(): ReturnAllCustomerType;
  getById(id: number): ReturnCustomerType;
  create(params: Omit<CustomerType, "id" | "created_at">): {
    success: boolean;
    error: ErrorType;
  };
  update(params: Omit<CustomerType, "id" | "created_at">): {
    success: boolean;
    error: ErrorType;
  };
  delete(id: number): {
    success: boolean;
    error: ErrorType;
  };
}
