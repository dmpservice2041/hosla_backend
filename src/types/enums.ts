export enum UserRole {
    ADMIN = 'ADMIN',
    STAFF = 'STAFF',
    USER = 'USER',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export enum EventType {
    IN_PERSON = 'IN_PERSON',
    ONLINE = 'ONLINE',
}

export enum ParticipantStatus {
    GOING = 'GOING',
    MAYBE = 'MAYBE',
    NOT_GOING = 'NOT_GOING',
}

export enum ConversationType {
    DIRECT = 'DIRECT',
    GROUP = 'GROUP',
    COMMUNITY = 'COMMUNITY',
}

export enum MemberRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
}

export enum MessageStatus {
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
}

export enum ReportStatus {
    PENDING = 'PENDING',
    REVIEWED = 'REVIEWED',
    DISMISSED = 'DISMISSED',
    ACTION_TAKEN = 'ACTION_TAKEN',
}

export enum FontSize {
    SMALL = 'SMALL',
    MEDIUM = 'MEDIUM',
    LARGE = 'LARGE',
    EXTRA_LARGE = 'EXTRA_LARGE',
}
