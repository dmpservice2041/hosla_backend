export const TAG_PRIORITIES: Record<string, number> = {
    'EMERGENCY': 100,
    'HEALTH': 80,
    'ANNOUNCEMENT': 60,
    'GENERAL': 40,
    'SOCIAL': 20,
    'DEFAULT': 10,
};

export const VALID_TAGS = ['EMERGENCY', 'HEALTH', 'ANNOUNCEMENT', 'GENERAL', 'SOCIAL', 'DEFAULT'] as const;

export const ROLE_PRIORITIES = {
    'ADMIN': 40,
    'STAFF': 30,
    'MEMBER': 20,
    'USER': 10,
};

export const getTagPriority = (tags: string[] = []): number => {
    if (!tags || tags.length === 0) return TAG_PRIORITIES.DEFAULT;

    return Math.max(...tags.map(tag =>
        TAG_PRIORITIES[tag.toUpperCase()] || TAG_PRIORITIES.DEFAULT
    ));
};
