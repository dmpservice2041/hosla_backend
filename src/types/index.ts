import { UserRole } from './enums';

export interface PaginationQuery {
    page?: number;
    limit?: number;
}

export interface TokenPayload {
    userId: string;
    role: UserRole;
    type: 'access' | 'refresh';
}

export interface OtpData {
    otp: string;
    phone: string;
    attempts: number;
    createdAt: number;
}
