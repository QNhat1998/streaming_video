"use client";

import { useState } from "react";
import VideoPlayer from "./components/VideoPlayer";
import Loading from "./components/Loading";
import VideoList from "./components/VideoList";

const API_BASE_URL = "http://localhost:3001";

interface VideoInfo {
  url: string;
  name: string;
  originalName: string;
  duration: number;
  size: number;
  format: string;
  createdAt: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    console.log("File:", file);

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/stream/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          console.log("Upload progress:", progress);
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log("Upload response:", data);

            if (!data.data || !data.data.public_id) {
              throw new Error("Invalid response format: missing public_id");
            }

            const videoName = data.data.public_id.split("/").pop();
            console.log("Video name:", videoName);

            const videoInfo = await fetch(`${API_BASE_URL}/stream/info/${videoName}`);
            if (!videoInfo.ok) {
              throw new Error(`Failed to get video info: ${videoInfo.statusText}`);
            }

            const infoData = await videoInfo.json();
            console.log("Info response:", infoData);

            if (!infoData.data) {
              throw new Error("Invalid response format from server");
            }

            setVideoInfo(infoData.data);
            resolve(infoData.data);
          } catch (error) {
            console.error("Error processing response:", error);
            setError(error instanceof Error ? error.message : "Error processing response");
            reject(error);
          }
        } else {
          const error = new Error(`Upload failed: ${xhr.statusText}`);
          console.error("Upload error:", error);
          setError(error.message);
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error("Network error during upload");
        console.error("Network error:", error);
        setError(error.message);
        reject(error);
      };

      xhr.send(formData);
    }).finally(() => {
      setUploading(false);
      setUploadProgress(0);
    });
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {uploading && <Loading progress={uploadProgress} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Video Streaming App</h1>
          <p className="text-lg text-gray-600">Upload and stream your videos with ease</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose a video file</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <button onClick={handleUpload} disabled={!file || uploading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {videoInfo && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Video Info</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p>
                <strong>Name:</strong> {videoInfo.originalName}
              </p>
              <p>
                <strong>Format:</strong> {videoInfo.format}
              </p>
              <p>
                <strong>Size:</strong> {(videoInfo.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                <strong>Duration:</strong> {videoInfo.duration} seconds
              </p>
              <p>
                <strong>Created At:</strong> {new Date(videoInfo.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Video Player</h2>
              <video controls className="w-full rounded-lg" src={`${API_BASE_URL}/stream/${videoInfo.name}`}>
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
          <p className="mt-2 text-gray-600">Browse through your uploaded videos</p>
        </div>
        <VideoList />
      </div>
    </main>
  );
}
