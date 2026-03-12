export type ReturnBackuplog = {
  data: { created_at: string; status?: string } | null;
  error: Error | string;
};

export type SettingsType = {
  key: string;
  value: string;
};

export type SettingsParamType = {
  logo: string;
  tax?: number;
  is_redirect_to_sales?: number;
};

export type ReturnSettingsType = {
  data: { key: keyof SettingsType; value: string }[] | null
  error: Error | string
}

export interface ISettingRepository {
  get: () => ReturnSettingsType;
  getBackuplog: () => ReturnBackuplog;
  // updateLocale: (locale: string) => { success: boolean; error: Error | string };
  // uploadLogo: (path: string) => { data: string; error: Error | string };
  create: (params: SettingsType) => {
    success: boolean;
    error: Error | string;
  };

  update: (params: SettingsParamType) => {
    success: boolean;
    error: Error | string;
  };
}
