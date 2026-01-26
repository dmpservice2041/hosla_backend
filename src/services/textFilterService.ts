import prisma from '../config/database';
import { FilterSeverity, PostStatus } from '@prisma/client';

interface FilterResult {
    isAllowed: boolean;
    status: PostStatus;
    matchedWord?: string;
    description?: string;
}

export class TextFilterService {
    static async checkContent(text: string): Promise<FilterResult> {
        if (!text) return { isAllowed: true, status: PostStatus.PUBLISHED };

        const blockedWords = await prisma.blockedWord.findMany(); // TODO: Add caching for performance
        const content = text.toLowerCase();

        for (const block of blockedWords) {
            const word = block.word.toLowerCase();

            // Simple match (can be enhanced with regex)
            if (content.includes(word)) {
                if (block.severity === FilterSeverity.HIGH) {
                    return {
                        isAllowed: false,
                        status: PostStatus.DELETED, // Or just reject request
                        matchedWord: block.word,
                        description: 'Content contains prohibited words'
                    };
                }

                if (block.severity === FilterSeverity.MEDIUM) {
                    return {
                        isAllowed: true,
                        status: PostStatus.PENDING_REVIEW,
                        matchedWord: block.word,
                        description: 'Content requires moderation review'
                    };
                }

                // LOW severity -> Allow (Status PUBLISHED)
            }
        }

        return { isAllowed: true, status: PostStatus.PUBLISHED };
    }
}
