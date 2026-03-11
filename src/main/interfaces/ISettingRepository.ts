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

export interface ISettingRepository {
  get: () => { data: SettingsType[] | null; error: Error | string };
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
