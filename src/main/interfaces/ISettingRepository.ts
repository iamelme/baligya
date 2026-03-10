import { SettingsType } from "../../renderer/src/features/settings/utils/type";

export interface ISettingRepository {
  get: () => { data: SettingsType | null; error: Error | string };
  updateLocale: (locale: string) => { success: boolean; error: Error | string };
  uploadLogo: (path: string) => { data: string; error: Error | string };
  update: (params: Partial<SettingsType>) => {
    success: boolean;
    error: Error | string;
  };
}
