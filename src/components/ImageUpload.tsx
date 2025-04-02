import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
  onError: (error: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onUpload,
  onError
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);

      // Delete old image if exists
      if (currentImage) {
        const oldFileName = currentImage.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile_images')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      onUpload(publicUrl);
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadImage}
        className="hidden"
      />

      <Button
        variant="ghost"
        className="w-full h-full rounded-full bg-black/75 hover:bg-black/90 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        loading={uploading}
      >
        <div className="flex flex-col items-center justify-center">
          <Camera className="w-8 h-8 mb-2" />
          <span className="text-sm">
            {uploading ? 'Uploading...' : 'Change Photo'}
          </span>
        </div>
      </Button>
    </div>
  );
};

export default ImageUpload;