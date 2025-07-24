import React from 'react';

interface FileUploadChartProps {
  data: Array<{
    date: string;
    file_uploads: number;
    chat_messages: number;
  }>;
  title?: string;
}

const FileUploadChart: React.FC<FileUploadChartProps> = ({ data, title = 'File Uploads vs Chat Messages' }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.file_uploads, d.chat_messages))
  );

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-20 text-sm text-gray-600">
              {formatDate(item.date)}
            </div>
            <div className="flex-1">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>File Uploads</span>
                    <span>{item.file_uploads}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(item.file_uploads / maxValue) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Chat Messages</span>
                    <span>{item.chat_messages}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(item.chat_messages / maxValue) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-sm">File Uploads</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span className="text-sm">Chat Messages</span>
        </div>
      </div>
    </div>
  );
};

export default FileUploadChart; 