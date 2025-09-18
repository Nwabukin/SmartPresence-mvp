const Joi = require('joi');

// Common validation patterns
const commonPatterns = {
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(100).required(),
  name: Joi.string().min(1).max(100).trim().required(),
  optionalName: Joi.string().min(1).max(100).trim().allow(''),
  optionalLongName: Joi.string().min(1).max(150).trim().allow(''),
  phone: Joi.string().max(50).allow('', null),
  id: Joi.number().integer().positive().required(),
  optionalId: Joi.number().integer().positive().allow(null),
  timestamp: Joi.date().iso().required(),
  role: Joi.string().valid('admin', 'teacher', 'student').required(),
  attendanceStatus: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
};

// User validation schemas
const userSchemas = {
  create: Joi.object({
    email: commonPatterns.email,
    password: commonPatterns.password,
    firstName: commonPatterns.name,
    lastName: commonPatterns.name,
    role: commonPatterns.role,
    profileStudent: Joi.when('role', {
      is: 'student',
      then: Joi.object({
        matricNo: Joi.string().min(1).max(100).trim().required(),
        department: commonPatterns.name,
        course: commonPatterns.name,
        level: Joi.string().min(1).max(50).trim().required(),
        phone: commonPatterns.phone,
      }).required(),
      otherwise: Joi.forbidden(),
    }),
    profileTeacher: Joi.when('role', {
      is: 'teacher',
      then: Joi.object({
        lecturerNo: Joi.string().min(1).max(100).trim().required(),
        department: commonPatterns.name,
        faculty: commonPatterns.optionalLongName.required(),
        office: commonPatterns.optionalName,
        phone: commonPatterns.phone,
      }).required(),
      otherwise: Joi.forbidden(),
    }),
  }),

  update: Joi.object({
    firstName: commonPatterns.optionalName,
    lastName: commonPatterns.optionalName,
    role: commonPatterns.role,
    profileStudent: Joi.object({
      matricNo: Joi.string().min(1).max(100).trim(),
      department: commonPatterns.optionalName,
      course: commonPatterns.optionalName,
      level: Joi.string().min(1).max(50).trim(),
      phone: commonPatterns.phone,
    }).optional(),
    profileTeacher: Joi.object({
      lecturerNo: Joi.string().min(1).max(100).trim(),
      department: commonPatterns.optionalName,
      faculty: commonPatterns.optionalLongName,
      office: commonPatterns.optionalName,
      phone: commonPatterns.phone,
    }).optional(),
  }).min(1), // At least one field must be provided

  getById: Joi.object({
    id: commonPatterns.id,
  }),
};

// Room validation schemas
const roomSchemas = {
  create: Joi.object({
    name: commonPatterns.name,
    wifi_ssid: Joi.string().min(1).max(100).trim().required(),
    bluetooth_beacon_id: Joi.string().max(100).trim().allow('', null),
  }),

  update: Joi.object({
    name: commonPatterns.optionalName,
    wifi_ssid: Joi.string().min(1).max(100).trim(),
    bluetooth_beacon_id: Joi.string().max(100).trim().allow('', null),
  }).min(1),

  getById: Joi.object({
    id: commonPatterns.id,
  }),
};

// Class validation schemas
const classSchemas = {
  create: Joi.object({
    name: commonPatterns.name,
    course_code: Joi.string().min(1).max(50).trim().required(),
    description: Joi.string().max(500).trim().allow('', null),
  }),

  update: Joi.object({
    name: commonPatterns.optionalName,
    course_code: Joi.string().min(1).max(50).trim(),
    description: Joi.string().max(500).trim().allow('', null),
  }).min(1),

  getById: Joi.object({
    id: commonPatterns.id,
  }),
};

// Session validation schemas
const sessionSchemas = {
  create: Joi.object({
    class_id: commonPatterns.id,
    room_id: commonPatterns.id,
    start_time: commonPatterns.timestamp,
    end_time: commonPatterns.timestamp,
  }).custom((value, helpers) => {
    if (new Date(value.end_time) <= new Date(value.start_time)) {
      return helpers.error('custom.endTimeAfterStartTime');
    }
    return value;
  }),

  update: Joi.object({
    class_id: commonPatterns.id,
    room_id: commonPatterns.id,
    start_time: commonPatterns.timestamp,
    end_time: commonPatterns.timestamp,
  }).min(1).custom((value, helpers) => {
    if (value.start_time && value.end_time && new Date(value.end_time) <= new Date(value.start_time)) {
      return helpers.error('custom.endTimeAfterStartTime');
    }
    return value;
  }),

  getById: Joi.object({
    id: commonPatterns.id,
  }),

  getAttendance: Joi.object({
    sessionId: commonPatterns.id,
  }),
};

// Attendance validation schemas
const attendanceSchemas = {
  update: Joi.object({
    status: commonPatterns.attendanceStatus,
  }),

  mark: Joi.object({
    class_id: commonPatterns.id,
    session_id: commonPatterns.id,
    wifi_ssid: Joi.string().min(1).max(100).trim().required(),
    bluetooth_beacon_id: Joi.string().max(100).trim().allow('', null),
  }),

  getByRecordId: Joi.object({
    recordId: commonPatterns.id,
  }),
};

// Auth validation schemas
const authSchemas = {
  login: Joi.object({
    email: commonPatterns.email,
    password: commonPatterns.password,
  }),
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      // Handle custom validation errors
      const customErrors = error.details.filter(detail => detail.type === 'custom');
      if (customErrors.length > 0) {
        customErrors.forEach(customError => {
          if (customError.message === 'custom.endTimeAfterStartTime') {
            errorDetails.push({
              field: 'end_time',
              message: 'End time must be after start time',
              value: customError.context?.value,
            });
          }
        });
      }

      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails,
      });
    }

    // Replace the original property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Note: Global default messages are not supported in this Joi version.
// Customize messages per-schema if needed using .messages({ ... }).

module.exports = {
  validate,
  schemas: {
    user: userSchemas,
    room: roomSchemas,
    class: classSchemas,
    session: sessionSchemas,
    attendance: attendanceSchemas,
    auth: authSchemas,
  },
};
