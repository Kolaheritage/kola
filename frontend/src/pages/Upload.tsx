import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Upload.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  slug: string;
}

interface FormData {
  title: string;
  description: string;
  category_id: string;
  tags: string[];
}

interface UploadedFile {
  url: string;
  thumbnailUrl?: string;
  type: string;
  size: number;
}

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Upload Component - HER-25 & HER-51
 * Multi-step form for uploading/editing cultural content with media files
 * Steps: 1) Upload Media, 2) Add Details, 3) Review & Submit
 * Edit Mode: Skips step 1, pre-populates data, uses PUT instead of POST
 */
const Upload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Edit mode detection
  const editContentId = searchParams.get('edit');
  const isEditMode = !!editContentId;

  // Step management (skip step 1 in edit mode)
  const [currentStep, setCurrentStep] = useState<number>(isEditMode ? 2 : 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(isEditMode ? [1] : []);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFileData, setUploadedFileData] = useState<UploadedFile | null>(null);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category_id: '',
    tags: [],
  });

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);

  // Tag input state
  const [tagInput, setTagInput] = useState<string>('');

  // Validation errors
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);

  // Loading state for edit mode
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(isEditMode);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load existing content data in edit mode
  useEffect(() => {
    if (isEditMode && editContentId) {
      loadContentForEdit(editContentId);
    }
  }, [isEditMode, editContentId]);

  const loadCategories = async (): Promise<void> => {
    try {
      const response: any = await apiService.getCategories();
      const data = response.data || response;
      const categoriesData: Category[] = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadContentForEdit = async (contentId: string): Promise<void> => {
    try {
      setIsLoadingContent(true);
      const response: any = await apiService.getContent(contentId);
      const content = response.data?.content || response.content;

      if (!content) {
        setSubmitError('Content not found');
        return;
      }

      // Pre-populate form data
      setFormData({
        title: content.title || '',
        description: content.description || '',
        category_id: content.category_id || '',
        tags: content.tags || [],
      });

      // Set uploaded file data (existing media)
      setUploadedFileData({
        url: content.media_url || '',
        thumbnailUrl: content.thumbnail_url,
        type: content.media_url?.includes('video') ? 'video' : 'image',
        size: 0, // Unknown size for existing files
      });
    } catch (error: any) {
      console.error('Failed to load content for edit:', error);
      setSubmitError(error.message || 'Failed to load content data');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File): void => {
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
    const allValidTypes = [...validImageTypes, ...validVideoTypes];

    if (!allValidTypes.includes(file.type)) {
      setErrors({ file: 'Please select a valid image or video file (JPEG, PNG, GIF, WebP, MP4, MPEG, QuickTime, WebM)' });
      return;
    }

    // Validate file size
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      setErrors({ file: `File size must not exceed ${maxSizeMB}MB` });
      return;
    }

    setErrors({});
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = (): void => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadedFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form field handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Tags handlers
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.slice(0, -1)
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Step validation
  const validateStep1 = (): boolean => {
    if (!selectedFile) {
      setErrors({ file: 'Please select a file to upload' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must not exceed 5000 characters';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      // Upload file before moving to next step
      await uploadFile();
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCompletedSteps(prev => [...new Set([...prev, 2])]);
      setCurrentStep(3);
    }
  };

  const handleBack = (): void => {
    setCurrentStep(prev => prev - 1);
  };

  const handleEditStep = (step: number): void => {
    setCurrentStep(step);
  };

  // Upload file to server
  const uploadFile = async (): Promise<void> => {
    setIsUploading(true);
    setUploadProgress(0);
    setErrors({});

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile!);

      const response: any = await apiService.uploadFile(
        formDataObj,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      );

      if (response.success && response.data) {
        setUploadedFileData(response.data.file);
        setCompletedSteps(prev => [...new Set([...prev, 1])]);
        setCurrentStep(2);
      } else {
        setErrors({ upload: 'Upload failed. Please try again.' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrors({ upload: error.message || 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Submit form
  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const contentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        tags: formData.tags,
        status: 'published' as const,
      };

      // In edit mode, don't include media URLs (cannot change media)
      // In create mode, include media URLs
      const submitData = isEditMode
        ? contentData
        : {
            ...contentData,
            media_url: uploadedFileData!.url,
            thumbnail_url: uploadedFileData!.thumbnailUrl,
          };

      const response: any = isEditMode
        ? await apiService.updateContent(editContentId!, submitData)
        : await apiService.createContent(submitData);

      if (response.success && response.data) {
        const contentId = response.data.content.id;
        setCreatedContentId(contentId);
        setSubmitSuccess(true);
      } else {
        setSubmitError(
          isEditMode
            ? 'Failed to update content. Please try again.'
            : 'Failed to create content. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError(
        error.message ||
          (isEditMode
            ? 'Failed to update content. Please try again.'
            : 'Failed to create content. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'Image';
    if (file.type.startsWith('video/')) return 'Video';
    return 'File';
  };

  // Render different steps
  const renderStep1 = (): React.ReactNode => (
    <div>
      <h2>Upload Media</h2>
      <p className="hint">Upload an image or video to share your cultural content</p>

      {errors.file && <div className="error-message">{errors.file}</div>}
      {errors.upload && <div className="error-message">{errors.upload}</div>}

      {!selectedFile ? (
        <div
          className={`file-upload-zone ${isDragging ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            Drag & drop your file here, or click to browse
          </div>
          <div className="upload-hint">
            Supports: Images (JPEG, PNG, GIF, WebP) up to 10MB
            <br />
            Videos (MP4, MPEG, QuickTime, WebM) up to 100MB
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="file-preview">
          <div className="preview-header">
            <span className="preview-title">Selected File</span>
            <button onClick={handleRemoveFile} className="remove-file-btn">
              Remove
            </button>
          </div>
          <div className="preview-content">
            {selectedFile.type.startsWith('image/') ? (
              <img src={filePreview!} alt="Preview" className="preview-image" />
            ) : (
              <video src={filePreview!} controls className="preview-video" />
            )}
          </div>
          <div className="file-info">
            <div className="info-item">
              <div className="info-label">Type</div>
              <div className="info-value">{getFileType(selectedFile)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Size</div>
              <div className="info-value">{formatFileSize(selectedFile.size)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Name</div>
              <div className="info-value" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <div className="progress-text">Uploading... {uploadProgress}%</div>
        </div>
      )}
    </div>
  );

  const renderStep2 = (): React.ReactNode => (
    <div>
      <h2>Add Details</h2>
      <p className="hint">Tell us about your content</p>

      <div className={`form-group ${errors.title ? 'error' : ''}`}>
        <label>
          Title <span className="required">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter a descriptive title"
          maxLength={200}
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
        <div className="hint">{formData.title.length}/200 characters</div>
      </div>

      <div className={`form-group ${errors.description ? 'error' : ''}`}>
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your content, its cultural significance, and any stories behind it"
          maxLength={5000}
        />
        {errors.description && <div className="error-message">{errors.description}</div>}
        <div className="hint">{formData.description.length}/5000 characters</div>
      </div>

      <div className={`form-group ${errors.category_id ? 'error' : ''}`}>
        <label>
          Category <span className="required">*</span>
        </label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleInputChange}
        >
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && <div className="error-message">{errors.category_id}</div>}
      </div>

      <div className="form-group">
        <label>Tags</label>
        <div className="tags-input-wrapper">
          {formData.tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="tag-remove"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            className="tags-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Type a tag and press Enter"
          />
        </div>
        <div className="hint">Press Enter to add a tag, Backspace to remove last tag</div>
      </div>
    </div>
  );

  const renderStep3 = (): React.ReactNode => {
    const selectedCategory = categories.find(cat => cat.id === formData.category_id);

    return (
      <div>
        <h2>Review & Submit</h2>
        <p className="hint">Please review your content before publishing</p>

        <div className="review-section">
          <h3>Media</h3>
          <div className="preview-content">
            {uploadedFileData && uploadedFileData.type === 'image' ? (
              <img src={uploadedFileData.url} alt="Preview" className="preview-image" />
            ) : uploadedFileData && uploadedFileData.type === 'video' ? (
              <video src={uploadedFileData.url} controls className="preview-video" />
            ) : null}
          </div>
          <div className="review-item">
            <div className="review-label">File Type</div>
            <div className="review-value">{uploadedFileData?.type}</div>
          </div>
          <div className="review-item">
            <div className="review-label">File Size</div>
            <div className="review-value">{formatFileSize(uploadedFileData?.size || 0)}</div>
          </div>
        </div>

        <div className="review-section">
          <h3>Details</h3>
          <div className="review-item">
            <div className="review-label">Title</div>
            <div className="review-value">{formData.title}</div>
          </div>
          <div className="review-item">
            <div className="review-label">Description</div>
            <div className="review-value">
              {formData.description || <em>No description provided</em>}
            </div>
          </div>
          <div className="review-item">
            <div className="review-label">Category</div>
            <div className="review-value">
              {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'None'}
            </div>
          </div>
          {formData.tags.length > 0 && (
            <div className="review-item">
              <div className="review-label">Tags</div>
              <div className="review-tags">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
          <p>
            <strong>Ready to share your cultural heritage?</strong>
            <br />
            Your content will be visible to all users once published.
          </p>
        </div>
      </div>
    );
  };

  // Success message
  if (submitSuccess) {
    return (
      <div className="upload-page">
        <div className="message-box success">
          <h3>
            ✓ Content {isEditMode ? 'Updated' : 'Published'} Successfully!
          </h3>
          <p>
            {isEditMode
              ? 'Your changes have been saved successfully.'
              : 'Your cultural content has been shared with the community.'}
          </p>
          {createdContentId && (
            <a href={`/content/${createdContentId}`} className="view-content-btn">
              View Your Content
            </a>
          )}
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              style={{ display: 'inline-block', maxWidth: '200px' }}
            >
              {isEditMode ? 'Back to Dashboard' : 'Upload Another'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for edit mode
  if (isLoadingContent) {
    return (
      <div className="upload-page">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading content data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h1>{isEditMode ? 'Edit Content' : 'Upload Cultural Content'}</h1>

      {/* Progress Steps */}
      <div className="progress-steps">
        {!isEditMode && (
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${completedSteps.includes(1) ? 'completed' : ''}`}>
            <div className="step-circle">{completedSteps.includes(1) ? '✓' : '1'}</div>
            <div className="step-label">Upload Media</div>
          </div>
        )}
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${completedSteps.includes(2) ? 'completed' : ''}`}>
          <div className="step-circle">{completedSteps.includes(2) ? '✓' : isEditMode ? '1' : '2'}</div>
          <div className="step-label">{isEditMode ? 'Edit Details' : 'Add Details'}</div>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-circle">{isEditMode ? '2' : '3'}</div>
          <div className="step-label">Review & {isEditMode ? 'Update' : 'Submit'}</div>
        </div>
      </div>

      {/* Form Card */}
      <div className="upload-form-card">
        {submitError && (
          <div className="message-box error">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Form Actions */}
        <div className="form-actions">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                'Next'
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  {isEditMode ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                isEditMode ? 'Update Content' : 'Publish Content'
              )}
            </button>
          )}
        </div>

        {/* Quick edit buttons on review step */}
        {currentStep === 3 && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            {!isEditMode && (
              <button
                onClick={() => handleEditStep(1)}
                style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer' }}
              >
                Edit Media
              </button>
            )}
            <button
              onClick={() => handleEditStep(2)}
              style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer' }}
            >
              Edit Details
            </button>
            {isEditMode && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                Note: Media files cannot be changed after upload
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
