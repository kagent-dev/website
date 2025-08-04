'use client';

import React, { useState, useEffect } from "react";
import { Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { 
  nextTuesday, 
  format, 
  isToday as isTodayFns,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
  formatDistanceToNow
} from "date-fns";
import { toZonedTime } from 'date-fns-tz';

interface MeetingTime {
  timezone: string;
  time: string;
}

const calculateMeetingTimes = (meetingDate: Date, excludeTimezone?: string): MeetingTime[] => {
  // Create 9:00 AM Pacific time by using explicit timezone offsets
  const pacificDateStr = format(meetingDate, 'yyyy-MM-dd');
  
  // Create a date in Pacific timezone at 9:00 AM
  const pacificTime = new Date(`${pacificDateStr}T09:00:00.000-08:00`); // PST offset
  const pacificTimePDT = new Date(`${pacificDateStr}T09:00:00.000-07:00`); // PDT offset
  
  // Check which one is correct for the current date (PST or PDT)
  const now = new Date();
  const isDST = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).includes('PDT');
  const correctPacificTime = isDST ? pacificTimePDT : pacificTime;
  
  const timezones = [
    { zone: 'America/Los_Angeles', label: 'PDT' }, // Pacific
    { zone: 'America/New_York', label: 'EDT' },    // Eastern
    { zone: 'Europe/London', label: 'GMT' },       // GMT
    { zone: 'Europe/Paris', label: 'CEST' },       // Central European
    { zone: 'Asia/Tokyo', label: 'JST' },          // Japan
    { zone: 'Australia/Sydney', label: 'AEST' },   // Australia
  ];
  
  const filteredTimezones = excludeTimezone 
    ? timezones.filter(({ zone }) => zone !== excludeTimezone)
    : timezones;
  
  return filteredTimezones.map(({ zone, label }) => {
    const targetTime = toZonedTime(correctPacificTime, zone);
    const timeString = format(targetTime, 'h:mm a');
    
    const pacificDateStr2 = format(correctPacificTime, 'yyyy-MM-dd');
    const targetDateStr = format(targetTime, 'yyyy-MM-dd');
    const isNextDay = targetDateStr !== pacificDateStr2;
    
    return {
      timezone: label,
      time: isNextDay ? `${timeString} (+1)` : timeString
    };
  });
};

const MEETING_NOTES_URL = "https://docs.google.com/document/d/1rfXZSLIA4GXyTiwzJqSbAbbJIgL6kF0h00lrMnPh-KM/edit?tab=t.0#heading=h.o8pz6aqnzzgk";
const CALENDAR_URL = "https://calendar.google.com/calendar/u/0?cid=Y183OTI0OTdhNGU1N2NiNzVhNzE0Mjg0NWFkMzVkNTVmMTkxYTAwOWVhN2ZiN2E3ZTc5NDA5Yjk5NGJhOTRhMmVhQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20";

// Function to get the next Tuesday
const getNextTuesday = (): Date => {
  const today = new Date();
  
  // If today is Tuesday and it's before 6 PM PST, consider today as "next"
  if (today.getDay() === 2) { // Tuesday is day 2
    const now = new Date();
    const pstOffset = -8 * 60; // PST is UTC-8
    const pstTime = new Date(now.getTime() + (now.getTimezoneOffset() + pstOffset) * 60000);
    const sixPmPst = setHours(setMinutes(startOfDay(pstTime), 0), 18);
    
    if (isBefore(pstTime, sixPmPst)) {
      // Before 6 PM PST, today is the "next" Tuesday
      return today;
    } else {
      // After 6 PM PST, get next Tuesday
      return nextTuesday(today);
    }
  }
  
  return nextTuesday(today);
};

const formatMeetingDate = (date: Date): string => {
  return format(date, 'EEEE, MMMM d, yyyy');
};

// Function to get user's local meeting time
const getUserLocalMeetingTime = (meetingDate: Date): { time: string; timezone: string; isNextDay: boolean } => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create 9:00 AM Pacific time by using Intl.DateTimeFormat
  const pacificDateStr = format(meetingDate, 'yyyy-MM-dd');
  
  // Create a date in Pacific timezone at 9:00 AM
  const pacificTime = new Date(`${pacificDateStr}T09:00:00.000-08:00`); // PST offset
  const pacificTimePDT = new Date(`${pacificDateStr}T09:00:00.000-07:00`); // PDT offset
  
  // Check which one is correct for the current date (PST or PDT)
  const now = new Date();
  const isDST = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).includes('PDT');
  const correctPacificTime = isDST ? pacificTimePDT : pacificTime;
  
  // Convert to user's timezone
  const userTime = toZonedTime(correctPacificTime, userTimeZone);
  
  // Format the time
  const timeString = format(userTime, 'h:mm a');
  
  // Get timezone abbreviation
  const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone: userTimeZone
  });
  
  const timeZoneName = timeZoneFormatter.formatToParts(userTime)
    .find(part => part.type === 'timeZoneName')?.value || userTimeZone;
  
  // Check if it's the next day for the user
  const pacificDateStr2 = format(correctPacificTime, 'yyyy-MM-dd');
  const userDateStr = format(userTime, 'yyyy-MM-dd');
  const isNextDay = userDateStr !== pacificDateStr2;
  
  return {
    time: timeString,
    timezone: timeZoneName,
    isNextDay
  };
};

export function WeeklySchedule() {
  const [showAllTimezones, setShowAllTimezones] = useState(false);
  const [userLocalTime, setUserLocalTime] = useState<{ time: string; timezone: string; isNextDay: boolean } | null>(null);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  
  const nextMeeting = getNextTuesday();
  const isToday = isTodayFns(nextMeeting);
  const meetingTimes = calculateMeetingTimes(nextMeeting, userTimezone || undefined);

  useEffect(() => {
    // Only run on client side to avoid hydration issues
    setUserLocalTime(getUserLocalMeetingTime(nextMeeting));
    setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <div className="w-full">
      <Card className="border rounded-lg shadow-sm bg-card">
        <CardContent className="p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Meeting Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {isToday ? "Today's Meeting" : "Next Meeting"}
                  </span>
                  {isToday && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground ml-2">
                      Happening Today!
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {formatMeetingDate(nextMeeting)}
                </h3>
                
                {/* User's Local Time */}
                {userLocalTime && (
                  <div className="mb-4">
                    <div className="text-xl font-semibold text-primary">
                      {userLocalTime.time} {userLocalTime.timezone}
                      {userLocalTime.isNextDay && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">(+1 day)</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isToday ? "Today" : formatDistanceToNow(nextMeeting, { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              {/* Time Zones Section */}
              <div>
                <button
                  onClick={() => setShowAllTimezones(!showAllTimezones)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <Clock className="w-4 h-4" />
                  Other time zones
                  {showAllTimezones ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {showAllTimezones && (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {meetingTimes.map((time: MeetingTime, index: number) => (
                      <div 
                        key={index} 
                        className="flex justify-between py-2 px-3 rounded border text-sm"
                      >
                        <span className="font-medium">{time.timezone}:</span>
                        <span>{time.time}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Column - Actions & Info */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Join the Meeting</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with the kagent community every Tuesday for discussions, demos, and Q&A sessions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href={MEETING_NOTES_URL} target="_blank" className="flex items-center justify-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Meeting Notes & Join
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={CALENDAR_URL} target="_blank" className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Add to Calendar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}