import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Calendar, MapPin, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  };
}

interface Live {
  id: string;
  artist: string;
  date: string;
  venue: string;
  attendees: User[];
}

interface ProfileRing2Props {
  live: Live;
  onClose: () => void;
  onViewProfile: (user: User) => void;
}

// SNSアイコンコンポーネント
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.10z"/>
  </svg>
);

export function ProfileRing2({ live, onClose, onViewProfile }: ProfileRing2Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // ProfileRing2 rendering

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    const totalAttendees = live.attendees.length;
    
    if (info.offset.y < -threshold) {
      // Swipe up - next profile
      setDirection(1);
      if (currentIndex < totalAttendees - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // At last profile, loop to first
        setCurrentIndex(0);
      }
    } else if (info.offset.y > threshold) {
      // Swipe down - previous profile
      setDirection(-1);
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        // At first profile, loop to last
        setCurrentIndex(totalAttendees - 1);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });
    return {
      year: year.toString(),
      dateInfo: `${month}/${day}(${weekday})`
    };
  };

  const slideVariants = {
    enter: (direction: number) => ({
      rotateX: direction > 0 ? 90 : -90,
      y: direction > 0 ? 100 : -100,
      scale: 0.9,
      opacity: 0,
      transformOrigin: direction > 0 ? "bottom" : "top",
    }),
    center: {
      rotateX: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transformOrigin: "center",
    },
    exit: (direction: number) => ({
      rotateX: direction > 0 ? -90 : 90,
      y: direction > 0 ? -100 : 100,
      scale: 0.9,
      opacity: 0,
      transformOrigin: direction > 0 ? "top" : "bottom",
    }),
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile(live.attendees[currentIndex]);
  };

  const { year, dateInfo } = formatDate(live.date);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Live Info Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-primary bg-white text-gray-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-center min-w-[70px]">
                <div className="text-xs opacity-80 leading-tight">{year}</div>
                <div className="text-sm font-medium leading-tight">{dateInfo}</div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-base mb-1 text-gray-800">{live.artist}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{live.venue}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Card Container */}
          <div className="relative min-h-[500px]">
            {/* Ring Holes */}
            <div className="absolute -top-2 left-0 right-0 flex justify-around px-8 z-30">
              {Array.from({ length: 20 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 300 }}
                  className="w-3 h-4 bg-gray-800 rounded-full shadow-inner"
                  style={{
                    background: 'linear-gradient(to bottom, #4a5568, #2d3748)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.1)'
                  }}
                />
              ))}
            </div>

            {/* Single Profile Card */}
            <div className="relative">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                    duration: 0.7,
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: 1200,
                  }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div 
                    className="bg-white rounded-lg overflow-hidden shadow-lg mx-2" 
                    style={{ 
                      backfaceVisibility: "hidden",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    <div className="pt-6 pb-0 px-6">
                      <div className="flex flex-col items-center text-center py-4">
                        {/* Avatar */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                          className="mb-6"
                        >
                          <motion.div 
                            className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden cursor-pointer"
                            onClick={handleViewProfile}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={live.attendees[currentIndex].avatar}
                              alt={live.attendees[currentIndex].name}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        </motion.div>

                        {/* Name */}
                        <motion.h3
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-lg font-medium mb-4 text-black"
                        >
                          {live.attendees[currentIndex].name}
                        </motion.h3>

                        {/* Bio */}
                        {live.attendees[currentIndex].bio && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-700 mb-6 text-sm leading-relaxed max-w-xs"
                          >
                            {live.attendees[currentIndex].bio}
                          </motion.p>
                        )}

                        {/* Social Links */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex flex-col gap-3 w-full max-w-xs mb-6"
                        >
                          {live.attendees[currentIndex].socialLinks.instagram && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="border-2 border-primary bg-white text-gray-800 rounded-lg p-3 cursor-pointer"
                              onClick={() => window.open(`https://instagram.com/${live.attendees[currentIndex].socialLinks.instagram?.replace('@', '')}`, '_blank')}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center text-white">
                                  <InstagramIcon />
                                </div>
                                <span className="text-sm font-medium">{live.attendees[currentIndex].socialLinks.instagram}</span>
                              </div>
                            </motion.div>
                          )}

                          {live.attendees[currentIndex].socialLinks.twitter && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="border-2 border-primary bg-white text-gray-800 rounded-lg p-3 cursor-pointer"
                              onClick={() => window.open(`https://twitter.com/${live.attendees[currentIndex].socialLinks.twitter?.replace('@', '')}`, '_blank')}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white">
                                  <TwitterIcon />
                                </div>
                                <span className="text-sm font-medium">{live.attendees[currentIndex].socialLinks.twitter}</span>
                              </div>
                            </motion.div>
                          )}

                          {live.attendees[currentIndex].socialLinks.tiktok && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="border-2 border-primary bg-white text-gray-800 rounded-lg p-3 cursor-pointer"
                              onClick={() => window.open(`https://tiktok.com/${live.attendees[currentIndex].socialLinks.tiktok?.replace('@', '')}`, '_blank')}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white">
                                  <TikTokIcon />
                                </div>
                                <span className="text-sm font-medium">{live.attendees[currentIndex].socialLinks.tiktok}</span>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* More Details Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="px-6 pb-6"
                    >
                      <motion.button
                        onClick={handleViewProfile}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        もっとみる
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Swipe Indicator - PC only, positioned directly below card */}
            {live.attendees.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="hidden md:block absolute bottom-0 left-0 right-0 text-center text-white text-sm pt-4"
              >
                上下にスワイプして他の参加者を見る
              </motion.div>
            )}
          </div>

          {/* Swipe Indicator - Mobile only */}
          {live.attendees.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="md:hidden text-center py-2 text-white text-sm"
            >
              上下にスワイプして他の参加者を見る
            </motion.div>
          )}

          {/* Navigation Dots */}
          {live.attendees.length > 1 && (
            <div className="flex justify-center gap-2 pb-2">
              {live.attendees.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}