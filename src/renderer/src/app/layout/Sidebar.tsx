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
  Users,
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
  {
    label: "Customers",
    to: `/customers`,
    icon: <Users size={14} />,
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
  const { data, isPending } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await window.apiSettings.getSettings();

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  if (isPending) {
    return <>Loading...</>;
  }

  const logo = data?.find((d) => d.key === "logo")?.value;

  return (
    <aside className="flex flex-col w-[240px] h-[100svh] bg-gray-900 border-r border-slate-200 text-slate-300">
      <div className="shrink-0">
        <h1 className=" py-2 px-3">
          {logo && (
            <Link to="/" className="inline-block">
              <img
                src={`elme-cute:///${logo}?v=${Math.floor(Date.now() / 1000)}`}
                alt="logo"
                className="max-w-[100px]"
              />
            </Link>
          )}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <Menu items={menu} />
      </div>

      <div className="shrink-0 bg-gray-900 py-2">
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
