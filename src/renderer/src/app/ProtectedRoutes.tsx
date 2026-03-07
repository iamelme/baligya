import useBoundStore from "../shared/stores//boundStore";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoutes({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const user = useBoundStore((state) => state.user);
  const userUpdate = useBoundStore((state) => state.updateUser);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) {
      const auth = localStorage.getItem("app");
      if (auth) {
        const state = JSON.parse(auth);
        if (state?.state?.user?.id) {
          userUpdate(state.state.user);
          setIsLoading(false);
          navigate("/");
        }
      }

      navigate("/auth");
    }

    setIsLoading(false);
  }, [user, navigate, userUpdate]);

  if (isLoading) {
    return <>Loading...</>;
  }

  return children;
}
