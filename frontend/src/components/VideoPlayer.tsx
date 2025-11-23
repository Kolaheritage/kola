import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoPlayer.css';

/**
 * VideoPlayer Component Props
 */
interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onNextVideo?: () => void;
  hasNextVideo?: boolean;
}

/**
 * Playback speed options
 */
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/**
 * VideoPlayer Component
 * HER-41: Custom Video Player with Controls
 * Features: Play/pause, volume, progress seeking, fullscreen, speed, keyboard shortcuts
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  autoPlay = false,
  onEnded,
  onNextVideo,
  hasNextVideo = false,
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);

  // Volume state
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(1);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Touch state
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [showDoubleTapFeedback, setShowDoubleTapFeedback] = useState<'left' | 'right' | null>(null);

  // Timers
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  /**
   * Format time in MM:SS or HH:MM:SS
   */
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = previousVolume || 0.5;
      setVolume(previousVolume || 0.5);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume, previousVolume]);

  /**
   * Handle volume change
   */
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    videoRef.current.volume = clampedVolume;
    setVolume(clampedVolume);

    if (clampedVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  }, [isMuted]);

  /**
   * Seek to position
   */
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;

    const clampedTime = Math.max(0, Math.min(duration, time));
    videoRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, [duration]);

  /**
   * Skip forward/backward
   */
  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    seekTo(currentTime + seconds);
  }, [currentTime, seekTo]);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  /**
   * Change playback speed
   */
  const changePlaybackSpeed = useCallback((speed: number) => {
    if (!videoRef.current) return;

    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  /**
   * Handle progress bar click/drag
   */
  const handleProgressInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = (clientX - rect.left) / rect.width;
    const time = percent * duration;

    seekTo(time);
  }, [duration, seekTo]);

  /**
   * Show controls temporarily
   */
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying && !showSpeedMenu && !showVolumeSlider) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, showSpeedMenu, showVolumeSlider]);

  /**
   * Handle double tap for seeking (mobile)
   */
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const touch = e.touches[0] || e.changedTouches[0];
    const containerWidth = containerRef.current?.clientWidth || 0;
    const tapX = touch.clientX;
    const isLeftSide = tapX < containerWidth / 2;

    if (now - lastTapRef.current.time < 300) {
      // Double tap detected
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }

      if (isLeftSide) {
        skip(-10);
        setShowDoubleTapFeedback('left');
      } else {
        skip(10);
        setShowDoubleTapFeedback('right');
      }

      setTimeout(() => setShowDoubleTapFeedback(null), 500);
    }

    lastTapRef.current = { time: now, x: tapX };
  }, [skip]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if video player is focused or in fullscreen
      if (!containerRef.current?.contains(document.activeElement) && !isFullscreen) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          seekTo(duration * (parseInt(e.key) / 10));
          break;
        case ',':
          e.preventDefault();
          if (videoRef.current?.paused) {
            seekTo(currentTime - 1/30); // Previous frame (assuming 30fps)
          }
          break;
        case '.':
          e.preventDefault();
          if (videoRef.current?.paused) {
            seekTo(currentTime + 1/30); // Next frame
          }
          break;
        case '<':
          e.preventDefault();
          const slowerIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed) - 1;
          if (slowerIndex >= 0) {
            changePlaybackSpeed(PLAYBACK_SPEEDS[slowerIndex]);
          }
          break;
        case '>':
          e.preventDefault();
          const fasterIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed) + 1;
          if (fasterIndex < PLAYBACK_SPEEDS.length) {
            changePlaybackSpeed(PLAYBACK_SPEEDS[fasterIndex]);
          }
          break;
        default:
          break;
      }

      showControlsTemporarily();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFullscreen,
    togglePlay,
    skip,
    handleVolumeChange,
    volume,
    toggleMute,
    toggleFullscreen,
    seekTo,
    duration,
    currentTime,
    playbackSpeed,
    changePlaybackSpeed,
    showControlsTemporarily,
  ]);

  /**
   * Handle fullscreen change
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * Video event handlers
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleVolumeChangeEvent = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => setError('Failed to load video');
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChangeEvent);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChangeEvent);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  /**
   * Auto-hide controls cleanup
   */
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Close menus when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSpeedMenu(false);
      setShowVolumeSlider(false);
    };

    if (showSpeedMenu || showVolumeSlider) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSpeedMenu, showVolumeSlider]);

  // Progress percentage
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  // Volume icon based on level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>
        </svg>
      );
    }
    if (volume < 0.5) {
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" fill="currentColor"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
      </svg>
    );
  };

  if (error) {
    return (
      <div className="video-player video-player-error" ref={containerRef}>
        <div className="video-error-content">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`video-player ${isFullscreen ? 'fullscreen' : ''} ${showControls ? 'controls-visible' : ''}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleDoubleTap}
      tabIndex={0}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onClick={togglePlay}
        playsInline
        className="video-element"
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="video-loading">
          <div className="video-spinner"></div>
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <button className="video-play-overlay" onClick={togglePlay} aria-label="Play">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
          </svg>
        </button>
      )}

      {/* Double tap feedback */}
      {showDoubleTapFeedback && (
        <div className={`double-tap-feedback ${showDoubleTapFeedback}`}>
          <div className="double-tap-icon">
            {showDoubleTapFeedback === 'left' ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" fill="currentColor"/>
                </svg>
                <span>10s</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="currentColor"/>
                </svg>
                <span>10s</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="video-progress"
          onClick={handleProgressInteraction}
          onMouseDown={() => setIsSeeking(true)}
          onMouseUp={() => setIsSeeking(false)}
          onMouseLeave={() => setIsSeeking(false)}
          onTouchStart={() => setIsSeeking(true)}
          onTouchEnd={() => setIsSeeking(false)}
          onTouchMove={(e) => isSeeking && handleProgressInteraction(e)}
        >
          <div className="progress-bar">
            <div className="progress-buffered" style={{ width: `${bufferedPercent}%` }} />
            <div className="progress-played" style={{ width: `${progressPercent}%` }}>
              <div className="progress-handle" />
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="video-controls-row">
          {/* Left controls */}
          <div className="controls-left">
            {/* Play/Pause */}
            <button className="control-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
                </svg>
              )}
            </button>

            {/* Skip backward */}
            <button className="control-btn" onClick={() => skip(-10)} aria-label="Rewind 10 seconds">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" fill="currentColor"/>
              </svg>
            </button>

            {/* Skip forward */}
            <button className="control-btn" onClick={() => skip(10)} aria-label="Forward 10 seconds">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="currentColor"/>
              </svg>
            </button>

            {/* Next video (if available) */}
            {hasNextVideo && onNextVideo && (
              <button className="control-btn" onClick={onNextVideo} aria-label="Next video">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/>
                </svg>
              </button>
            )}

            {/* Volume control */}
            <div className="volume-control">
              <button
                className="control-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                onMouseEnter={() => setShowVolumeSlider(true)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {getVolumeIcon()}
              </button>

              <div
                className={`volume-slider-container ${showVolumeSlider ? 'visible' : ''}`}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider"
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Time display */}
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="time-separator">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="controls-right">
            {/* Playback speed */}
            <div className="speed-control">
              <button
                className="control-btn speed-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu(!showSpeedMenu);
                }}
                aria-label="Playback speed"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="speed-menu" onClick={(e) => e.stopPropagation()}>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => changePlaybackSpeed(speed)}
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button className="control-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Title overlay (in fullscreen) */}
      {isFullscreen && title && showControls && (
        <div className="video-title-overlay">
          <h3>{title}</h3>
        </div>
      )}

      {/* Keyboard shortcuts hint (shows on focus) */}
      <div className="keyboard-hints" aria-hidden="true">
        <span>Space/K: Play/Pause</span>
        <span>J/L: -10s/+10s</span>
        <span>M: Mute</span>
        <span>F: Fullscreen</span>
      </div>
    </div>
  );
};

export default VideoPlayer;
