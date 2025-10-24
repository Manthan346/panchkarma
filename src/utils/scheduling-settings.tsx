/**
 * Scheduling Settings Service
 * Manages automated scheduling configuration
 */

export interface SchedulingSettings {
  defaultDuration: number; // in minutes
  notificationLeadTime: number; // in hours
  workingHoursStart: string; // HH:MM format
  workingHoursEnd: string; // HH:MM format
  bufferTime: number; // in minutes
  autoReminders: boolean;
  autoConfirmation: boolean;
}

const STORAGE_KEY = 'panchakarma_scheduling_settings';

const DEFAULT_SETTINGS: SchedulingSettings = {
  defaultDuration: 60,
  notificationLeadTime: 24,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  bufferTime: 15,
  autoReminders: true,
  autoConfirmation: true
};

class SchedulingSettingsService {
  /**
   * Get current scheduling settings
   */
  getSettings(): SchedulingSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load scheduling settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Save scheduling settings
   */
  saveSettings(settings: SchedulingSettings): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save scheduling settings:', error);
      return false;
    }
  }

  /**
   * Reset to default settings
   */
  resetSettings(): SchedulingSettings {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }

  /**
   * Get available time slots for a given date and optionally for a specific doctor
   * Takes into account working hours, buffer time, and existing appointments
   */
  getAvailableTimeSlots(
    date: string,
    existingSessions: Array<{ date: string; time: string; duration: number; doctor_id?: string; practitioner?: string }>,
    sessionDuration?: number,
    doctorId?: string
  ): string[] {
    const settings = this.getSettings();
    const duration = sessionDuration || settings.defaultDuration;
    const slots: string[] = [];

    // Parse working hours
    const [startHour, startMinute] = settings.workingHoursStart.split(':').map(Number);
    const [endHour, endMinute] = settings.workingHoursEnd.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    const endTimeInMinutes = endHour * 60 + endMinute;

    while (true) {
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const sessionEndTime = currentTimeInMinutes + duration;

      // Check if session would end after working hours
      if (sessionEndTime > endTimeInMinutes) {
        break;
      }

      const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Check if this slot conflicts with existing sessions
      const hasConflict = existingSessions.some(session => {
        if (session.date !== date) return false;

        // If filtering by doctor, only check sessions for this specific doctor
        if (doctorId) {
          const sessionMatchesDoctor = session.doctor_id === doctorId;
          if (!sessionMatchesDoctor) return false;
        }

        const [sessionHour, sessionMinute] = session.time.split(':').map(Number);
        const sessionStart = sessionHour * 60 + sessionMinute;
        const sessionEnd = sessionStart + session.duration;

        // Check for overlap
        return (
          (currentTimeInMinutes >= sessionStart && currentTimeInMinutes < sessionEnd) ||
          (sessionEndTime > sessionStart && sessionEndTime <= sessionEnd) ||
          (currentTimeInMinutes <= sessionStart && sessionEndTime >= sessionEnd)
        );
      });

      if (!hasConflict) {
        slots.push(timeSlot);
      }

      // Move to next slot (session duration + buffer time)
      const nextSlotMinutes = currentTimeInMinutes + duration + settings.bufferTime;
      currentHour = Math.floor(nextSlotMinutes / 60);
      currentMinute = nextSlotMinutes % 60;
    }

    return slots;
  }

  /**
   * Calculate notification send time based on appointment time and lead time setting
   */
  getNotificationTime(appointmentDate: string, appointmentTime: string): Date {
    const settings = this.getSettings();
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    // Subtract lead time hours
    const notificationTime = new Date(appointmentDateTime.getTime() - settings.notificationLeadTime * 60 * 60 * 1000);
    
    return notificationTime;
  }

  /**
   * Check if a notification should be sent now
   */
  shouldSendNotification(appointmentDate: string, appointmentTime: string): boolean {
    const notificationTime = this.getNotificationTime(appointmentDate, appointmentTime);
    const now = new Date();
    
    // Send if notification time has passed but appointment hasn't happened yet
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    return now >= notificationTime && now < appointmentDateTime;
  }

  /**
   * Get next available slot for a specific doctor (optional)
   */
  getNextAvailableSlot(
    startDate: Date,
    existingSessions: Array<{ date: string; time: string; duration: number; doctor_id?: string; practitioner?: string }>,
    sessionDuration?: number,
    doctorId?: string
  ): { date: string; time: string } | null {
    const maxDaysToCheck = 30; // Look ahead 30 days
    const settings = this.getSettings();
    const duration = sessionDuration || settings.defaultDuration;

    for (let dayOffset = 0; dayOffset < maxDaysToCheck; dayOffset++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      
      // Skip weekends if needed
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateString = checkDate.toISOString().split('T')[0];
      const availableSlots = this.getAvailableTimeSlots(dateString, existingSessions, duration, doctorId);

      if (availableSlots.length > 0) {
        return {
          date: dateString,
          time: availableSlots[0]
        };
      }
    }

    return null;
  }

  /**
   * Suggest optimal appointment times based on patient history and availability
   * Can filter by specific doctor
   */
  suggestAppointmentTimes(
    preferredDate: string,
    existingSessions: Array<{ date: string; time: string; duration: number; doctor_id?: string; practitioner?: string }>,
    sessionDuration?: number,
    doctorId?: string
  ): Array<{ date: string; time: string; score: number }> {
    const settings = this.getSettings();
    const duration = sessionDuration || settings.defaultDuration;
    
    const suggestions: Array<{ date: string; time: string; score: number }> = [];

    // Check preferred date
    const preferredSlots = this.getAvailableTimeSlots(preferredDate, existingSessions, duration, doctorId);
    preferredSlots.forEach(time => {
      // Score based on time of day (prefer morning and afternoon peak times)
      const [hour] = time.split(':').map(Number);
      let score = 100;
      
      // Morning slots (9-11 AM) get bonus
      if (hour >= 9 && hour <= 11) score += 20;
      
      // Afternoon slots (2-4 PM) get bonus
      if (hour >= 14 && hour <= 16) score += 15;
      
      // Avoid early morning and late afternoon
      if (hour < 9) score -= 10;
      if (hour > 16) score -= 10;

      suggestions.push({ date: preferredDate, time, score });
    });

    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(preferredDate);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateString = checkDate.toISOString().split('T')[0];
      const slots = this.getAvailableTimeSlots(dateString, existingSessions, duration, doctorId);

      slots.forEach(time => {
        const [hour] = time.split(':').map(Number);
        let score = 80 - (i * 5); // Reduce score for future dates
        
        if (hour >= 9 && hour <= 11) score += 15;
        if (hour >= 14 && hour <= 16) score += 10;

        suggestions.push({ date: dateString, time, score });
      });
    }

    // Sort by score (highest first) and return top 10
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  }
}

// Export singleton instance
export const schedulingSettings = new SchedulingSettingsService();
