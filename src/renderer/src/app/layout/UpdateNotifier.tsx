import Button from "@renderer/shared/components/ui/Button";
import { useEffect, useState } from "react";
import { Bell, RefreshCw } from "react-feather";

export default function UpdateNotifier() {
  const [status, setStatus] = useState<null | string>(null);
  const [progress, setProgress] = useState<null | number>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    window.apiElectron.onStatus(setStatus);

    window.apiElectron.onUpdateAvailable((info) => {
      setStatus(`Update available: v${info?.version}`);
    });

    window.apiElectron.onProgress((p) => {
      setProgress(Math.round(p?.percent));
    });

    window.apiElectron.onDownloaded(() => {
      setDownloaded(true);
      setStatus("Update ready to install");
    });

    window.apiElectron.onError((msg) => {
      setStatus(`Update error: ${msg}`);
    });
  }, []);

  if (!status) return null;

  return (
    <div className="px-3">
      <p>{status}</p>

      {progress !== null && !downloaded && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}

      {status?.includes("available") && !progress && (
        <Button
          variant="ghost"
          onClick={() => window.apiElectron.downloadUpdate()}
        >
          <Bell size={14} /> Download Update Download Update
        </Button>
      )}

      {downloaded && (
        <Button
          variant="ghost"
          onClick={() => window.apiElectron.installUpdate()}
        >
          <RefreshCw size={14} /> Restart & Install
        </Button>
      )}
    </div>
  );
}
