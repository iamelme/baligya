import { ReactNode } from "react";
import TopItems from "../components/TopItems";
import Rev from "../components/Sales";
import useBoundStore from "@renderer/shared/stores/boundStore";
import SalesChart from "../components/SalesChart";

export default function HomePage(): ReactNode {
  const user = useBoundStore((state) => state.user);

  const time = new Date().toLocaleString();
  const amPm = time.split(" ")[2];

  let isMorning = true;
  if (amPm === "PM") {
    const isNight = Number(time.split(" ")[1].split(":")[0]) >= 6;
    isMorning = !isNight;
  }

  return (
    <div>
      <header className="mb-4">
        <h2 className="text-lg font-medium">
          Hello, {user.user_name}{" "}
          {isMorning ? <>&#9728;</> : <>&#127769;</>}{" "}
        </h2>
      </header>
      <Rev />
      <div className="grid grid-cols-5 gap-x-3">
        <div className="col-span-3">
          <SalesChart />
        </div>
        <div className="col-span-2">
          <TopItems />
        </div>
      </div>
    </div>
  );
}
