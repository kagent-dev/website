'use client';

import React from "react";
import { Calendar, Users, Play, ExternalLink, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DiscordIcon from "@/components/icons/discord";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";
import Github from "@/components/icons/github";
import livestreams from "@/data/livestreams.yaml";
import { motion } from "framer-motion";
import Image from "next/image";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

// Define types for our livestream data
interface Livestream {
  date: string;
  title: string;
  url: string;
  description: string;
  status: "completed" | "upcoming";
}

// Define type for community meeting data
interface CommunityMeeting {
  date: string;
  title: string;
  description?: string;
  url: string; 
  meetingNotes?: string; // Optional link to notes
  status: "completed" | "upcoming";
}

// Define a unified type for past events
interface PastEvent {
  type: 'livestream' | 'meeting';
  date: string;
  title: string;
  url: string;
  description?: string;
  meetingNotes?: string; // Only for meetings
  status: "completed"; // Only past events
}

// Define a unified type for upcoming events
interface UpcomingEvent {
  type: 'livestream' | 'meeting';
  date: string;
  title: string;
  url: string; // URL is required for both now (YT for stream, placeholder/irrelevant for meeting? Check YAML)
  description?: string; // Optional description for livestreams
  meetingNotes?: string; // Optional notes for meetings
  status: "upcoming"; // Only upcoming events
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

// Helper function to get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
};

const CommunityPage = () => {
  // Separate upcoming and past events
  const upcomingLivestreams = livestreams.livestreams.filter(
    (stream: Livestream) => stream.status === "upcoming"
  );
  const pastLivestreams = livestreams.livestreams.filter(
    (stream: Livestream) => stream.status === "completed"
  );

  // Separate upcoming and past community meetings
  const upcomingMeetings = (livestreams.communityMeetings || []).filter(
    (meeting: CommunityMeeting) => meeting.status === "upcoming"
  );
  const pastMeetings = (livestreams.communityMeetings || []).filter(
    (meeting: CommunityMeeting) => meeting.status === "completed"
  );

  // Combine and sort upcoming events
  const upcomingEvents: UpcomingEvent[] = [
    ...upcomingLivestreams.map((stream: Livestream): UpcomingEvent => ({ 
      ...stream, 
      type: 'livestream', 
      status: 'upcoming' // Ensure status consistency
    })),
    ...upcomingMeetings.map((meeting: CommunityMeeting): UpcomingEvent => ({ 
      ...meeting, 
      type: 'meeting', 
      status: 'upcoming' // Ensure status consistency
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending

  // Combine and sort past events
  const pastEvents: PastEvent[] = [
    ...pastLivestreams.map((stream: Livestream): PastEvent => ({ 
      ...stream, 
      type: 'livestream', 
      status: 'completed'
    })),
    ...pastMeetings.map((meeting: CommunityMeeting): PastEvent => ({ 
      ...meeting, 
      type: 'meeting', 
      status: 'completed'
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-background to-background/80">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-light tracking-tight mb-4">
            Join Our Community
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with other kagent users, contribute to the project, and stay updated with our latest events and livestreams.
          </p>
        </motion.div>
        
        {/* Upcoming Events Section - Combined */}
        {upcomingEvents.length > 0 && (
          <motion.section 
            className="mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-medium">Upcoming Events</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event: UpcomingEvent, index: number) => {
                const videoId = event.type === 'livestream' ? getYouTubeVideoId(event.url) : null;
                
                const eventDate = new Date(event.date);
                const isToday = eventDate.getFullYear() === todayYear &&
                                eventDate.getMonth() === todayMonth &&
                                eventDate.getDate() === todayDay;

                return (
                  <motion.div 
                    key={`${event.type}-${index}`} 
                    className={`group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {/* Happening Today Badge - Moved to top */}
                    {isToday && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                          Happening Today!
                        </span>
                      </div>
                    )}
                    {/* Thumbnail for Livestreams OR Icon Placeholder for Meetings */}
                    {event.type === 'livestream' ? (
                      videoId && (
                        <div className="relative h-48 w-full overflow-hidden">
                          <Image 
                            src={getYouTubeThumbnail(videoId)} 
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/30">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                              <Play className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      // Placeholder for Community Meetings
                      <div className="relative h-48 w-full overflow-hidden bg-muted flex items-center justify-center">
                        <Users className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-medium">{event.title}</h3>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {event.date}
                        </span>
                      </div>
                      {/* Description - Show if it exists for any type */}
                      {event.description && (
                         <p className="mb-6 text-muted-foreground max-h-[3em] overflow-hidden group-hover:max-h-[200px] transition-all duration-300 ease-in-out">{event.description}</p>
                      )}
                      {/* Buttons */} 
                      <div className="flex flex-col space-y-2 mt-4"> {/* Ensure margin if description is missing */} 
                        {/* Livestream Reminder Button */}
                        {event.type === 'livestream' && (
                          <Button asChild variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90">
                            <Link href={event.url} target="_blank" className="flex items-center justify-center gap-2">
                              Set Reminder
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {/* Meeting Notes Button */}
                        {event.type === 'meeting' && event.meetingNotes && (
                           <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href={event.meetingNotes} target="_blank" className="flex items-center justify-center gap-2">
                              View Meeting Notes & Join
                              <DocumentTextIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Get Involved Section */}
        <motion.section 
          className="mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-medium">Get Involved</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              className="group overflow-hidden rounded-lg border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Github className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-xl font-medium">Contribute on GitHub</h3>
              <p className="mb-6 text-muted-foreground">
                Help shape the future of kagent by contributing to our open-source repository.
              </p>
              <Button asChild variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary">
                <Link href={GITHUB_LINK} target="_blank" className="flex items-center gap-2">
                  View on GitHub
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              className="group overflow-hidden rounded-lg border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <DiscordIcon className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-xl font-medium">Join Discord</h3>
              <p className="mb-6 text-muted-foreground">
                Connect with other kagent users and contributors in our Discord community.
              </p>
              <Button asChild variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary">
                <Link href={DISCORD_LINK} target="_blank" className="flex items-center gap-2">
                  Join Discord
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* New Community Meeting Card */}
            <motion.div 
              className="group overflow-hidden rounded-lg border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-xl font-medium">Join Community Meetings</h3>
              <p className="mb-6 text-muted-foreground">
                Participate in our community calls, check the schedule, and view past meeting notes.
              </p>
              <div className="flex flex-col space-y-2">
                <Button asChild variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary">
                  <Link href="https://github.com/kagent-dev/community/tree/main#community-meetings" target="_blank" className="flex items-center gap-2">
                    Meeting Info & Notes
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary">
                  <Link href="https://calendar.google.com/calendar/u/0?cid=Y183OTI0OTdhNGU1N2NiNzVhNzE0Mjg0NWFkMzVkNTVmMTkxYTAwOWVhN2ZiN2E3ZTc5NDA5Yjk5NGJhOTRhMmVhQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20" target="_blank" className="flex items-center gap-2">
                    Add to Calendar
                    <Calendar className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Past Events Section - Combined */}
        {pastEvents.length > 0 && (
          <motion.section
            className="mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <VideoIcon className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-medium">Past Events</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event: PastEvent, index: number) => {
                const videoId = getYouTubeVideoId(event.url);
                const cardBaseClasses = "group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md";
                const cardBorderClasses = event.type === 'livestream' 
                  ? "border-primary/20 hover:border-primary/50" 
                  : "border-secondary/20 hover:border-secondary/50";

                return (
                  <motion.div 
                    key={`${event.type}-${index}`} 
                    className={`${cardBaseClasses} ${cardBorderClasses} hover:border-primary/50`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                  >
                    {/* Thumbnail - Render if videoId exists, regardless of type */}
                    {videoId && (
                      <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image 
                          src={getYouTubeThumbnail(videoId)} 
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* Event Info - Add padding here */}
                    <div className="p-6"> 
                      <div className="mb-1"> {/* Reduced bottom margin */}
                        <h3 className={`text-lg font-medium ${event.type === 'livestream' ? 'line-clamp-1' : ''}`}>{event.title}</h3>
                        {/* Date span removed from here */}
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground">{event.date}</p> {/* Added date display here */}
                      {event.description && (
                        <p className="mb-4 text-sm text-muted-foreground max-h-[3em] overflow-hidden group-hover:max-h-[200px] transition-all duration-300 ease-in-out">{event.description}</p>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        {/* Video Link */}
                        {event.url && (
                          <Button 
                            asChild 
                            variant={event.type === 'livestream' ? "outline" : "secondary"} 
                            size="sm" 
                            className={`w-full ${event.type === 'livestream' ? 'group-hover:border-primary group-hover:text-primary' : ''}`}
                          >
                            <Link href={event.url} target="_blank" className="flex items-center justify-center gap-2">
                              Watch Recording
                              <VideoIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {/* Meeting Notes Link */}
                        {event.type === 'meeting' && event.meetingNotes && (
                           <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href={event.meetingNotes} target="_blank" className="flex items-center justify-center gap-2">
                              View Meeting Notes
                              <DocumentTextIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                   </div> 
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default CommunityPage; 