export enum Platform {
    WEB = 'WEB',
    ANDROID = 'ANDROID',
    IOS = 'IOS',
}

export type PlatformValue = 'WEB' | 'ANDROID' | 'IOS';

export function normalizePlatform(platform: string | undefined | null): Platform {
    if (!platform) {
        return Platform.WEB;
    }

    const normalized = platform.toUpperCase().trim();

    switch (normalized) {
        case 'ANDROID':
            return Platform.ANDROID;
        case 'IOS':
            return Platform.IOS;
        case 'WEB':
            return Platform.WEB;
        default:
            return Platform.WEB;
    }
}

export function isValidPlatform(platform: string): boolean {
    const normalized = platform.toUpperCase().trim();
    return normalized === 'WEB' || normalized === 'ANDROID' || normalized === 'IOS';
}

export function isMobilePlatform(platform: Platform): boolean {
    return platform === Platform.ANDROID || platform === Platform.IOS;
}
