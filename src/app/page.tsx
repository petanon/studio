'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

interface BloodPressureReading {
  time: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  date: string;
}

const TIME_OPTIONS = ['الصباح', 'الليل'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const systolicValue = payload[0]?.value || 0;
    const diastolicValue = payload[1]?.value || 0;
    const heartRateValue = payload[2]?.value || 0;

    return (
      <div className="p-2 bg-white border rounded shadow-md">
        <p className="font-bold">{`${label}`}</p>
        <p className="text-gray-700">{`انقباضي: ${systolicValue} mmHg`}</p>
        <p className="text-gray-700">{`انبساطي: ${diastolicValue} mmHg`}</p>
        <p className="text-gray-700">{`معدل النبض: ${heartRateValue} نبضة/دقيقة`}</p>
      </div>
    );
  }

  return null;
};

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [systolic1, setSystolic1] = useState('');
  const [diastolic1, setDiastolic1] = useState('');
  const [heartRate1, setHeartRate1] = useState('');
  const [systolic2, setSystolic2] = useState('');
  const [diastolic2, setDiastolic2] = useState('');
    const [heartRate2, setHeartRate2] = useState('');
  const [bpData, setBpData] = useState<BloodPressureReading[]>(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('bpData');
      return storedData ? JSON.parse(storedData) : [];
    }
    return [];
  });
    const [dailyAverageData, setDailyAverageData] = useState({ systolic: 0, diastolic: 0, heartRate: 0 });


  useEffect(() => {
    localStorage.setItem('bpData', JSON.stringify(bpData));
  }, [bpData]);

  const calculateDailyAverage = () => {
    if (bpData.length === 0) return { systolic: 0, diastolic: 0, heartRate: 0 };

    const dailyReadings = bpData.filter(reading => reading.date === format(date, 'yyyy-MM-dd'));

    if (dailyReadings.length === 0) return { systolic: 0, diastolic: 0, heartRate: 0 };

    let systolicSum = 0;
    let diastolicSum = 0;
    let heartRateSum = 0;

    dailyReadings.forEach(reading => {
      systolicSum += reading.systolic;
      diastolicSum += reading.diastolic;
      heartRateSum += reading.heartRate;
    });

    const count = dailyReadings.length;
    return {
      systolic: Math.round(systolicSum / count),
      diastolic: Math.round(diastolicSum / count),
      heartRate: Math.round(heartRateSum / count)
    };
  };

  useEffect(() => {
    setDailyAverageData(calculateDailyAverage());
  }, [bpData, date]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !systolic1 || !diastolic1 || !systolic2 || !diastolic2 || !heartRate1 || !heartRate2) {
      alert('الرجاء ملء جميع الحقول.');
      return;
    }

    const newReading1: BloodPressureReading = {
      date: format(date, 'yyyy-MM-dd'),
      time: time + " - 1",
      systolic: parseInt(systolic1),
      diastolic: parseInt(diastolic1),
      heartRate: parseInt(heartRate1),
    };

    const newReading2: BloodPressureReading = {
      date: format(date, 'yyyy-MM-dd'),
      time: time + " - 2",
      systolic: parseInt(systolic2),
      diastolic: parseInt(diastolic2),
          heartRate: parseInt(heartRate2),
    };

    setBpData([...bpData, newReading1, newReading2]);
    setSystolic1('');
    setDiastolic1('');
    setHeartRate1('');
    setSystolic2('');
    setDiastolic2('');
    setHeartRate2('');
  };


  const chartData = bpData.map(item => ({
    ...item,
    name: `${item.time} - ${item.date}`, // Combine time and date for chart labels
  }));

  return (
    <div dir="rtl" className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>إدخال قراءة ضغط الدم ومعدل النبض</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
             <div className="grid grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>اختر تاريخاً</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="systolic1">انقباضي 1</Label>
                <Input
                  type="number"
                  id="systolic1"
                  placeholder="انقباضي 1"
                  value={systolic1}
                  onChange={(e) => setSystolic1(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="diastolic1">انبساطي 1</Label>
                <Input
                  type="number"
                  id="diastolic1"
                  placeholder="انبساطي 1"
                  value={diastolic1}
                  onChange={(e) => setDiastolic1(e.target.value)}
                />
              </div>
                 <div className="grid gap-2">
                <Label htmlFor="heartRate1">معدل النبض 1</Label>
                <Input
                  type="number"
                  id="heartRate1"
                  placeholder="معدل النبض 1"
                  value={heartRate1}
                  onChange={(e) => setHeartRate1(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="systolic2">انقباضي 2</Label>
                <Input
                  type="number"
                  id="systolic2"
                  placeholder="انقباضي 2"
                  value={systolic2}
                  onChange={(e) => setSystolic2(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="diastolic2">انبساطي 2</Label>
                <Input
                  type="number"
                  id="diastolic2"
                  placeholder="انبساطي 2"
                  value={diastolic2}
                  onChange={(e) => setDiastolic2(e.target.value)}
                />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="heartRate2">معدل النبض 2</Label>
                <Input
                  type="number"
                  id="heartRate2"
                  placeholder="معدل النبض 2"
                  value={heartRate2}
                  onChange={(e) => setHeartRate2(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit">أضف القراءات</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>متوسط القراءات اليومية</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            انقباضي: {dailyAverageData.systolic} mmHg, انبساطي:{' '}
            {dailyAverageData.diastolic} mmHg, معدل النبض: {dailyAverageData.heartRate} نبضة/دقيقة
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اتجاهات القراءات</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
                <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="hsl(var(--accent))"
                activeDot={{ r: 8 }}
              />
               <Line
                type="monotone"
                dataKey="heartRate"
                stroke="hsl(var(--chart-2))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
    </div>
  );
}
