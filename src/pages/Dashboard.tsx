/* -------------------------------------------------------------------------- */
/*  AgentDashboard.tsx  –  real-time, no hard-coded metrics                  */
/* -------------------------------------------------------------------------- */
import React, { useEffect, useState } from "react";
import {
  Users, Home, CalendarClock, MessageSquare, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import axios from "axios";

interface Stats {
  total_properties: number;
  active_properties: number;
  total_bookings: number;
  pending_bookings: number;
  total_inquiries: number;
}

interface Property {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  status: string;
  property_type: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className={`${color} rounded-xl p-4 flex items-center gap-3 text-white`}>
    <div className="bg-white/20 p-2 rounded-lg">{icon}</div>
    <div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-xs opacity-80">{title}</p>
    </div>
  </div>
);

const AgentDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProps, setRecentProps] = useState<Property[]>([]);
  const [recentInq, setRecentInq] = useState<Inquiry[]>([]);
  const [revenue, setRevenue] = useState<{ month: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  /** single fetch */
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/agent/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setStats(data.stats);
      setRecentProps(data.recent_properties);
      setRecentInq(data.recent_inquiries);
      setRevenue(data.revenue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-12 h-12 rounded-full border-b-2 border-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agent Dashboard</h1>
          <p className="text-gray-600">Your personal performance snapshot</p>
        </div>
        <button
          onClick={load}
          className="bg-[#64748B] text-white px-6 py-2 rounded-lg hover:bg-[#475569]"
        >
          Refresh
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Listings"
          value={stats.total_properties}
          icon={<Home size={20} className="text-white" />}
          color="bg-[#3B82F6]"
        />
        <StatCard
          title="Active Listings"
          value={stats.active_properties}
          icon={<Home size={20} className="text-white" />}
          color="bg-[#0EA5E9]"
        />
        <StatCard
          title="Bookings"
          value={stats.total_bookings}
          icon={<CalendarClock size={20} className="text-white" />}
          color="bg-[#10B981]"
        />
        <StatCard
          title="Pending Bookings"
          value={stats.pending_bookings}
          icon={<CalendarClock size={20} className="text-white" />}
          color="bg-[#F59E0B]"
        />
        <StatCard
          title="Total Inquiries"
          value={stats.total_inquiries}
          icon={<MessageSquare size={20} className="text-white" />}
          color="bg-[#EF4444]"
        />
      </div>

      {/* revenue chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold mb-4">Revenue (last 12 months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0EA5E9"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* recent props */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold mb-4">Recent Listings</h3>
          <ul className="divide-y">
            {recentProps.map((p) => (
              <li key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">
                    {p.city}, {p.state} • {p.property_type}
                  </p>
                </div>
                <span className="text-[#10B981] font-semibold">
                  ₹{(p.price / 1_000_000).toFixed(1)} M
                </span>
              </li>
            ))}
            {recentProps.length === 0 && (
              <li className="py-4 text-center text-gray-500">
                No listings yet
              </li>
            )}
          </ul>
        </div>

        {/* recent inquiries */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold mb-4">Recent Inquiries</h3>
          <ul className="divide-y">
            {recentInq.map((i) => (
              <li key={i.id} className="py-3">
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-gray-500">{i.email}</p>
                <p className="text-sm mt-1 line-clamp-2">{i.message}</p>
              </li>
            ))}
            {recentInq.length === 0 && (
              <li className="py-4 text-center text-gray-500">
                No inquiries yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
