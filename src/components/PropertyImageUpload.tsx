import React, { useState, useCallback } from 'react'
import { Upload, X, Camera, Star } from 'lucide-react'

export interface PropertyImage {
  file: File
  preview: string
  room_type: string
  room_name?: string
  description?: string
  is_primary?: boolean
}

interface PropertyImageUploadProps {
  bedrooms: number
  bathrooms: number
  balconies?: number
  onImagesChange: (images: PropertyImage[]) => void
  existingImages?: PropertyImage[]
}

const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({
  bedrooms,
  bathrooms,
  balconies = 0,
  onImagesChange,
  existingImages = []
}) => {
  const [images, setImages] = useState<PropertyImage[]>(existingImages)
  const [dragActive, setDragActive] = useState(false)

  // Generate room types based on property configuration
  const getRoomTypes = () => {
    const roomTypes = [
      { value: 'front_view', label: 'Front View' },
      { value: 'hall', label: 'Living Room/Hall' },
      { value: 'dining', label: 'Dining Room' },
      { value: 'kitchen', label: 'Kitchen' }
    ]

    // Add bedrooms
    for (let i = 1; i <= bedrooms; i++) {
      roomTypes.push({ value: `bedroom_${i}`, label: `Bedroom ${i}` })
    }

    // Add bathrooms
    for (let i = 1; i <= bathrooms; i++) {
      roomTypes.push({ value: `bathroom_${i}`, label: `Bathroom ${i}` })
    }

    // Add balconies if any
    for (let i = 1; i <= balconies; i++) {
      roomTypes.push({ value: 'balcony', label: `Balcony ${i > 1 ? i : ''}` })
    }

    roomTypes.push(
      { value: 'wash_area', label: 'Wash Area' },
      { value: 'garden', label: 'Garden' },
      { value: 'parking', label: 'Parking' },
      { value: 'other', label: 'Other' }
    )

    return roomTypes
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files: FileList) => {
    const newImages: PropertyImage[] = []
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newImage: PropertyImage = {
            file,
            preview: e.target?.result as string,
            room_type: 'other',
            is_primary: images.length === 0 && newImages.length === 0
          }
          newImages.push(newImage)
          
          if (newImages.length === files.length) {
            const updatedImages = [...images, ...newImages]
            setImages(updatedImages)
            onImagesChange(updatedImages)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    
    // If we removed the primary image, make the first remaining image primary
    if (images[index].is_primary && updatedImages.length > 0) {
      updatedImages[0].is_primary = true
    }
    
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const updateImageDetails = (index: number, field: keyof PropertyImage, value: any) => {
    const updatedImages = [...images]
    
    if (field === 'is_primary' && value) {
      // Remove primary flag from all other images
      updatedImages.forEach((img, i) => {
        if (i !== index) img.is_primary = false
      })
    }
    
    updatedImages[index] = { ...updatedImages[index], [field]: value }
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const roomTypes = getRoomTypes()

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <Upload size={48} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              Drop images here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              Support for multiple images. PNG, JPG up to 10MB each.
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Uploaded Images ({images.length})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={image.preview}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Image Badge */}
                  {image.is_primary && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      Primary
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Image Details Form */}
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Type
                    </label>
                    <select
                      value={image.room_type}
                      onChange={(e) => updateImageDetails(index, 'room_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {roomTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={image.room_name || ''}
                      onChange={(e) => updateImageDetails(index, 'room_name', e.target.value)}
                      placeholder="e.g., Master Bedroom"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={image.description || ''}
                      onChange={(e) => updateImageDetails(index, 'description', e.target.value)}
                      placeholder="Describe this image..."
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`primary-${index}`}
                      checked={image.is_primary || false}
                      onChange={(e) => updateImageDetails(index, 'is_primary', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`primary-${index}`} className="text-sm text-gray-700">
                      Set as primary image
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">Image Upload Tips</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload at least 5-10 high-quality images for better visibility</li>
              <li>• Include images of all rooms, especially bedrooms and bathrooms</li>
              <li>• Set one image as primary - this will be the main display image</li>
              <li>• Good lighting and clean spaces photograph better</li>
              <li>• Include exterior shots and common areas if applicable</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyImageUpload