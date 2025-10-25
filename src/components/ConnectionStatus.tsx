import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { databaseService } from '../utils/database-smart';

export function ConnectionStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
  }>({ connected: false, message: 'Checking...' });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await databaseService.connection.testConnection();
        setStatus({
          connected: !result.usingFallback,
          message: result.message
        });
      } catch (error) {
        setStatus({
          connected: false,
          message: 'Demo mode'
        });
      }
    };

    checkConnection();
  }, []);

  if (status.connected) {
    return (
      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
        <Wifi className="h-3 w-3" />
        {status.message}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
      <WifiOff className="h-3 w-3" />
      {status.message}
    </Badge>
  );
}
