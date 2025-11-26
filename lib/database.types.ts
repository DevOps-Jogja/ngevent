export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    role: 'participant' | 'organizer' | 'admin'
                    avatar_url: string | null
                    phone: string | null
                    institution: string | null
                    position: string | null
                    city: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    role?: 'participant' | 'organizer'
                    avatar_url?: string | null
                    phone?: string | null
                    institution?: string | null
                    position?: string | null
                    city?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    role?: 'participant' | 'organizer'
                    avatar_url?: string | null
                    phone?: string | null
                    institution?: string | null
                    position?: string | null
                    city?: string | null
                    created_at?: string
                }
            }
            events: {
                Row: {
                    id: string
                    organizer_id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string
                    location: string | null
                    image_url: string | null
                    capacity: number | null
                    status: 'draft' | 'published' | 'cancelled' | 'completed'
                    category: string | null
                    registration_fee: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organizer_id: string
                    title: string
                    description?: string | null
                    start_date: string
                    end_date: string
                    location?: string | null
                    image_url?: string | null
                    capacity?: number | null
                    status?: 'draft' | 'published' | 'cancelled' | 'completed'
                    category?: string | null
                    registration_fee?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organizer_id?: string
                    title?: string
                    description?: string | null
                    start_date?: string
                    end_date?: string
                    location?: string | null
                    image_url?: string | null
                    capacity?: number | null
                    status?: 'draft' | 'published' | 'cancelled' | 'completed'
                    category?: string | null
                    registration_fee?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            registrations: {
                Row: {
                    id: string
                    event_id: string
                    user_id: string
                    registration_data: Json | null
                    status: 'registered' | 'attended' | 'cancelled'
                    registered_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    user_id: string
                    registration_data?: Json | null
                    status?: 'registered' | 'attended' | 'cancelled'
                    registered_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    user_id?: string
                    registration_data?: Json | null
                    status?: 'registered' | 'attended' | 'cancelled'
                    registered_at?: string
                }
            }
            form_fields: {
                Row: {
                    id: string
                    event_id: string
                    field_name: string
                    field_type: string
                    is_required: boolean
                    options: Json | null
                    order_index: number
                }
                Insert: {
                    id?: string
                    event_id: string
                    field_name: string
                    field_type: string
                    is_required?: boolean
                    options?: Json | null
                    order_index: number
                }
                Update: {
                    id?: string
                    event_id?: string
                    field_name?: string
                    field_type?: string
                    is_required?: boolean
                    options?: Json | null
                    order_index?: number
                }
            }
            speakers: {
                Row: {
                    id: string
                    event_id: string
                    name: string
                    title: string | null
                    company: string | null
                    bio: string | null
                    photo_url: string | null
                    linkedin_url: string | null
                    twitter_url: string | null
                    website_url: string | null
                    order_index: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    name: string
                    title?: string | null
                    company?: string | null
                    bio?: string | null
                    photo_url?: string | null
                    linkedin_url?: string | null
                    twitter_url?: string | null
                    website_url?: string | null
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    name?: string
                    title?: string | null
                    company?: string | null
                    bio?: string | null
                    photo_url?: string | null
                    linkedin_url?: string | null
                    twitter_url?: string | null
                    website_url?: string | null
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    event_id: string | null
                    type: 'registration' | 'event_update' | 'reminder' | 'general' | 'payment'
                    title: string
                    message: string
                    read: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    event_id?: string | null
                    type: 'registration' | 'event_update' | 'reminder' | 'general' | 'payment'
                    title: string
                    message: string
                    read?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    event_id?: string | null
                    type?: 'registration' | 'event_update' | 'reminder' | 'general' | 'payment'
                    title?: string
                    message?: string
                    read?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            email_templates: {
                Row: {
                    id: string
                    template_type: 'welcome' | 'registration_confirmation' | 'event_reminder' | 'event_update'
                    subject: string
                    html_body: string
                    text_body: string | null
                    variables: Json | null
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    template_type: 'welcome' | 'registration_confirmation' | 'event_reminder' | 'event_update'
                    subject: string
                    html_body: string
                    text_body?: string | null
                    variables?: Json | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    template_type?: 'welcome' | 'registration_confirmation' | 'event_reminder' | 'event_update'
                    subject?: string
                    html_body?: string
                    text_body?: string | null
                    variables?: Json | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            email_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    email_type: string
                    recipient_email: string
                    subject: string
                    status: 'pending' | 'sent' | 'failed'
                    error_message: string | null
                    metadata: Json | null
                    sent_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    email_type: string
                    recipient_email: string
                    subject: string
                    status?: 'pending' | 'sent' | 'failed'
                    error_message?: string | null
                    metadata?: Json | null
                    sent_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    email_type?: string
                    recipient_email?: string
                    subject?: string
                    status?: 'pending' | 'sent' | 'failed'
                    error_message?: string | null
                    metadata?: Json | null
                    sent_at?: string | null
                    created_at?: string
                }
            }
        }
    }
}
