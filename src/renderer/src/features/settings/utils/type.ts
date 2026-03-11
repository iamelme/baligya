// export type SettingsType = {
//   locale: string;
//   logo: string;
//   tax: number;
//   isTaxInclusive: boolean;
//   isRedirectToSale: boolean;
// };

export type SettingsType = {
  key: string;
  value: string;
};

export type SettingsParamType = {
  logo?: string;
  tax?: number;
  is_redirect_to_sales?: number;
};
