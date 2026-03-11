import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import Sidebar from "./layout/Sidebar";
import useBoundStore from "../shared/stores/boundStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App(): React.JSX.Element {
  // const updateLocale = useBoundStore((state) => state.updateLocale);
  // const updateLogo = useBoundStore((state) => state.updateLogo);

  const location = useLocation();

  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await window.apiSettings.getSettings();

      if (res.error && res.error instanceof Error) {
        throw new Error(res.error.message);
      }

      // updateLocale(res.data.locale);
      // updateLogo(res.data.logo);

      return res.data;
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const updateUser = useBoundStore((state) => state.updateUser);

  return (
    <div className="flex min-h-svh text-slate-700 text-sm">
      <Sidebar
        onUpdateUser={() => updateUser({ id: undefined, user_name: undefined })}
      />
      <main className="flex-1 px-4 bg-slate-50">
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <Outlet />
        </ErrorBoundary>
        <ToastContainer />
      </main>
    </div>
  );
}

export default App;
