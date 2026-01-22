export enum ErrorCode {
    UNAUTHORIZED = 'UNAUTHORIZED',
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
    REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
    OTP_EXPIRED = 'OTP_EXPIRED',
    OTP_INVALID = 'OTP_INVALID',

    FORBIDDEN = 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
    ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',

    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_PHONE = 'INVALID_PHONE',
    INVALID_OTP = 'INVALID_OTP',
    INVALID_INPUT = 'INVALID_INPUT',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

    NOT_FOUND = 'NOT_FOUND',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    POST_NOT_FOUND = 'POST_NOT_FOUND',
    EVENT_NOT_FOUND = 'EVENT_NOT_FOUND',
    COMMENT_NOT_FOUND = 'COMMENT_NOT_FOUND',
    CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',

    CONFLICT = 'CONFLICT',
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    ALREADY_JOINED = 'ALREADY_JOINED',

    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    RATE_LIMITED = 'RATE_LIMITED',
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
    OTP_LIMIT_EXCEEDED = 'OTP_LIMIT_EXCEEDED',

    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    REDIS_ERROR = 'REDIS_ERROR',
    QUEUE_ERROR = 'QUEUE_ERROR',
    UPLOAD_ERROR = 'UPLOAD_ERROR',
    SMS_ERROR = 'SMS_ERROR',
    NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',

    BLOCKED_USER = 'BLOCKED_USER',
    ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
    CONTENT_REPORTED = 'CONTENT_REPORTED',
}

export const ErrorMessages: Record<ErrorCode, string> = {
    // Authentication errors
    [ErrorCode.UNAUTHORIZED]: 'Authentication required',
    [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
    [ErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired',
    [ErrorCode.REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
    [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired',
    [ErrorCode.OTP_EXPIRED]: 'OTP has expired',
    [ErrorCode.OTP_INVALID]: 'Invalid OTP',

    // Authorization errors
    [ErrorCode.FORBIDDEN]: 'Access forbidden',
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
    [ErrorCode.ACCOUNT_DISABLED]: 'Account has been disabled',

    // Validation errors
    [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
    [ErrorCode.INVALID_PHONE]: 'Invalid phone number',
    [ErrorCode.INVALID_OTP]: 'Invalid OTP',
    [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type',
    [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum limit',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',

    // Not found errors
    [ErrorCode.NOT_FOUND]: 'Resource not found',
    [ErrorCode.USER_NOT_FOUND]: 'User not found',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
    [ErrorCode.POST_NOT_FOUND]: 'Post not found',
    [ErrorCode.EVENT_NOT_FOUND]: 'Event not found',
    [ErrorCode.COMMENT_NOT_FOUND]: 'Comment not found',
    [ErrorCode.CONVERSATION_NOT_FOUND]: 'Conversation not found',

    // Conflict errors
    [ErrorCode.CONFLICT]: 'Resource conflict',
    [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
    [ErrorCode.DUPLICATE_ENTRY]: 'Duplicate entry',
    [ErrorCode.ALREADY_JOINED]: 'Already joined',

    // Rate limit errors
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later',
    [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
    [ErrorCode.OTP_LIMIT_EXCEEDED]: 'OTP request limit exceeded',

    // Internal errors
    [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
    [ErrorCode.DATABASE_ERROR]: 'Database error occurred',
    [ErrorCode.REDIS_ERROR]: 'Cache service error',
    [ErrorCode.QUEUE_ERROR]: 'Queue processing error',
    [ErrorCode.UPLOAD_ERROR]: 'File upload failed',
    [ErrorCode.SMS_ERROR]: 'SMS service error',
    [ErrorCode.NOTIFICATION_ERROR]: 'Notification service error',

    // Account status errors
    [ErrorCode.BLOCKED_USER]: 'User has been blocked',
    [ErrorCode.ACCOUNT_SUSPENDED]: 'Account has been suspended',
    [ErrorCode.CONTENT_REPORTED]: 'Content has been reported',
};
