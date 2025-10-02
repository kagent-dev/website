'use client';

import React from "react";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const KubeConAnnouncement = () => {
  return (
    <motion.div
      id="kubecon-announcement"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="py-16 bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-purple-500/5 border-y border-border"
    >
      <div className="max-w-7xl mx-auto px-6">
        <Card className="bg-muted/50 backdrop-blur-sm border border-border rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="relative h-64 lg:h-full min-h-[300px]">
              <Image
                src="/images/events/kagent-kubecon-atl-1.png"
                alt="kagent Community Party at KubeCon Atlanta"
                fill
                className="object-cover"
              />
            </div>
            
            {/* Content Section */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-3xl font-semibold text-foreground mb-4">
                  kagent Community Party
                </h3>
                <div className="space-y-2 text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Wednesday, November 12, 2025 at 6-9 PM EST</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <Link 
                      href="https://poncecityroof.com/skyline-park" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors underline"
                    >
                      Ponce City Rooftop, Atlanta
                    </Link>
                  </div>
                </div>
                <p className="text-xl font-semibold text-foreground leading-relaxed mb-1">
                    Are you attending KubeCon+CloudNativeCon Atlanta?
                </p>
                <p className="text-lg text-foreground leading-relaxed mb-8">
                    Join us at Skyline Park for retro games, rooftop views, delicious food, craft drinks, and serious fun with the kagent community.
                </p>
              </div>
              
              <Button size="lg" asChild className="hover:scale-105 transition-transform w-fit">
                <Link 
                  href="https://pages.solo.io/kubecon-kagent-community-party.html?&utm_source=website&utm_medium=direct&utm_content=kagent-dev&utm_content=kagent-dev"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Sign Up <ExternalLink className="ml-2 h-5 w-5" />
                </Link>
              </Button>

            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default KubeConAnnouncement;
