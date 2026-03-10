import { ReturnCartType } from "../../renderer/src/shared/utils/types";

export type ReturnType = {
  data: ReturnCartType | null;
  error: Error | string;
};

export type CartItem = {
  cart_id: number;
  // item_id: number
  product_id: number;
  user_id: number;
};

export interface ICartRepository {
  getByUserId(id: number): ReturnType;
  insertItem(params: CartItem): ReturnType;
  removeItem(
    id: number,
    cart_id: number,
  ): { success: boolean; error: Error | string };
  updateDiscount(params: {
    discount: number;
    total: number;
    cart_id: number;
  }): {
    success: boolean;
    error: Error | string;
  };
  updateItemQty(params: { id: number; cart_id: number; quantity: number }): {
    success: boolean;
    error: Error | string;
  };
  deleteAllItems(cart_id: number): { success: boolean; error: Error | string };
}
