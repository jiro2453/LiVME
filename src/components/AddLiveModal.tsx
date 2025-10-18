import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Music, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';

interface Live {
  id: string;
  artist: string;
  date: string;
  venue: string;
  attendees: any[];
}

interface AddLiveModalProps {
  onClose: () => void;
  onAdd: (live: Omit<Live, 'id' | 'attendees'>) => void;
  existingLives?: Live[]; // 既存のライブデータ
}

export function AddLiveModal({ onClose, onAdd, existingLives = [] }: AddLiveModalProps) {
  const [formData, setFormData] = useState({
    artist: '',
    date: '',
    venue: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false);
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  
  const artistInputRef = useRef<HTMLInputElement>(null);
  const venueInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 既存データからユニークなアーティスト名を抽出
  const uniqueArtists = useMemo(() => {
    const artists = existingLives.map(live => live.artist);
    return [...new Set(artists)].sort();
  }, [existingLives]);

  // 既存データからユニークな会場名を抽出
  const uniqueVenues = useMemo(() => {
    const venues = existingLives.map(live => live.venue);
    const existingVenueSet = new Set(venues);
    
    // デフォルトの会場リストと既存データを組み合わせ
    const defaultVenues = [
      '東京ドーム',
      '横浜アリーナ',
      '武道館',
      'さいたまスーパーアリーナ',
      '大阪城ホール',
      'Zepp Tokyo',
      'Zepp DiverCity',
      'LIQUIDROOM',
      '恵比寿ガーデンホール',
      '中野サンプラザ'
    ];
    
    // 既存の会場とデフォルト会場を統合し、重複を削除
    const allVenues = [...new Set([...venues, ...defaultVenues])];
    return allVenues.sort();
  }, [existingLives]);

  // 特定のアーティストの開催日履歴を取得
  const getArtistDates = useMemo(() => {
    if (!formData.artist.trim()) return [];
    
    const artistLives = existingLives.filter(live => 
      live.artist.toLowerCase().includes(formData.artist.toLowerCase())
    );
    
    return [...new Set(artistLives.map(live => live.date))].sort().reverse(); // 新しい順
  }, [existingLives, formData.artist]);

  // サジェストのフィルタリング
  const filteredArtists = useMemo(() => {
    if (!formData.artist.trim()) return [];
    return uniqueArtists.filter(artist =>
      artist.toLowerCase().includes(formData.artist.toLowerCase()) &&
      artist.toLowerCase() !== formData.artist.toLowerCase()
    ).slice(0, 5);
  }, [uniqueArtists, formData.artist]);

  const filteredVenues = useMemo(() => {
    if (!formData.venue.trim()) return [];
    return uniqueVenues.filter(venue =>
      venue.toLowerCase().includes(formData.venue.toLowerCase()) &&
      venue.toLowerCase() !== formData.venue.toLowerCase()
    ).slice(0, 5);
  }, [uniqueVenues, formData.venue]);

  // 外部クリックでサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (artistInputRef.current && !artistInputRef.current.contains(event.target as Node)) {
        setShowArtistSuggestions(false);
      }
      if (venueInputRef.current && !venueInputRef.current.contains(event.target as Node)) {
        setShowVenueSuggestions(false);
      }
      if (dateInputRef.current && !dateInputRef.current.contains(event.target as Node)) {
        setShowDateSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.artist.trim()) {
      newErrors.artist = 'アーティスト名を入力してください';
    }
    
    if (!formData.date) {
      newErrors.date = '日付を選択してください';
    }
    // 日付の制限を削除 - 過去・未来どちらの日付も登録可能に
    
    if (!formData.venue.trim()) {
      newErrors.venue = '会場名を入力してください';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onAdd(formData);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSuggestionSelect = (field: string, value: string) => {
    handleInputChange(field, value);
    if (field === 'artist') setShowArtistSuggestions(false);
    if (field === 'venue') setShowVenueSuggestions(false);
    if (field === 'date') setShowDateSuggestions(false);
  };

  const SuggestionsList = ({ suggestions, onSelect, isVisible }: {
    suggestions: string[];
    onSelect: (value: string) => void;
    isVisible: boolean;
  }) => (
    <AnimatePresence>
      {isVisible && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              type="button"
              onClick={() => onSelect(suggestion)}
              className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 text-sm"
              whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-6 bg-background border-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-10"></div>
            <h2 className="text-xl tracking-wider text-center flex-1">
              参加公演を追加
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Artist */}
            <div className="space-y-2">
              <Label htmlFor="artist" className="flex items-center gap-2 justify-center">
                <Music className="w-4 h-4" />
                アーティスト名
              </Label>
              <div className="relative" ref={artistInputRef}>
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => handleInputChange('artist', e.target.value)}
                  onFocus={() => setShowArtistSuggestions(true)}
                  placeholder="例: King Gnu"
                  className={`rounded-lg border-2 bg-muted/30 text-center ${errors.artist ? 'border-destructive' : ''}`}
                />
                <SuggestionsList
                  suggestions={filteredArtists}
                  onSelect={(value) => handleSuggestionSelect('artist', value)}
                  isVisible={showArtistSuggestions}
                />
              </div>
              {errors.artist && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-destructive text-sm text-center"
                >
                  {errors.artist}
                </motion.p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 justify-center">
                <Calendar className="w-4 h-4" />
                開催日
              </Label>
              <div className="relative" ref={dateInputRef}>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  onFocus={() => setShowDateSuggestions(true)}
                  className={`rounded-lg border-2 bg-muted/30 text-center ${errors.date ? 'border-destructive' : ''}`}
                />
                
                {/* アーティストの過去開催日を表示 */}
                <AnimatePresence>
                  {showDateSuggestions && getArtistDates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-lg shadow-lg max-h-32 overflow-y-auto"
                    >
                      <div className="p-2 border-b border-border text-xs text-muted-foreground text-center">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formData.artist}の過去開催日
                      </div>
                      {getArtistDates.slice(0, 4).map((date, index) => (
                        <motion.button
                          key={date}
                          type="button"
                          onClick={() => handleSuggestionSelect('date', date)}
                          className="w-full text-center p-2 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 text-sm"
                          whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {new Date(date).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errors.date && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-destructive text-sm text-center"
                >
                  {errors.date}
                </motion.p>
              )}

            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue" className="flex items-center gap-2 justify-center">
                <MapPin className="w-4 h-4" />
                会場名
              </Label>
              <div className="relative" ref={venueInputRef}>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  onFocus={() => setShowVenueSuggestions(true)}
                  placeholder="会場名を入力"
                  className={`rounded-lg border-2 bg-muted/30 text-center ${errors.venue ? 'border-destructive' : ''}`}
                />
                <SuggestionsList
                  suggestions={filteredVenues}
                  onSelect={(value) => handleSuggestionSelect('venue', value)}
                  isVisible={showVenueSuggestions}
                />
              </div>
              {errors.venue && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-destructive text-sm text-center"
                >
                  {errors.venue}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-lg"
              >
                キャンセル
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button
                  type="submit"
                  className="w-full rounded-lg bg-primary text-primary-foreground"
                >
                  追加する
                </Button>
              </motion.div>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}