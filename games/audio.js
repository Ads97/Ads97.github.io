/**
 * AudioManager - A centralized system for handling all game audio
 * 
 * This class provides a unified interface for working with audio in the game,
 * including background music and sound effects.
 */
class AudioManager {
    constructor() {
        // Music tracks
        this.tracks = {};
        
        // Sound effects
        this.soundEffects = {};
        
        // Current playing background music
        this.currentMusic = null;
        
        // Default settings
        this.defaultVolume = 0.6;
        this.defaultMusicVolume = 0.6;
        this.defaultSoundVolume = 0.8;
        this.isMuted = false;
        
        // Original playback rate for speed control
        this.originalRate = 1.0;
        
        // Bind event handlers
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._handleInteraction = this._handleInteraction.bind(this);
        
        // Initialize event listeners
        this._setupEventListeners();
    }
    
    /**
     * Initialize the audio manager with default tracks
     */
    init() {
        // Load default music tracks
        this.loadMusic('default', 'upbeat_background_score.mp3');
        this.loadMusic('sinister', 'sinister_background_score.mp3');
        
        // Load sound effects
        this.loadSound('fanfare', 'success-fanfare-trumpets.mp3', 0.8);
        
        // Start default music with autoplay handling
        this.playMusic('default');
    }
    
    /**
     * Load a music track
     * @param {string} id - Identifier for the track
     * @param {string} path - Path to the audio file
     * @param {number} volume - Volume level (0-1)
     * @returns {Audio} - The created audio element
     */
    loadMusic(id, path, volume = this.defaultMusicVolume) {
        const track = new Audio(path);
        track.loop = true;
        track.volume = volume;
        track.defaultPlaybackRate = 1.0;
        
        // Store in tracks collection
        this.tracks[id] = track;
        
        console.log(`Music track '${id}' loaded from ${path}`);
        return track;
    }
    
    /**
     * Load a sound effect
     * @param {string} id - Identifier for the sound
     * @param {string} path - Path to the audio file
     * @param {number} volume - Volume level (0-1)
     * @returns {Audio} - The created audio element
     */
    loadSound(id, path, volume = this.defaultSoundVolume) {
        const sound = new Audio(path);
        sound.loop = false;
        sound.volume = volume;
        
        // Store in sounds collection
        this.soundEffects[id] = sound;
        
        console.log(`Sound effect '${id}' loaded from ${path}`);
        return sound;
    }
    
    /**
     * Play a background music track
     * @param {string} id - ID of the track to play
     * @param {number} fadeTime - Time in ms to fade between tracks
     */
    playMusic(id, fadeTime = 300) {
        console.log(`Attempting to play music: ${id}`);
        
        // Get the requested track
        const track = this.tracks[id];
        if (!track) {
            console.error(`Music track '${id}' not found`);
            return;
        }
        
        // Stop current music if playing
        if (this.currentMusic) {
            console.log('Stopping current music');
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            
            // Remove from DOM if it was added
            if (this.currentMusic.parentNode) {
                this.currentMusic.parentNode.removeChild(this.currentMusic);
            }
        }
        
        // Remove any other audio elements that might be playing
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(element => {
            if (!element.paused) {
                console.log('Stopping additional audio element:', element.src);
                element.pause();
                element.currentTime = 0;
            }
        });
        
        // Set as current and play after short delay to ensure clean transition
        setTimeout(() => {
            this.currentMusic = track;
            
            // Explicitly reset playback rate to 1.0 when starting a new track
            track.playbackRate = 1.0;
            this.originalRate = 1.0;
            console.log('Explicitly reset playback rate to 1.0 for new track');
            
            // Add to DOM to ensure it stays in memory
            document.body.appendChild(track);
            
            // Play with autoplay handling
            if (!this.isMuted) {
                const playPromise = track.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => console.log(`Music '${id}' playing successfully`))
                        .catch(error => {
                            console.error('Error playing music:', error);
                            // Browser likely blocking autoplay, wait for user interaction
                            this._setupAutoplayFallback();
                        });
                }
            }
        }, fadeTime);
    }
    
    /**
     * Play a sound effect once
     * @param {string} id - ID of the sound to play
     * @param {number} volume - Optional volume override
     */
    playSound(id, volume = null) {
        const sound = this.soundEffects[id];
        if (!sound) {
            console.error(`Sound effect '${id}' not found`);
            return;
        }
        
        // Clone the sound to allow overlapping playback
        const soundInstance = sound.cloneNode();
        if (volume !== null) {
            soundInstance.volume = volume;
        }
        
        if (!this.isMuted) {
            soundInstance.play().catch(err => {
                console.error(`Error playing sound '${id}':`, err);
            });
        }
    }
    
    /**
     * Stop all audio
     */
    stopAll() {
        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        
        // Stop all tracks
        Object.values(this.tracks).forEach(track => {
            track.pause();
            track.currentTime = 0;
        });
        
        // Stop all sound effects
        Object.values(this.soundEffects).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
    
    /**
     * Mute all audio
     */
    mute() {
        this.isMuted = true;
        
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }
    
    /**
     * Unmute audio
     */
    unmute() {
        this.isMuted = false;
        
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.play().catch(err => console.error('Error resuming music:', err));
        }
    }
    
    /**
     * Change the playback speed of the current music
     * @param {number} rate - The new playback rate
     * @returns {boolean} - Success status
     */
    speedUp(rate) {
        if (!this.currentMusic) {
            return false;
        }
        
        // Store original rate if not already stored
        if (this.originalRate === 1.0) {
            this.originalRate = this.currentMusic.playbackRate || 1.0;
        }
        
        try {
            // Try direct playbackRate change
            this.currentMusic.playbackRate = rate;
            console.log(`Changed music speed to ${rate}x`);
            return true;
        } catch (e) {
            console.error('Error changing playback rate:', e);
            return false;
        }
    }
    
    /**
     * Reset the playback speed to the original rate
     * @returns {boolean} - Success status
     */
    resetSpeed() {
        if (!this.currentMusic) {
            return false;
        }
        
        try {
            this.currentMusic.playbackRate = this.originalRate;
            console.log(`Reset music speed to ${this.originalRate}x`);
            return true;
        } catch (e) {
            console.error('Error resetting playback rate:', e);
            return false;
        }
    }
    
    /**
     * Get the current playback rate
     * @returns {number} - Current playback rate
     */
    getCurrentRate() {
        if (this.currentMusic) {
            return this.currentMusic.playbackRate;
        }
        return this.originalRate;
    }
    
    /**
     * Set up event listeners for page visibility and browser features
     * @private
     */
    _setupEventListeners() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
    }
    
    /**
     * Set up fallback for autoplay restrictions
     * @private
     */
    _setupAutoplayFallback() {
        console.log('Setting up autoplay fallback handlers');
        
        // Add event listeners to start audio on user interaction
        document.addEventListener('touchstart', this._handleInteraction, { once: true });
        document.addEventListener('touchend', this._handleInteraction, { once: true });
        document.addEventListener('click', this._handleInteraction, { once: true });
        document.addEventListener('keydown', this._handleInteraction, { once: true });
    }
    
    /**
     * Handle page visibility changes
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden (tab switched, phone locked, etc.)
            if (this.currentMusic && !this.currentMusic.paused) {
                this.currentMusic.pause();
                console.log('Music paused - page visibility changed');
            }
        } else {
            // Page is visible again - only resume if music was previously playing
            if (this.currentMusic && !this.isMuted) {
                this.currentMusic.play().catch(e => console.log('Could not resume audio:', e));
                console.log('Music resumed - page visible again');
            }
        }
    }
    
    /**
     * Handle user interaction to start audio
     * @private
     */
    _handleInteraction() {
        console.log('User interaction detected, trying to play audio');
        
        if (this.currentMusic && !this.isMuted) {
            this.currentMusic.play()
                .then(() => console.log('Audio started on user interaction'))
                .catch(e => console.error('Still could not play audio:', e));
        }
        
        // Remove all interaction listeners
        document.removeEventListener('touchstart', this._handleInteraction);
        document.removeEventListener('touchend', this._handleInteraction);
        document.removeEventListener('click', this._handleInteraction);
        document.removeEventListener('keydown', this._handleInteraction);
    }
}

// Create global instance
window.audioManager = new AudioManager();

// Export audio controller for backward compatibility
window.audioController = {
    speedUp: function(rate) {
        return window.audioManager.speedUp(rate);
    },
    reset: function() {
        return window.audioManager.resetSpeed();
    },
    getCurrentRate: function() {
        return window.audioManager.getCurrentRate();
    }
};
