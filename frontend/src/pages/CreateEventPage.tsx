import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import EventForm, { EventFormData, FormField, Speaker, CustomImage } from '../components/EventForm';
import apiClient from '../lib/axios';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Buat Event Baru - NgEvent'
  }, [])

  const handleSubmit = async (
    formData: EventFormData,
    imageFile?: File,
    formFields?: FormField[],
    speakers?: Speaker[],
    customImages?: CustomImage[]
  ) => {
    setIsLoading(true);
    try {
      let imageUrl = formData.image_url;

      // Upload image if provided
      if (imageFile) {
        const result = await uploadToCloudinary(imageFile, 'event-images');
        imageUrl = result.secure_url;
      }

      // Create event
      const eventData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        image_url: imageUrl,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : 0,
      };

      console.log('Sending event data:', eventData);

      const eventResponse = await apiClient.post('/api/events', eventData);
      const eventId = eventResponse.data.id;

      // Insert form fields if any
      if (formFields && formFields.length > 0) {
        const fieldsToInsert = formFields.map((field, index) => ({
          event_id: eventId,
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required,
          options: field.options,
          order_index: index,
        }));

        await apiClient.post('/api/form-fields', { fields: fieldsToInsert });
      }

      // Insert speakers if any
      if (speakers && speakers.length > 0) {
        const speakersToInsert = speakers.map((speaker, index) => ({
          event_id: eventId,
          ...speaker,
          order_index: index,
        }));

        await apiClient.post('/api/speakers', { speakers: speakersToInsert });
      }

      // Store custom images (you might want to upload these to your server)
      if (customImages && customImages.length > 0) {
        // For now, store in localStorage or send to API
        // In production, upload images and store in database
        localStorage.setItem(`event_custom_images_${eventId}`, JSON.stringify(customImages));
      }

      // Show success message
      alert('Event created successfully!');

      // Invalidate and refetch events query
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });

      // Redirect to dashboard organizer tab
      navigate('/dashboard', { state: { tab: 'organizer' } });
    } catch (error: any) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary py-8 pt-24">
      <div className="mx-auto w-full max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in the details below to create your event
          </p>
        </div>

        {/* Form */}
        <EventForm
          onSubmit={handleSubmit}
          submitLabel="Create Event"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
