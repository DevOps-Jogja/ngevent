import { Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminStatsProps {
    totalUsers: number;
    totalEvents: number;
    activeEvents: number;
    pendingEvents: number;
}

export default function AdminStats({ totalUsers, totalEvents, activeEvents, pendingEvents }: AdminStatsProps) {
    const stats = [
        {
            label: 'Total Users',
            value: totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            label: 'Total Events',
            value: totalEvents,
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            label: 'Active Events',
            value: activeEvents,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            label: 'Pending/Draft',
            value: pendingEvents,
            icon: AlertCircle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor} dark:bg-opacity-20`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
