import { ReactNode, useState } from "react";
// import FormWrapper from "@renderer/shared/components/form/FormWrapper";
// import SystemForm from "../components/SystemForm";
// import z from "zod";
// import { SettingsType } from "../utils/type";
// import { useNavigate } from "react-router-dom";
import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import { Download, Upload } from "react-feather";

// const schema = z.object({
// });

// type ValuesType = z.infer<typeof schema>;

export default function System(): ReactNode {
  const [error, setError] = useState<Record<string, Error | string>>({
    download: "",
    upload: "",
  });

  const handleUploadDb = async () => {
    try {
      setError({ ...error, upload: "" });
      const res = await window.apiSettings.uploadBackUp();

      if (!res) {
        throw new Error("Something went wrong while uploading the database.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError({ ...error, upload: err });
      }
    }
  };
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-7 gap-x-5">
        <div className="col-span-3">
          <h3 className="font-medium">Database Backup</h3>
          <p className="text-xs text-slate-500">
            It is important to frequently backup your database. <br />
            <em>Tip</em>: it is recommended to store it in your Online storage
            e.g(Google Drive, Dropbox, etc...)
          </p>
        </div>
        <div className="col-span-4">
          <Button onClick={async () => window.apiSettings.addBackUp()}>
            <Download size={14} /> Backup Database
          </Button>
          {error.download && (
            <Alert variant="danger" className="mt-3">
              {error.download instanceof Error ? error.download?.message : ""}
            </Alert>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-x-5">
        <div className="col-span-3">
          <h3 className="font-medium">Database Upload</h3>
          <p className="text-xs text-slate-500">
            Always download a backup of your database first before doing
            database upload.
          </p>
        </div>
        <div className="col-span-4">
          <Button variant="outline" onClick={handleUploadDb}>
            <Upload size={14} />
            Upload Database
          </Button>
          {error.upload && (
            <Alert variant="danger" className="mt-3">
              {error.upload instanceof Error ? error.upload?.message : ""}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
