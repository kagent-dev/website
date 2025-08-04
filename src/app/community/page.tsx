'use client';

import React, { useState, useEffect } from "react";
import { Calendar, Users, Play, ExternalLink, VideoIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DiscordIcon from "@/components/icons/discord";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";
import Github from "@/components/icons/github";
import livestreams from "@/data/livestreams.yaml";
import { motion } from "framer-motion";
import Image from "next/image";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { WeeklySchedule } from "@/components/weekly-schedule";

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

const EventSkeleton = () => (
  <div className="overflow-hidden rounded-lg border bg-card shadow-sm opacity-70">
    <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-t-lg">
      <div className="w-full h-full animate-shimmer" />
    </div>
    
    <div className="p-6">
      <div className="mb-1">
        <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
      </div>
      <div className="h-4 bg-muted/70 rounded animate-pulse mb-3 w-1/3" />
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-muted/50 rounded animate-pulse" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-3/5" />
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="h-8 bg-muted/40 rounded animate-pulse" />
        <div className="h-8 bg-muted/30 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const CommunityPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 6;

  // Separate upcoming and past events
  const upcomingLivestreams = livestreams.livestreams.filter(
    (stream: Livestream) => stream.status === "upcoming"
  );
  const pastLivestreams = livestreams.livestreams.filter(
    (stream: Livestream) => stream.status === "completed"
  );

  const pastMeetings = (livestreams.communityMeetings || []).filter(
    (meeting: CommunityMeeting) => meeting.status === "completed"
  );

  const upcomingEvents: UpcomingEvent[] = [
    ...upcomingLivestreams.map((stream: Livestream): UpcomingEvent => ({ 
      ...stream, 
      type: 'livestream', 
      status: 'upcoming' // Ensure status consistency
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending

  // Combine and sort past events
  const allPastEvents: PastEvent[] = [
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

  const totalPages = Math.ceil(allPastEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pastEvents = allPastEvents.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || isLoading) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => {
        setIsLoading(false);
      }, 150);
    }, 500);
  };

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  return (
    <div className="pt-24 pb-8 bg-gradient-to-b from-background to-background/80">
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
          <p className="text-muted-foreground max-w-5xl mx-auto">
            Connect with other kagent users, contribute to the project, and stay updated with our latest events and livestreams.
            <br/>Join us <span className="font-bold">every Tuesday</span> for community discussions, demos, and Q&A
          </p>
        </motion.div>

        {/* Weekly Community Meeting */}
        <motion.section 
          className="mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <WeeklySchedule />
        </motion.section>

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
                    className="relative overflow-hidden rounded-lg border bg-card shadow-sm"
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
                            className="object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg">
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
                         <p className="mb-6 text-muted-foreground">{event.description}</p>
                      )}
                      {/* Buttons */} 
                      <div className="flex flex-col space-y-2 mt-4"> {/* Ensure margin if description is missing */} 
                        {/* Livestream Reminder Button */}
                        {event.type === 'livestream' && (
                          <Button asChild variant="default" size="sm" className="w-full">
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

        {/* Past Events Section - Combined */}
        {pastEvents.length > 0 && (
          <motion.section
            className="mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <VideoIcon className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-medium">Past Events</h2>
            </div>
            <motion.div 
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 min-h-[600px]"
              key={`grid-${currentPage}-${isLoading ? 'loading' : 'loaded'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                Array.from({ length: itemsPerPage }, (_, index) => (
                  <EventSkeleton key={`skeleton-${currentPage}-${index}`} />
                ))
              ) : (
                pastEvents.map((event: PastEvent, index: number) => {
                  const videoId = getYouTubeVideoId(event.url);
                  const cardBaseClasses = "overflow-hidden rounded-lg border bg-card shadow-sm";
                  const cardBorderClasses = event.type === 'livestream' 
                    ? "border-primary/20" 
                    : "border-secondary/20";

                  return (
                    <motion.div 
                      key={`${event.type}-${event.date}-${index}-page-${currentPage}`}
                      className={`${cardBaseClasses} ${cardBorderClasses}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: "easeOut"
                      }}
                    >
                      {videoId && (
                        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-t-lg">
                          <Image 
                            src={getYouTubeThumbnail(videoId)} 
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="p-6"> 
                        <div className="mb-1">
                          <h3 className={`text-lg font-medium ${event.type === 'livestream' ? 'line-clamp-1' : ''}`}>{event.title}</h3>
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">{event.date}</p> {/* Added date display here */}
                        {event.description && (
                          <p className="mb-4 text-sm text-muted-foreground">{event.description}</p>
                        )}
                        
                        <div className="flex flex-col space-y-2">
                          {event.url && (
                            <Button 
                              asChild 
                              variant={event.type === 'livestream' ? "outline" : "secondary"} 
                              size="sm" 
                              className="w-full"
                            >
                              <Link href={event.url} target="_blank" className="flex items-center justify-center gap-2">
                                Watch Recording
                                <VideoIcon className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
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
                })
              )}
            </motion.div>
            
            {totalPages > 1 && (
              <motion.div 
                className={`flex justify-center items-center gap-4 mt-12 transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Previous"}
                </Button>
                
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                  {!isLoading && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                      className="w-10 h-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
                </Button>
              </motion.div>
            )}
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
          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div 
              className="flex-1 overflow-hidden rounded-lg border bg-card p-8 shadow-sm"
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
              <Button asChild variant="outline" size="sm">
                <Link href={GITHUB_LINK} target="_blank" className="flex items-center gap-2">
                  View on GitHub
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex-1 overflow-hidden rounded-lg border bg-card p-8 shadow-sm"
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
              <Button asChild variant="outline" size="sm">
                <Link href={DISCORD_LINK} target="_blank" className="flex items-center gap-2">
                  Join Discord
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default CommunityPage; 