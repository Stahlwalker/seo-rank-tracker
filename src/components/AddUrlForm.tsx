import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X } from 'lucide-react';
import { UrlKeywordPair } from '../types';
import { format } from 'date-fns';
import { addUrlData } from '../utils/storage';

interface AddUrlFormProps {
  onAdd: (newPair: UrlKeywordPair) => void;
  onClose: () => void;
  isAuthenticated: boolean;
  useLocalStorage: boolean;
}

interface FormValues {
  url: string;
  keyword: string;
  monthlySearchVolume: string;
  currentRanking: string;
  note: string;
  status: '' | 'Testing' | 'Needs Improvement';
}

const AddUrlForm: React.FC<AddUrlFormProps> = ({ onAdd, onClose, isAuthenticated, useLocalStorage }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const newPair: UrlKeywordPair = {
        id: uuidv4(),
        url: data.url,
        keyword: data.keyword,
        monthlySearchVolume: data.monthlySearchVolume ? parseInt(data.monthlySearchVolume, 10) : undefined,
        currentRanking: data.currentRanking ? parseInt(data.currentRanking, 10) : null,
        rankingHistory: [],
        note: data.note || undefined,
        status: data.status || undefined,
        lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      };
      
      // Add to state via parent component
      onAdd(newPair);
      
      // Also add to localStorage directly as a backup if using localStorage
      if (useLocalStorage) {
        addUrlData(newPair);
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding URL:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Add New URL</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {useLocalStorage ? (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
          This URL will be stored in your browser's local storage.
        </div>
      ) : !isAuthenticated ? (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm">
          You're not signed in. This URL will be stored in your browser's local storage.
        </div>
      ) : (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm">
          This URL will be stored in the cloud and accessible from any device.
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            id="url"
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${errors.url ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="https://example.com/page"
            {...register('url', { 
              required: 'URL is required',
              pattern: {
                value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                message: 'Please enter a valid URL'
              }
            })}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
            Keyword
          </label>
          <input
            id="keyword"
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${errors.keyword ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="example keyword"
            {...register('keyword', { required: 'Keyword is required' })}
          />
          {errors.keyword && (
            <p className="mt-1 text-sm text-red-600">{errors.keyword.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="monthlySearchVolume" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Search Volume (optional)
          </label>
          <input
            id="monthlySearchVolume"
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., 1000"
            min="0"
            {...register('monthlySearchVolume')}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="currentRanking" className="block text-sm font-medium text-gray-700 mb-1">
            Current Ranking (optional)
          </label>
          <input
            id="currentRanking"
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., 5"
            min="1"
            {...register('currentRanking')}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status (optional)
          </label>
          <select
            id="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            {...register('status')}
          >
            <option value="">None</option>
            <option value="Testing">Testing</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <textarea
            id="note"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Add any notes about this URL/keyword"
            rows={3}
            {...register('note')}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add URL
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUrlForm;