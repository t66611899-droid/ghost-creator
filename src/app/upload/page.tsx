import VideoUpload from '@/components/VideoUpload';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Upload Your Video
        </h1>
        <p className="text-gray-400 text-center mb-12">
          Drag and drop your video file here to start creating AI-powered content for your business.
        </p>
        <VideoUpload />
      </div>
    </div>
  );
}