import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import Sidebar from "./layout/Sidebar";
import useBoundStore from "../shared/stores/boundStore";
import { useQuery } from "@tanstack/react-query";

function App(): React.JSX.Element {
  const updateLocale = useBoundStore((state) => state.updateLocale);
  const updateLogo = useBoundStore((state) => state.updateLogo);

  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await window.apiSettings.getSettings();

      if (res.error && res.error instanceof Error) {
        throw new Error(res.error.message);
      }

      updateLocale(res.data.locale);
      updateLogo(res.data.logo);

      return res.data;
    },
  });

  const updateUser = useBoundStore((state) => state.updateUser);

  return (
    <div className="flex min-h-svh text-slate-700 text-sm">
      <Sidebar
        onUpdateUser={() => updateUser({ id: undefined, user_name: undefined })}
      />
      <main className="flex-1 p-4 bg-slate-50">
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
