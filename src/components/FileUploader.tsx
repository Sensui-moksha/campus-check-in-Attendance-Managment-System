import { useState, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFile: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

/**
 * FileUploader - Drag & drop file upload component
 */
export function FileUploader({ 
  onFile, 
  accept = '.csv', 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className 
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`;
    }
    
    if (accept) {
      const extensions = accept.split(',').map(ext => ext.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!extensions.includes(fileExt)) {
        return `Only ${accept} files are allowed`;
      }
    }
    
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setSelectedFile(file);
      onFile(file);
    }
  }, [onFile, maxSize, accept]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setSelectedFile(file);
      onFile(file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError('');
  };

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile ? (
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            error && 'border-destructive'
          )}
        >
          <Upload className={cn(
            'mx-auto h-12 w-12 mb-4',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )} />
          
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop your file here, or
          </p>
          
          <label>
            <input
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <span className="cursor-pointer">Browse Files</span>
            </Button>
          </label>
          
          <p className="text-xs text-muted-foreground mt-4">
            Accepted formats: {accept}
            {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`}
          </p>
          
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
