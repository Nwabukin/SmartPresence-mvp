/**
 * Notification Service
 * 
 * Handles creation of notifications for various events in the SmartPresence system.
 * This service provides methods to create notifications for students when relevant
 * events occur (session creation, attendance marking, etc.).
 */

const db = require('../db');

class NotificationService {
  /**
   * Create a notification for a user
   * @param {Object} notificationData - Notification data
   * @param {number} notificationData.user_id - User ID to notify
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {number} [notificationData.related_session_id] - Related session ID
   * @param {number} [notificationData.related_class_id] - Related class ID
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(notificationData) {
    const { user_id, type, title, message, related_session_id, related_class_id } = notificationData;
    
    try {
      const result = await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_session_id, related_class_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING notification_id, user_id, type, title, message, is_read, related_session_id, related_class_id, created_at`,
        [user_id, type, title, message, related_session_id || null, related_class_id || null]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for all students enrolled in a class
   * @param {number} class_id - Class ID
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} [related_session_id] - Related session ID
   * @returns {Promise<Array>} Array of created notifications
   */
  static async createNotificationsForClass(class_id, type, title, message, related_session_id = null) {
    try {
      // Get all enrolled students for the class
      const enrolledStudents = await db.query(
        'SELECT student_id FROM enrollments WHERE class_id = $1',
        [class_id]
      );

      if (enrolledStudents.rows.length === 0) {
        return [];
      }

      // Create notifications for each student
      const notifications = [];
      for (const enrollment of enrolledStudents.rows) {
        const notification = await this.createNotification({
          user_id: enrollment.student_id,
          type,
          title,
          message,
          related_session_id,
          related_class_id: class_id
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating notifications for class:', error);
      throw error;
    }
  }

  /**
   * Create session reminder notifications for all enrolled students
   * @param {number} session_id - Session ID
   * @param {number} class_id - Class ID
   * @param {string} class_name - Class name
   * @param {Date} start_time - Session start time
   * @returns {Promise<Array>} Array of created notifications
   */
  static async createSessionReminderNotifications(session_id, class_id, class_name, start_time) {
    const title = 'Session Reminder';
    const message = `Your ${class_name} session is starting soon at ${new Date(start_time).toLocaleString()}. Don't forget to mark your attendance!`;
    
    return await this.createNotificationsForClass(
      class_id,
      'session_reminder',
      title,
      message,
      session_id
    );
  }

  /**
   * Create attendance confirmation notification for a student
   * @param {number} student_id - Student ID
   * @param {number} session_id - Session ID
   * @param {number} class_id - Class ID
   * @param {string} class_name - Class name
   * @returns {Promise<Object>} Created notification
   */
  static async createAttendanceConfirmationNotification(student_id, session_id, class_id, class_name) {
    const title = 'Attendance Confirmed';
    const message = `Your attendance has been successfully marked for ${class_name}.`;
    
    return await this.createNotification({
      user_id: student_id,
      type: 'attendance_confirmed',
      title,
      message,
      related_session_id: session_id,
      related_class_id: class_id
    });
  }

  /**
   * Create session cancelled notifications for all enrolled students
   * @param {number} session_id - Session ID
   * @param {number} class_id - Class ID
   * @param {string} class_name - Class name
   * @param {Date} start_time - Original session start time
   * @returns {Promise<Array>} Array of created notifications
   */
  static async createSessionCancelledNotifications(session_id, class_id, class_name, start_time) {
    const title = 'Session Cancelled';
    const message = `Your ${class_name} session scheduled for ${new Date(start_time).toLocaleString()} has been cancelled.`;
    
    return await this.createNotificationsForClass(
      class_id,
      'session_cancelled',
      title,
      message,
      session_id
    );
  }

  /**
   * Create class enrollment notification for a student
   * @param {number} student_id - Student ID
   * @param {number} class_id - Class ID
   * @param {string} class_name - Class name
   * @returns {Promise<Object>} Created notification
   */
  static async createClassEnrollmentNotification(student_id, class_id, class_name) {
    const title = 'Class Enrollment';
    const message = `You have been enrolled in ${class_name}. Check your sessions and mark attendance when classes begin.`;
    
    return await this.createNotification({
      user_id: student_id,
      type: 'class_enrolled',
      title,
      message,
      related_class_id: class_id
    });
  }
}

module.exports = NotificationService;
