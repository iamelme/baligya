import { ReactNode } from "react";
import DownloadBackup from "../components/DownloadBackup";
import UploadBackup from "../components/UploadBackup";
import useUploadBackup from "../hooks/useUploadBackup";
import Info from "../components/Info";

export default function System(): ReactNode {
  const { handleUploadDb, error } = useUploadBackup();
  return (
    <>
      <Info />
      <div className="mb-5">
        <DownloadBackup />
      </div>
      <UploadBackup
        onHandleUploadDb={handleUploadDb}
        error={error instanceof Error ? error.message : ""}
      />
    </>
  );
}
