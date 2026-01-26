import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
    env: string;
    port: number;
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    sms: {
        provider: string;
        msg91: {
            authKey: string;
            senderId: string;
            templateId: string;
        };
        twilio: {
            accountSid: string;
            authToken: string;
            phoneNumber: string;
        };
    };
    firebase: {
        projectId: string;
        privateKey: string;
        clientEmail: string;
    };
    upload: {
        dir: string;
        maxFileSizeMB: number;
    };
    defaultAdmin: {
        phone: string;
        name: string;
    };
    rateLimit: {
        otpPerPhone: number;
        otpPerIP: number;
        otpWindowMinutes: number;
    };
    app: {
        name: string;
        url: string;
    };
    otp: {
        useFixedOtp: boolean;
        fixedOtpValue: string;
    };
    platform: {
        strictMode: boolean;
    };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is required`);
    }
    return value;
};

const config: Config = {
    env: getEnvVar('NODE_ENV', 'development'),
    port: parseInt(getEnvVar('PORT', '5000'), 10),

    database: {
        url: getEnvVar('DATABASE_URL'),
    },

    redis: {
        url: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
    },

    jwt: {
        accessSecret: getEnvVar('JWT_ACCESS_SECRET'),
        refreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
        accessExpiresIn: getEnvVar('JWT_ACCESS_EXPIRES_IN', '15m'),
        refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '90d'),
    },

    sms: {
        provider: getEnvVar('SMS_PROVIDER', 'msg91'),
        msg91: {
            authKey: getEnvVar('MSG91_AUTH_KEY', ''),
            senderId: getEnvVar('MSG91_SENDER_ID', 'HOSLA'),
            templateId: getEnvVar('MSG91_TEMPLATE_ID', ''),
        },
        twilio: {
            accountSid: getEnvVar('TWILIO_ACCOUNT_SID', ''),
            authToken: getEnvVar('TWILIO_AUTH_TOKEN', ''),
            phoneNumber: getEnvVar('TWILIO_PHONE_NUMBER', ''),
        },
    },

    firebase: {
        projectId: getEnvVar('FIREBASE_PROJECT_ID', ''),
        privateKey: getEnvVar('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
        clientEmail: getEnvVar('FIREBASE_CLIENT_EMAIL', ''),
    },

    upload: {
        dir: getEnvVar('UPLOAD_DIR', './uploads'),
        maxFileSizeMB: parseInt(getEnvVar('MAX_FILE_SIZE_MB', '100'), 10),
    },

    defaultAdmin: {
        phone: getEnvVar('DEFAULT_ADMIN_PHONE', '+919999999999'),
        name: getEnvVar('DEFAULT_ADMIN_NAME', 'System Admin'),
    },

    rateLimit: {
        otpPerPhone: parseInt(getEnvVar('OTP_RATE_LIMIT_PER_PHONE', '3'), 10),
        otpPerIP: parseInt(getEnvVar('OTP_RATE_LIMIT_PER_IP', '10'), 10),
        otpWindowMinutes: parseInt(getEnvVar('OTP_RATE_LIMIT_WINDOW_MINUTES', '10'), 10),
    },

    app: {
        name: getEnvVar('APP_NAME', 'Hosla'),
        url: getEnvVar('APP_URL', 'https://hosla.in'),
    },

    otp: {
        useFixedOtp: getEnvVar('USE_FIXED_OTP', 'false') === 'true',
        fixedOtpValue: getEnvVar('FIXED_OTP_VALUE', '123456'),
    },

    platform: {
        strictMode: getEnvVar('PLATFORM_STRICT_MODE', 'false') === 'true',
    },
};

export default config;
