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

// Define types for our livestream data
interface Livestream {
  date: string;
  title: string;
  url: string;
  description: string;
  status: "completed" | "upcoming";
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
  const upcomingEvents = livestreams.livestreams.filter(
    (stream: Livestream) => stream.status === "upcoming"
  );
  const pastEvents = livestreams.livestreams.filter(
    (stream: Livestream) => stream.status === "completed"
  );

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
        
        {/* Upcoming Events Section - Now at the top */}
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
            <div className="grid gap-8 md:grid-cols-2">
              {upcomingEvents.map((stream: Livestream, index: number) => {
                const videoId = getYouTubeVideoId(stream.url);
                return (
                  <motion.div 
                    key={index} 
                    className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {videoId && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image 
                          src={getYouTubeThumbnail(videoId)} 
                          alt={stream.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/30">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <Play className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xl font-medium">{stream.title}</h3>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {stream.date}
                        </span>
                      </div>
                      <p className="mb-6 text-muted-foreground line-clamp-2">{stream.description}</p>
                      <Button asChild variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90">
                        <Link href={stream.url} target="_blank" className="flex items-center justify-center gap-2">
                          Set Reminder
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
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
          <div className="grid md:grid-cols-2 gap-8">
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
          </div>
        </motion.section>

        {/* Community Meetings Section */}
        <motion.section 
          className="mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-medium">Community Meetings</h2>
          </div>
          <motion.div 
            className="overflow-hidden rounded-lg border bg-card p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-xl font-medium">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                Community meetings are coming soon! Stay tuned for updates on when we&apos;ll start hosting regular community calls.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <VideoIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl font-medium">Past Events</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((stream: Livestream, index: number) => {
                const videoId = getYouTubeVideoId(stream.url);
                return (
                  <motion.div 
                    key={index} 
                    className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                  >
                    {videoId && (
                      <div className="relative h-40 w-full overflow-hidden">
                        <Image 
                          src={getYouTubeThumbnail(videoId)} 
                          alt={stream.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/30">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <Play className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-lg font-medium line-clamp-1">{stream.title}</h3>
                        <span className="text-xs text-muted-foreground">{stream.date}</span>
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{stream.description}</p>
                      <Button asChild variant="outline" size="sm" className="w-full group-hover:border-primary group-hover:text-primary">
                        <Link href={stream.url} target="_blank" className="flex items-center justify-center gap-2">
                          Watch Now
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
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