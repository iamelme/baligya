import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import myImage from "../../../../../../resources/icon.png"; // Path relative to the JS file

export default function Auth(): ReactNode {
  return (
    <div className="flex gap-x-5 p-5 max-w-5xl min-h-[100svh] mx-auto ">
      <div className="w-[50%] p-[5%] rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 ">
        <h2 className="mb-4 text-2xl text-white">
          Stay on top of your sales and performance.
        </h2>
        <p className="text-white">
          Easily monitor your revenue, track returns, and see your top-selling
          products.
        </p>
        <img src={myImage} alt="baligya logo" />
      </div>
      <div className="w-[50%] p-5">
        <Outlet />
      </div>
    </div>
  );
}
