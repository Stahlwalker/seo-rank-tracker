import React from 'react';
import { X, Database, Server, Cloud, Github } from 'lucide-react';

interface DatabaseInfoModalProps {
  onClose: () => void;
}

const DatabaseInfoModal: React.FC<DatabaseInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-600" />
            Database Options for SERP Tracker
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-600">
            Currently, your SERP Tracker is using browser <strong>localStorage</strong> to store your data.
            This works well for personal use but has limitations:
          </p>

          <ul className="mb-6 text-gray-600">
            <li>Data is stored only in your current browser</li>
            <li>Data can't be shared between devices or team members</li>
            <li>Storage is limited to about 5MB</li>
            <li>Data can be lost if browser storage is cleared</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-2">Database Options</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center mb-2">
                <Cloud className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-medium text-gray-800">Supabase (Recommended)</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                A Firebase alternative built on PostgreSQL. Offers authentication, real-time updates, and a generous free tier.
              </p>
              <div className="text-sm text-gray-500">
                <div><strong>Pros:</strong> Easy setup, PostgreSQL backend, auth included</div>
                <div><strong>Cons:</strong> Requires account creation</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center mb-2">
                <Server className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-medium text-gray-800">SQLite (via sql.js)</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                A file-based SQL database that can run in the browser. Data can be exported/imported as files.
              </p>
              <div className="text-sm text-gray-500">
                <div><strong>Pros:</strong> No server needed, familiar SQL syntax</div>
                <div><strong>Cons:</strong> Manual import/export required</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center mb-2">
                <Cloud className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-medium text-gray-800">Firebase Firestore</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Google's NoSQL cloud database with real-time capabilities and authentication.
              </p>
              <div className="text-sm text-gray-500">
                <div><strong>Pros:</strong> Real-time updates, scales well</div>
                <div><strong>Cons:</strong> NoSQL structure, pricing can scale up</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center mb-2">
                <Github className="h-5 w-5 text-gray-800 mr-2" />
                <h4 className="font-medium text-gray-800">Custom Backend API</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Build your own backend with Node.js, Express, and a database of your choice.
              </p>
              <div className="text-sm text-gray-500">
                <div><strong>Pros:</strong> Complete control, any database</div>
                <div><strong>Cons:</strong> More complex setup, hosting required</div>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mb-2">Implementation Steps</h3>

          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-1">For Supabase:</h4>
            <ol className="list-decimal pl-5 text-gray-600 text-sm">
              <li>Create a Supabase account and project</li>
              <li>Set up tables for URLs, keywords, and ranking history</li>
              <li>Add authentication for user management</li>
              <li>Install the Supabase client: <code>npm install @supabase/supabase-js</code></li>
              <li>Create API services to replace localStorage functions</li>
              <li>Add user authentication UI</li>
            </ol>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-1">For SQLite (sql.js):</h4>
            <ol className="list-decimal pl-5 text-gray-600 text-sm">
              <li>Install sql.js: <code>npm install sql.js</code></li>
              <li>Create a database schema for URLs and rankings</li>
              <li>Implement functions to save/load the database file</li>
              <li>Add UI for importing/exporting the database file</li>
            </ol>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h4 className="font-medium text-blue-800 mb-1">Recommendation</h4>
            <p className="text-blue-700 text-sm">
              For most users, Supabase offers the best balance of ease of use, features, and scalability.
              It provides authentication, real-time updates, and a SQL database with a generous free tier.
            </p>
          </div>

          <p className="text-gray-600">
            Would you like to implement one of these database solutions? I can help you set up the database
            structure and integrate it with your SERP Tracker application.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseInfoModal;