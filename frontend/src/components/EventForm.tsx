import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Upload, X, Plus, Trash2 } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';

export type EventFormData = {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
  capacity: string;
  registration_fee: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  status: 'draft' | 'published' | 'cancelled';
  image_url?: string;
};

export type FormField = {
  field_name: string;
  field_type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'file';
  is_required: boolean;
  options: string | null;
};

export type Speaker = {
  name: string;
  title: string;
  company: string;
  bio: string;
  photo_url: string;
  linkedin_url: string;
  twitter_url: string;
  website_url: string;
};

export type CustomImage = {
  title: string;
  description: string;
  url: string;
};

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  initialFormFields?: FormField[];
  initialSpeakers?: Speaker[];
  initialCustomImages?: CustomImage[];
  onSubmit: (data: EventFormData, imageFile?: File, formFields?: FormField[], speakers?: Speaker[], customImages?: CustomImage[]) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

const CATEGORIES = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Other' },
];

export default function EventForm({
  initialData,
  initialFormFields = [],
  initialSpeakers = [],
  initialCustomImages = [],
  onSubmit,
  submitLabel = 'Create Event',
  isLoading = false
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    location: initialData?.location || '',
    category: initialData?.category || '',
    capacity: initialData?.capacity || '',
    registration_fee: initialData?.registration_fee || '0',
    bank_account_name: initialData?.bank_account_name || '',
    bank_account_number: initialData?.bank_account_number || '',
    bank_name: initialData?.bank_name || '',
    status: initialData?.status || 'draft',
    image_url: initialData?.image_url || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url || '');
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'registration' | 'speakers' | 'images'>('basic');

  // Custom form fields
  const [formFields, setFormFields] = useState<FormField[]>(initialFormFields);

  // Speakers
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);

  // Custom images
  const [customImages, setCustomImages] = useState<CustomImage[]>(initialCustomImages);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string>('');
  const [customImageTitle, setCustomImageTitle] = useState('');
  const [customImageDesc, setCustomImageDesc] = useState('');
  const [isUploadingCustomImage, setIsUploadingCustomImage] = useState(false);

  // Auto-generate payment proof field when registration fee is set
  useEffect(() => {
    const hasFee = formData.registration_fee && parseFloat(formData.registration_fee) > 0;
    const hasPaymentProofField = formFields.some(field =>
      field.field_name.toLowerCase().includes('bukti pembayaran') ||
      field.field_name.toLowerCase().includes('payment proof')
    );

    if (hasFee && !hasPaymentProofField) {
      setFormFields(prev => [
        ...prev,
        {
          field_name: 'Bukti Pembayaran',
          field_type: 'file',
          is_required: true,
          options: null,
        },
      ]);
    } else if (!hasFee && hasPaymentProofField) {
      setFormFields(prev => prev.filter(field =>
        !field.field_name.toLowerCase().includes('bukti pembayaran') &&
        !field.field_name.toLowerCase().includes('payment proof')
      ));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.registration_fee]); // Only depend on registration_fee, not formFields

  // Form field management
  const addFormField = () => {
    setFormFields([
      ...formFields,
      {
        field_name: '',
        field_type: 'text',
        is_required: false,
        options: null,
      },
    ]);
  };

  const updateFormField = (index: number, key: keyof FormField, value: any) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], [key]: value };
    setFormFields(updated);
  };

  const removeFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Speaker management
  const addSpeaker = () => {
    setSpeakers([
      ...speakers,
      {
        name: '',
        title: '',
        company: '',
        bio: '',
        photo_url: '',
        linkedin_url: '',
        twitter_url: '',
        website_url: '',
      },
    ]);
  };

  const updateSpeaker = (index: number, key: keyof Speaker, value: string) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [key]: value };
    setSpeakers(updated);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  // Custom image management
  const handleCustomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCustomImage = async () => {
    if (!customImageFile || !customImageTitle) {
      alert('Please add an image and title');
      return;
    }

    setIsUploadingCustomImage(true);
    try {
      const result = await uploadToCloudinary(customImageFile, 'event-images');
      const uploadedUrl = result.secure_url;

      setCustomImages([
        ...customImages,
        {
          title: customImageTitle,
          description: customImageDesc,
          url: uploadedUrl,
        },
      ]);

      // Reset custom image form
      setCustomImageFile(null);
      setCustomImagePreview('');
      setCustomImageTitle('');
      setCustomImageDesc('');
    } catch (error: any) {
      console.error('Error uploading custom image:', error);

      // More detailed error messages
      let errorMessage = 'Failed to upload image';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Check for specific errors
      if (errorMessage.includes('Forbidden') || errorMessage.includes('organizer')) {
        errorMessage = 'You need organizer or admin role to upload event images. Please contact administrator.';
      } else if (errorMessage.includes('size')) {
        errorMessage = 'Image file is too large. Maximum size is 10MB.';
      } else if (errorMessage.includes('type') || errorMessage.includes('format')) {
        errorMessage = 'Invalid file type. Please upload an image file (JPG, PNG, etc).';
      }

      alert(errorMessage);
    } finally {
      setIsUploadingCustomImage(false);
    }
  };

  const removeCustomImage = (index: number) => {
    setCustomImages(customImages.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof EventFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setActiveTab('basic'); // Switch to basic tab if validation fails
      return;
    }

    try {
      // If there's a pending custom image that hasn't been added yet, upload and include it
      let finalCustomImages = [...customImages];
      if (customImageFile && customImageTitle) {
        try {
          const result = await uploadToCloudinary(customImageFile, 'event-images');
          finalCustomImages.push({
            title: customImageTitle,
            description: customImageDesc,
            url: result.secure_url,
          });
          // Reset pending custom image
          setCustomImageFile(null);
          setCustomImagePreview('');
          setCustomImageTitle('');
          setCustomImageDesc('');
          setCustomImages(finalCustomImages);
        } catch (uploadErr: any) {
          console.error('Failed to upload pending custom image:', uploadErr);
          alert('Gagal mengupload custom image: ' + (uploadErr.message || 'Unknown error'));
          return;
        }
      }

      await onSubmit(formData, imageFile || undefined, formFields, speakers, finalCustomImages);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const tabs = [
    {
      id: 'basic' as const,
      label: 'Basic Info',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'registration' as const,
      label: 'Registration Form',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'speakers' as const,
      label: 'Speakers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'images' as const,
      label: 'Custom Images',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in basic information about your event</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Image Upload - Left Column */}
            <div className="lg:col-span-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Image
              </label>
              {imagePreview ? (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                      <span className="font-semibold">Click to upload</span><br />or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      PNG, JPG (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            {/* Form Fields - Right Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white`}
                  placeholder="Enter event title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-3 border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white`}
                  placeholder="Describe your event in detail..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                <p className="mt-1 text-xs text-gray-500">You can use markdown formatting</p>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.start_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white`}
                  />
                  {errors.start_date && <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.end_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white`}
                  />
                  {errors.end_date && <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white`}
                  placeholder="Event venue or online meeting link"
                />
                {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
              </div>

              {/* Category & Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white"
                    placeholder="Max participants"
                  />
                </div>
              </div>

              {/* Registration Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Registration Fee (Rp)
                </label>
                <input
                  type="number"
                  name="registration_fee"
                  value={formData.registration_fee}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white"
                  placeholder="0 for free event"
                />
                <p className="mt-1 text-xs text-gray-500">Leave as 0 for free events</p>
              </div>

              {/* Bank Account Information - Show only for paid events */}
              {parseFloat(formData.registration_fee || '0') > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Informasi Rekening Bank
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Informasi ini akan ditampilkan kepada peserta untuk transfer pembayaran
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Pemegang Rekening
                      </label>
                      <input
                        type="text"
                        name="bank_account_name"
                        value={formData.bank_account_name || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white"
                        placeholder="e.g., PT Event Organizer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomor Rekening
                      </label>
                      <input
                        type="text"
                        name="bank_account_number"
                        value={formData.bank_account_number || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white"
                        placeholder="e.g., 1234567890"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Bank
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-secondary dark:text-white"
                        placeholder="e.g., Bank BCA, Bank Mandiri"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Draft</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Published</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Tab */}
      {activeTab === 'registration' && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registration Form</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add custom fields for registration</p>
            </div>
            <button
              type="button"
              onClick={addFormField}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>

          {formFields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-dark-secondary/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No custom fields yet</h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Add custom fields to collect additional information</p>
              <button
                type="button"
                onClick={addFormField}
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Add your first field
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formFields.map((field, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-dark-secondary/30 hover:bg-white dark:hover:bg-dark-secondary transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-1 flex items-center justify-center">
                      <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </span>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Field Name
                      </label>
                      <input
                        type="text"
                        value={field.field_name}
                        onChange={(e) => updateFormField(index, 'field_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                        placeholder="e.g., Phone Number"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={field.field_type}
                        onChange={(e) => updateFormField(index, 'field_type', e.target.value as FormField['field_type'])}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="file">File</option>
                      </select>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-between gap-4 pt-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => updateFormField(index, 'is_required', e.target.checked)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Required</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeFormField(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Speakers Tab */}
      {activeTab === 'speakers' && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Speakers</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add speakers or presenters for your event</p>
            </div>
            <button
              type="button"
              onClick={addSpeaker}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Speaker
            </button>
          </div>

          {speakers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-dark-secondary/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No speakers yet</h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Add speakers to showcase your event's presenters</p>
              <button
                type="button"
                onClick={addSpeaker}
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Add your first speaker
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {speakers.map((speaker, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-dark-secondary/30 relative group">
                  <button
                    type="button"
                    onClick={() => removeSpeaker(index)}
                    className="absolute top-4 right-4 p-2 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                      {index + 1}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Speaker #{index + 1}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                        placeholder="Speaker name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={speaker.title}
                        onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                        placeholder="e.g., CEO, CTO"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={speaker.company}
                        onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                        placeholder="Company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Photo URL
                      </label>
                      <input
                        type="url"
                        value={speaker.photo_url}
                        onChange={(e) => updateSpeaker(index, 'photo_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                        placeholder="https://..."
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Images Tab */}
      {activeTab === 'images' && (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Custom Images</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add additional images for your event gallery</p>
          </div>

          {/* Add Custom Image Form */}
          <div className="bg-gray-50 dark:bg-dark-secondary/30 rounded-xl p-6 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Add New Image</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image
              </label>
              {customImagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                  <img
                    src={customImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomImageFile(null);
                      setCustomImagePreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white dark:bg-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Click to upload image</p>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCustomImageChange}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={customImageTitle}
                onChange={(e) => setCustomImageTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                placeholder="Image title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={customImageDesc}
                onChange={(e) => setCustomImageDesc(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-primary dark:text-white"
                placeholder="Optional description"
              />
            </div>

            <button
              type="button"
              onClick={addCustomImage}
              disabled={isUploadingCustomImage || !customImageFile || !customImageTitle}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingCustomImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Image to Gallery
                </>
              )}
            </button>
          </div>

          {/* Custom Images Gallery */}
          {customImages.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Image Gallery ({customImages.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customImages.map((image, index) => (
                  <div key={index} className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeCustomImage(index)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3 bg-white dark:bg-dark-secondary">
                      <h5 className="font-medium text-gray-900 dark:text-white">{image.title}</h5>
                      {image.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{image.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : submitLabel}
        </button>
      </div>
    </form>
  );
}
