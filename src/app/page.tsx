'use client';

import { useState, useEffect, useRef } from 'react';
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
  date: string;
  time: string;
  systolic1: number;
  diastolic1: number;
  heartRate1: number;
  systolic2: number;
  diastolic2: number;
  heartRate2: number;
}

const TIME_OPTIONS = ['الصباح', 'الليل'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white border rounded shadow-md">
        <p className="font-bold">{`${label}`}</p>
        <p className="text-gray-700">{`قراءة 1 - انقباضي: ${data.systolic1} mmHg, انبساطي: ${data.diastolic1} mmHg, معدل النبض: ${data.heartRate1} نبضة/دقيقة`}</p>
        <p className="text-gray-700">{`قراءة 2 - انقباضي: ${data.systolic2} mmHg, انبساطي: ${data.diastolic2} mmHg, معدل النبض: ${data.heartRate2} نبضة/دقيقة`}</p>
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
  const [lastDeleted, setLastDeleted] = useState<{ reading: BloodPressureReading, index: number } | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('bpData', JSON.stringify(bpData));
  }, [bpData]);

  const dailyAverage = () => {
    if (bpData.length === 0) return { systolic: 0, diastolic: 0, heartRate: 0 };

    const todayReadings = bpData.filter(reading => reading.date === format(date, 'yyyy-MM-dd'));
    if (todayReadings.length === 0) return { systolic: 0, diastolic: 0, heartRate: 0 };

    let systolicSum1 = 0;
    let diastolicSum1 = 0;
    let heartRateSum1 = 0;
    let systolicSum2 = 0;
    let diastolicSum2 = 0;
    let heartRateSum2 = 0;

    todayReadings.forEach(reading => {
        systolicSum1 += reading.systolic1;
        diastolicSum1 += reading.diastolic1;
        heartRateSum1 += reading.heartRate1;
        systolicSum2 += reading.systolic2;
        diastolicSum2 += reading.diastolic2;
        heartRateSum2 += reading.heartRate2;
    });

    const count = todayReadings.length * 2; // Since we have two readings

    return {
      systolic: Math.round((systolicSum1 + systolicSum2) / (count/2)),
      diastolic: Math.round((diastolicSum1 + diastolicSum2) / (count/2)),
      heartRate: Math.round((heartRateSum1 + heartRateSum2) / (count/2))
    };
  };

  useEffect(() => {
    setDailyAverageData(dailyAverage());
  }, [bpData, date]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !systolic1 || !diastolic1 || !systolic2 || !diastolic2 || !heartRate1 || !heartRate2) {
      alert('الرجاء ملء جميع الحقول.');
      return;
    }

    const newReading: BloodPressureReading = {
      date: format(date, 'yyyy-MM-dd'),
      time: time,
      systolic1: parseInt(systolic1),
      diastolic1: parseInt(diastolic1),
      heartRate1: parseInt(heartRate1),
      systolic2: parseInt(systolic2),
      diastolic2: parseInt(diastolic2),
      heartRate2: parseInt(heartRate2),
    };

    setBpData([...bpData, newReading]);
    setSystolic1('');
    setDiastolic1('');
    setHeartRate1('');
    setSystolic2('');
    setDiastolic2('');
    setHeartRate2('');
  };


  const chartData = bpData.map(item => ({
    ...item,
    name: `${item.time} - ${item.date}`,
    systolic1: item.systolic1,
    diastolic1: item.diastolic1,
    heartRate1: item.heartRate1,
    systolic2: item.systolic2,
    diastolic2: item.diastolic2,
    heartRate2: item.heartRate2,
    avgSystolic: (item.systolic1 + item.systolic2) / 2,
    avgDiastolic: (item.diastolic1 + item.diastolic2) / 2,
    avgHeartRate: (item.heartRate1 + item.heartRate2) / 2,
  }));

  const removeReading = (indexToRemove: number) => {
    const readingToRemove = bpData[indexToRemove];
    setBpData(prevData => {
      const newData = [...prevData];
      newData.splice(indexToRemove, 1);
      return newData;
    });

    setLastDeleted({ reading: readingToRemove, index: indexToRemove });

    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      setLastDeleted(null);
    }, 5000);

    setUndoTimeoutId(timeoutId);
  };

  const undoDelete = () => {
    if (lastDeleted) {
      setBpData(prevData => {
        const newData = [...prevData];
        newData.splice(lastDeleted.index, 0, lastDeleted.reading);
        return newData;
      });
      setLastDeleted(null);
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        setUndoTimeoutId(null);
      }
    }
  };

  const getCombinedSystolic = (reading: BloodPressureReading) => {
    return Math.round((reading.systolic1 + reading.systolic2) / 2);
  };

  const getCombinedDiastolic = (reading: BloodPressureReading) => {
    return Math.round((reading.diastolic1 + reading.diastolic2) / 2);
  };

  const getCombinedHeartRate = (reading: BloodPressureReading) => {
    return Math.round((reading.heartRate1 + reading.heartRate2) / 2);
  };

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

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>اتجاهات القراءات - انقباضي</CardTitle>
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
                dataKey="systolic1"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="systolic2"
                stroke="hsl(var(--secondary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="avgSystolic"
                stroke="hsl(var(--chart-2))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>اتجاهات القراءات - انبساطي</CardTitle>
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
                dataKey="diastolic1"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic2"
                stroke="hsl(var(--secondary))"
                activeDot={{ r: 8 }}
              />
               <Line
                type="monotone"
                dataKey="avgDiastolic"
                stroke="hsl(var(--chart-2))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>اتجاهات القراءات - معدل النبض</CardTitle>
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
                dataKey="heartRate1"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
              />
               <Line
                type="monotone"
                dataKey="heartRate2"
                stroke="hsl(var(--secondary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="avgHeartRate"
                stroke="hsl(var(--chart-2))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جميع القراءات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            {bpData.map((reading, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b">
                <div>
                  {reading.time} - {reading.date}: {getCombinedSystolic(reading)}/{getCombinedDiastolic(reading)} ({getCombinedHeartRate(reading)})
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeReading(index)}>
                  حذف
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {lastDeleted && (
        <div className="fixed bottom-4 left-4 bg-gray-200 p-4 rounded-md shadow-lg">
          <p>تم حذف القراءة. هل تريد التراجع؟</p>
          <Button onClick={undoDelete} variant="secondary">
            تراجع
          </Button>
        </div>
      )}
    </div>
  );
}
