// Shared application types

export interface SpeakerLite {
    id: string;
    name: string;
    photo_url: string | null;
}

export interface UpcomingEvent {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    location: string | null;
    category: string | null;
    capacity: number | null;
    image_url: string | null;
    speakers?: SpeakerLite[]; // relational embed optional
}

export type CategoryCounts = Record<string, number>;
