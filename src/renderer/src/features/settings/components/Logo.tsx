import Alert from "@renderer/shared/components/ui/Alert";
import Button from "@renderer/shared/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";

export default function Logo(): ReactNode {
  const {
    data: settings,
    isPending,
    error,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await window.apiSettings.getSettings();

      if (error instanceof Error) {
        throw new Error(error?.message);
      }

      return data;
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await window.apiElectron.uploadLogo();
      if (res) {
        const { error } = await window.apiSettings.uploadLogo(res);

        if (error instanceof Error) {
          throw new Error(error?.message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <Alert variant="danger">{error.message}</Alert>;
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-x-5">
        <div className="col-span-3">
          <h3 className="font-medium">Logo</h3>
          <p className="text-xs text-slate-500">
            Upload your company logo. This will be use in your sales invoice
            pdf.
          </p>
        </div>
        <div className="col-span-4">
          {settings.logo ? (
            <div
              className="max-w-[200px] cursor-pointer"
              onClick={() => mutation.mutate()}
            >
              <img
                src={`elme-cute://${settings.logo}?v=${Date.now()}`}
                alt="logo"
                className="w-24 h-24 rounded-full aspect-square object-cover"
              />
            </div>
          ) : (
            <Button type="button" onClick={() => mutation.mutate()}>
              Upload
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
