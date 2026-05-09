'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileVideo, Loader2 } from 'lucide-react';
import { TranscriptionResponse, ErrorResponse } from '@/types/api';

interface VideoUploadProps {}

export default function VideoUpload({}: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transcription, setTranscription] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));

    if (!videoFile) {
      alert('Please drop a video file.');
      return;
    }

    setFile(videoFile);
    await uploadAndTranscribe(videoFile);
  }, []);

  const uploadAndTranscribe = async (videoFile: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data: TranscriptionResponse = await response.json();
      setTranscription(data.transcription);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to transcribe video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          accept="video/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFile(file);
              uploadAndTranscribe(file);
            }
          }}
        />
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : file ? (
            <FileVideo className="w-12 h-12 text-green-500" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
          <div>
            <p className="text-lg font-medium">
              {isUploading
                ? 'Transcribing your video...'
                : file
                ? `Uploaded: ${file.name}`
                : 'Drop your video here or click to browse'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supports MP4, MOV, AVI, and other video formats
            </p>
          </div>
        </div>
      </motion.div>

      {transcription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Transcription</h3>
          <p className="text-gray-300 leading-relaxed">{transcription}</p>
        </motion.div>
      )}
    </div>
  );
}