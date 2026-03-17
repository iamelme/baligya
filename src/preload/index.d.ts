import { ElectronAPI } from "@electron-toolkit/preload";
import {
  apiCart,
  apiSale,
  apiReturn,
  apiUser,
  apiCategory,
  apiElectron,
  apiInventory,
  apiSettings,
  apiProduct,
  apiCustomer,
  apiSalesOrder,
} from "./index";

declare global {
  interface Window {
    electron: ElectronAPI;
    apiCart: typeof apiCart;
    apiSale: typeof apiSale;
    apiSalesOrder: typeof apiSalesOrder;
    apiReturn: typeof apiReturn;
    apiCustomer: typeof apiCustomer;
    apiUser: typeof apiUser;
    apiCategory: typeof apiCategory;
    apiProduct: typeof apiProduct;
    apiInventory: typeof apiInventory;
    apiSettings: typeof apiSettings;
    apiElectron: typeof apiElectron;
  }
}
