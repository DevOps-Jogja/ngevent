import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EventForm, { EventFormData, FormField, Speaker, CustomImage } from '../components/EventForm';
import apiClient from '../lib/axios';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [eventData, setEventData] = useState<Partial<EventFormData> | null>(null);
  const [initialFormFields, setInitialFormFields] = useState<FormField[]>([]);
  const [initialSpeakers, setInitialSpeakers] = useState<Speaker[]>([]);
  const [initialCustomImages, setInitialCustomImages] = useState<CustomImage[]>([]);

  useEffect(() => {
    document.title = 'Edit Event - NgEvent'
  }, [])

  useEffect(() => {
    loadEventData();
  }, [id]);

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';

    // Parse the UTC date from backend
    // Parse the UTC date from backend
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // Get local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadEventData = async () => {
    if (!id) return;

    try {
      setLoadingData(true);

      // Load event data
      const response = await apiClient.get(`/api/events/${id}`);
      const event = response.data;

      // Backend returns camelCase (Drizzle), older code used snake_case.
      const startRaw = event?.startDate ?? event?.start_date;
      const endRaw = event?.endDate ?? event?.end_date;
      const imageRaw = event?.imageUrl ?? event?.image_url ?? '';
      const feeRaw = event?.registrationFee ?? event?.registration_fee;
      const capacityRaw = event?.capacity;
      const bankAccountName = event?.bankAccountName ?? event?.bank_account_name ?? '';
      const bankAccountNumber = event?.bankAccountNumber ?? event?.bank_account_number ?? '';
      const bankName = event?.bankName ?? event?.bank_name ?? '';

      setEventData({
        title: event?.title ?? '',
        description: event?.description ?? '',
        start_date: formatDateForInput(startRaw),
        end_date: formatDateForInput(endRaw),
        location: event?.location ?? '',
        category: event?.category || '',
        capacity: capacityRaw !== null && capacityRaw !== undefined ? String(capacityRaw) : '',
        registration_fee: feeRaw !== null && feeRaw !== undefined ? String(feeRaw) : '0',
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        bank_name: bankName,
        status: event?.status ?? 'draft',
        image_url: imageRaw,
      });

      // Load form fields
      try {
        const fieldsResponse = await apiClient.get(`/api/form-fields/${id}`);
        if (fieldsResponse.data) {
          // API returns camelCase; form expects snake_case
          const normalizedFields = (Array.isArray(fieldsResponse.data) ? fieldsResponse.data : []).map((f: any) => ({
            field_name: f?.field_name ?? f?.fieldName ?? '',
            field_type: f?.field_type ?? f?.fieldType ?? 'text',
            is_required: f?.is_required ?? f?.isRequired ?? false,
            options: f?.options ?? null,
          }));
          setInitialFormFields(normalizedFields);
        }
      } catch (error) {
        console.log('No form fields found');
      }

      // Load speakers
      try {
        const speakersResponse = await apiClient.get(`/api/speakers/${id}`);
        if (speakersResponse.data) {
          // API returns camelCase; form expects snake_case
          const normalizedSpeakers = (Array.isArray(speakersResponse.data) ? speakersResponse.data : []).map((s: any) => ({
            name: s?.name ?? '',
            title: s?.title ?? '',
            company: s?.company ?? '',
            bio: s?.bio ?? '',
            photo_url: s?.photo_url ?? s?.photoUrl ?? '',
            linkedin_url: s?.linkedin_url ?? s?.linkedinUrl ?? '',
            twitter_url: s?.twitter_url ?? s?.twitterUrl ?? '',
            website_url: s?.website_url ?? s?.websiteUrl ?? '',
          }));
          setInitialSpeakers(normalizedSpeakers);
        }
      } catch (error) {
        console.log('No speakers found');
      }

      // Load custom images from localStorage or API
      const customImagesData = localStorage.getItem(`event_custom_images_${id}`);
      if (customImagesData) {
        setInitialCustomImages(JSON.parse(customImagesData));
      }

    } catch (error: any) {
      console.error('Error loading event:', error);
      alert('Failed to load event data');
      navigate('/dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (
    formData: EventFormData,
    imageFile?: File,
    formFields?: FormField[],
    speakers?: Speaker[],
    customImages?: CustomImage[]
  ) => {
    if (!id) return;

    setIsLoading(true);
    try {
      let imageUrl = formData.image_url;

      // Upload new image if provided
      if (imageFile) {
        const result = await uploadToCloudinary(imageFile, 'event-images');
        imageUrl = result.secure_url;
      }

      // Update event
      const eventData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        image_url: imageUrl,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : 0,
      };

      await apiClient.put(`/api/events/${id}`, eventData);

      // Update form fields - delete old and insert new
      if (formFields) {
        await apiClient.delete(`/api/form-fields/${id}`);

        if (formFields.length > 0) {
          const fieldsToInsert = formFields.map((field, index) => ({
            event_id: id,
            field_name: field.field_name,
            field_type: field.field_type,
            is_required: field.is_required,
            options: field.options,
            order_index: index,
          }));

          await apiClient.post('/api/form-fields', { fields: fieldsToInsert });
        }
      }

      // Update speakers - delete old and insert new
      if (speakers) {
        await apiClient.delete(`/api/speakers/${id}`);

        if (speakers.length > 0) {
          const speakersToInsert = speakers.map((speaker, index) => ({
            event_id: id,
            ...speaker,
            order_index: index,
          }));

          await apiClient.post('/api/speakers', { speakers: speakersToInsert });
        }
      }

      // Update custom images
      if (customImages) {
        if (customImages.length > 0) {
          localStorage.setItem(`event_custom_images_${id}`, JSON.stringify(customImages));
        } else {
          localStorage.removeItem(`event_custom_images_${id}`);
        }
      }

      // Show success message
      alert('Event updated successfully!');

      // Redirect to dashboard organizer tab
      navigate('/dashboard', { state: { tab: 'organizer' } });
    } catch (error: any) {
      console.error('Error updating event:', error);
      alert(error.response?.data?.message || 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return null;
  }

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
            Edit Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your event details
          </p>
        </div>

        {/* Form */}
        <EventForm
          initialData={eventData}
          initialFormFields={initialFormFields}
          initialSpeakers={initialSpeakers}
          initialCustomImages={initialCustomImages}
          onSubmit={handleSubmit}
          submitLabel="Update Event"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
