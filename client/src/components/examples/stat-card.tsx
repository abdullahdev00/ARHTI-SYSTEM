import { StatCard } from "../stat-card";
import { Users } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-4 bg-background">
      <StatCard
        title="Total Farmers"
        value="48"
        icon={Users}
        trend={{ value: "12%", positive: true }}
      />
    </div>
  );
}
