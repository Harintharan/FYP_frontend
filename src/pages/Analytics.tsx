import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const distributionData = [
  { month: "Jan", doses: 45000, compliance: 98 },
  { month: "Feb", doses: 52000, compliance: 97 },
  { month: "Mar", doses: 48000, compliance: 99 },
  { month: "Apr", doses: 61000, compliance: 96 },
  { month: "May", doses: 55000, compliance: 98 },
  { month: "Jun", doses: 67000, compliance: 99 },
];

const vaccineTypeData = [
  { name: "Pfizer-BioNTech", value: 45, color: "hsl(var(--primary))" },
  { name: "Moderna", value: 30, color: "hsl(var(--secondary))" },
  { name: "Johnson & Johnson", value: 15, color: "hsl(var(--accent))" },
  { name: "AstraZeneca", value: 10, color: "hsl(var(--muted))" },
];

const temperatureComplianceData = [
  { week: "Week 1", compliant: 98, breach: 2 },
  { week: "Week 2", compliant: 97, breach: 3 },
  { week: "Week 3", compliant: 99, breach: 1 },
  { week: "Week 4", compliant: 96, breach: 4 },
];

const stats = [
  {
    title: "Total Doses Distributed",
    value: "328,000",
    change: "+12.5%",
    trend: "up",
    icon: Package,
  },
  {
    title: "Temperature Compliance",
    value: "98.2%",
    change: "+0.8%",
    trend: "up",
    icon: CheckCircle,
  },
  {
    title: "Active Shipments",
    value: "24",
    change: "-3",
    trend: "down",
    icon: Activity,
  },
  {
    title: "Cold Chain Breaches",
    value: "10",
    change: "-5",
    trend: "down",
    icon: AlertTriangle,
  },
];

export default function Analytics() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Analytics Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Comprehensive insights into vaccine distribution and cold chain
          performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <div
                  className={`flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="distribution" className="space-y-3 sm:space-y-4">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger value="distribution" className="text-xs sm:text-sm py-2 px-1 sm:px-3">Distribution</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm py-2 px-1 sm:px-3">Compliance</TabsTrigger>
          <TabsTrigger value="vaccines" className="text-xs sm:text-sm py-2 px-1 sm:px-3">Vaccines</TabsTrigger>
        </TabsList>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg">Monthly Distribution & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <ResponsiveContainer width="100%" height={280} className="sm:!h-[400px]">
                <LineChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="doses"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Doses Distributed"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="compliance"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Compliance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg">Temperature Compliance Tracking</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <ResponsiveContainer width="100%" height={280} className="sm:!h-[400px]">
                <BarChart data={temperatureComplianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="compliant"
                    fill="hsl(var(--primary))"
                    name="Compliant %"
                  />
                  <Bar
                    dataKey="breach"
                    fill="hsl(var(--destructive))"
                    name="Breach %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccine Types Tab */}
        <TabsContent value="vaccines" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Vaccine Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                <ResponsiveContainer width="100%" height={280} className="sm:!h-[400px]">
                  <PieChart>
                    <Pie
                      data={vaccineTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vaccineTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Vaccine Type Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                {vaccineTypeData.map((vaccine) => (
                  <div key={vaccine.name} className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">{vaccine.name}</span>
                      <span className="text-xs sm:text-sm font-bold">{vaccine.value}%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${vaccine.value}%`,
                          backgroundColor: vaccine.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
