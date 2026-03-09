import {
  Box,
  Database,
  DollarSign,
  Grid,
  Home,
  LogOut,
  PieChart,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "react-feather";
import Menu from "../../shared/components/Menu";
import Button from "../../shared/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const menu = [
  {
    label: "Home",
    to: "/",
    icon: <Home size={14} />,
  },
  {
    label: "POS",
    to: "/pos",
    icon: <ShoppingCart size={14} />,
  },
  {
    label: "Products",
    icon: <Box size={14} />,
    children: [
      {
        label: "Categories",
        to: `/categories`,
        icon: <Grid size={14} />,
      },
      {
        label: "Products",
        to: `/products`,
        icon: <Box size={14} />,
      },
    ],
  },
  {
    label: "Price Verifier",
    to: `/price-verifier`,
    icon: <DollarSign size={14} />,
  },
  {
    label: "Inventory",
    to: `/inventory`,
    icon: <Database size={14} />,
  },
  {
    label: "Sales",
    to: `/sales`,
    icon: <TrendingUp size={14} />,
  },
  {
    label: "Reports",
    icon: <PieChart size={14} />,
    children: [
      {
        label: "Sales",
        to: `/reports/sales`,
        icon: <TrendingUp size={14} />,
      },
    ],
  },
];

const menu2 = [
  {
    label: "Settings",
    to: "/settings",
    icon: <Settings size={14} />,
  },
];

type Props = {
  onUpdateUser: () => void;
};

export default function Sidebar({ onUpdateUser }: Props): React.JSX.Element {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await window.apiSettings.getSettings();

      if (res.error && res.error instanceof Error) {
        throw new Error(res.error.message);
      }

      return res.data;
    },
  });

  return (
    <aside className="flex flex-col justify-between w-[200px] bg-gray-900 border-r border-slate-200 text-slate-300">
      <div>
        <h1 className="py-2 px-3">
          {settings?.logo && (
            <Link to="/">
              <img
                src={`elme-cute:///${settings.logo}?v=${Date.now()}`}
                alt="logo"
              />
            </Link>
          )}
        </h1>
        <Menu items={menu} />
      </div>

      <div className="sticky left-0 bottom-0 bg-gray-900 py-2">
        <Menu items={menu2} />
        <div className="px-4">
          <Button variant="outline" onClick={() => onUpdateUser()} full>
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
