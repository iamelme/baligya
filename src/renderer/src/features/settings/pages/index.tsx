import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Database, Monitor } from "react-feather";
import SettingsNav from "../components/SettingsNav";

const menu = [
  {
    label: "General",
    to: ".",
    icon: <Monitor size={14} />,
  },
  {
    label: "System",
    to: "system",
    icon: <Database size={14} />,
  },
];

export default function SettingsPage(): ReactNode {
  return (
    <div className="py-4">
      <header className="mb-5">
        <h2 className="text-xl">Settings</h2>
        <p className="text-slate-400">Configure the app to your likes</p>
      </header>

      <SettingsNav items={menu} />

      <div className="flex-1 py-2">
        <Outlet />
      </div>
    </div>
  );
}
