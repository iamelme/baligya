import {
  CustomResponseType,
  ErrorType,
  UserType,
} from "../../renderer/src/shared/utils/types";

export type ReturnType = { data: UserType | null; error: ErrorType };

export interface IUserRepository {
  //   getAll(): UserType[]
  //   getById(id: number): UserType
  create(params: UserType): Promise<CustomResponseType>;
  login(params: UserType): Promise<ReturnType>;
  // delete(id: number)
}
