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
  date: string;
}

const TIME_OPTIONS = ['Morning', 'Night'];

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpData, setBpData] = useState<BloodPressureReading[]>(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('bpData');
      return storedData ? JSON.parse(storedData) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('bpData', JSON.stringify(bpData));
  }, [bpData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !systolic || !diastolic) {
      alert('Please fill in all fields.');
      return;
    }

    const newReading: BloodPressureReading = {
      date: format(date, 'yyyy-MM-dd'),
      time: time,
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
    };

    setBpData([...bpData, newReading]);
    setSystolic('');
    setDiastolic('');
  };

  const dailyAverage = () => {
    if (bpData.length === 0) return { systolic: 0, diastolic: 0 };

    // Filter readings for the selected date
    const dailyReadings = bpData.filter(reading => reading.date === format(date, 'yyyy-MM-dd'));
  
    if (dailyReadings.length === 0) return { systolic: 0, diastolic: 0 };

    let systolicSum = 0;
    let diastolicSum = 0;

    dailyReadings.forEach(reading => {
        systolicSum += reading.systolic;
        diastolicSum += reading.diastolic;
    });

    const count = dailyReadings.length;
    return {
        systolic: Math.round(systolicSum / count),
        diastolic: Math.round(diastolicSum / count)
    };
  };


  const chartData = bpData.map(item => ({
    ...item,
    name: `${item.time} - ${item.date}`, // Combine time and date for chart labels
  }));

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Enter Blood Pressure Reading</CardTitle>
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
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="systolic">Systolic</Label>
                <Input
                  type="number"
                  id="systolic"
                  placeholder="Systolic"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="diastolic">Diastolic</Label>
                <Input
                  type="number"
                  id="diastolic"
                  placeholder="Diastolic"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit">Add Reading</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Daily Average Blood Pressure</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Systolic: {dailyAverage().systolic} mmHg, Diastolic:{' '}
            {dailyAverage().diastolic} mmHg
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blood Pressure Trends</CardTitle>
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
              <Tooltip />
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
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
    </div>
  );
}

