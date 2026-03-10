import {
  CategoryType,
  CustomResponseType,
} from "../../renderer/src/shared/utils/types";

export type ReturnType = {
  data: CategoryType | null;
  error: Error | string;
};

export type ReturnCatAllType = {
  data: {
    total: number;
    results: CategoryType[] | null;
  };
  error: Error | string;
};

export type GetAllParams = {
  pageSize: number;
  offset: number;
};

export interface ICategoryRepository {
  getAll(params: GetAllParams): ReturnCatAllType;
  getById(id: number): ReturnType;
  getByName(name: string): ReturnType;
  create(name: string): CustomResponseType;
  update({ id, name }: { id: number; name: string }): CustomResponseType;
  delete(id: number): { success: boolean; error: Error | string };
}
