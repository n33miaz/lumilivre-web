import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import UploadIcon from '../../assets/icons/upload.svg?react';

interface ImageUploaderProps {
  currentImage?: string | null;
  onImageChange: (file: File) => void;
  readOnly?: boolean;
  placeholderText?: string;
}

export function ImageUploader({
  currentImage,
  onImageChange,
  readOnly,
  placeholderText,
}: ImageUploaderProps) {
  const { t } = useTranslation('common');
  const [preview, setPreview] = useState(currentImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onImageChange(file);
    }
  };

  return (
    <div className="w-[9.5rem] h-[14rem] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center overflow-hidden relative group shrink-0">
      {preview ? (
        <img
          src={preview}
          alt={t('image.alt')}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-sm text-gray-500 text-center p-2">
          {placeholderText}
        </span>
      )}

      {!readOnly && (
        <>
          <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <UploadIcon className="h-8 w-8 invert mb-1" />
            <span className="text-white text-xs font-bold">
              {t('image.change')}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </>
      )}
    </div>
  );
}
