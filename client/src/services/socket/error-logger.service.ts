import { SocketErrorDetails, SocketErrorMetrics } from '../../types/socket-errors.types';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface ErrorReportData {
  errorDetails: SocketErrorDetails;
  metrics: SocketErrorMetrics;
  connectionHistory: LogEntry[];
  systemInfo: {
    userAgent: string;
    url: string;
    timestamp: number;
    userId?: string;
    sessionId?: string;
  };
  networkInfo?: {
    connectionType?: string;
    downlink?: number;
    rtt?: number;
  };
}

class ErrorLoggerService {
  private logs: LogEntry[] = [];
  private maxLogEntries = 1000;
  private debugMode: boolean;
  private sessionId: string;

  constructor() {
    this.debugMode = import.meta.env.DEV || localStorage.getItem('socket-debug') === 'true';
    this.sessionId = this.generateSessionId();
    
    // Log session start
    this.log('info', 'session', 'Socket error logger initialized', {
      sessionId: this.sessionId,
      debugMode: this.debugMode
    });
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public log(
    level: 'error' | 'warn' | 'info' | 'debug',
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stackTrace: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    this.logs.push(logEntry);

    // Maintain max log entries
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Console logging with appropriate level
    if (this.shouldLogToConsole(level)) {
      const consoleData = this.formatConsoleOutput(logEntry);
      switch (level) {
        case 'error':
          console.error(consoleData.message, consoleData.data);
          break;
        case 'warn':
          console.warn(consoleData.message, consoleData.data);
          break;
        case 'info':
          console.info(consoleData.message, consoleData.data);
          break;
        case 'debug':
          console.log(consoleData.message, consoleData.data);
          break;
      }
    }
  }

  private shouldLogToConsole(level: string): boolean {
    if (this.debugMode) return true;
    return level === 'error' || level === 'warn';
  }

  private formatConsoleOutput(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const message = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`;
    
    const data: any = {
      ...entry.data
    };

    if (entry.stackTrace && this.debugMode) {
      data.stackTrace = entry.stackTrace;
    }

    if (entry.userId) {
      data.userId = entry.userId;
    }

    return { message, data };
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user ID from token service or auth context
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId;
      }
    } catch (error) {
      // Ignore token parsing errors
    }
    return undefined;
  }

  public logError(errorDetails: SocketErrorDetails, context?: any): void {
    this.log('error', 'socket-error', errorDetails.message, {
      errorDetails,
      context,
      severity: errorDetails.severity,
      category: errorDetails.category,
      type: errorDetails.type,
      canRetry: errorDetails.canRetry,
      recoveryActions: errorDetails.recoveryActions
    });
  }

  public logConnection(event: 'connect' | 'disconnect' | 'reconnect', data?: any): void {
    this.log('info', 'connection', `Socket ${event}`, {
      event,
      ...data
    });
  }

  public logRecoveryAttempt(action: string, success: boolean, error?: any): void {
    this.log(success ? 'info' : 'warn', 'recovery', `Recovery action: ${action}`, {
      action,
      success,
      error: error?.message || error
    });
  }

  public logNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.log('debug', 'network', 'Network information', {
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      });
    }
  }

  public getLogs(filters?: {
    level?: string;
    category?: string;
    since?: number;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters?.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since);
    }

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  public getErrorReport(errorDetails: SocketErrorDetails, metrics: SocketErrorMetrics): ErrorReportData {
    const connectionHistory = this.getLogs({
      category: 'connection',
      limit: 50
    });

    // Get network information if available
    let networkInfo: any = undefined;
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      networkInfo = {
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      };
    }

    return {
      errorDetails,
      metrics,
      connectionHistory,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        userId: this.getCurrentUserId(),
        sessionId: this.sessionId
      },
      networkInfo
    };
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'category', 'message', 'data'];
      const csvRows = logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.level,
        log.category,
        log.message,
        JSON.stringify(log.data || {})
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
      
      return [headers.join(','), ...csvRows].join('\n');
    }
  }

  public clearLogs(): void {
    this.logs = [];
    this.log('info', 'logger', 'Log history cleared');
  }

  public enableDebugMode(enable: boolean = true): void {
    this.debugMode = enable;
    localStorage.setItem('socket-debug', enable.toString());
    this.log('info', 'logger', `Debug mode ${enable ? 'enabled' : 'disabled'}`);
  }

  public isDebugMode(): boolean {
    return this.debugMode;
  }

  // Send error report to server (if endpoint available)
  public async sendErrorReport(errorDetails: SocketErrorDetails, metrics: SocketErrorMetrics): Promise<boolean> {
    try {
      const reportData = this.getErrorReport(errorDetails, metrics);
      
      // Only send in production and for critical/high severity errors
      if (!import.meta.env.PROD || (errorDetails.severity !== 'CRITICAL' && errorDetails.severity !== 'HIGH')) {
        this.log('debug', 'error-report', 'Error report not sent (not prod or low severity)', { reportData });
        return false;
      }

      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const success = response.ok;
      this.log(success ? 'info' : 'warn', 'error-report', 'Error report send result', {
        success,
        status: response.status
      });

      return success;
    } catch (error) {
      this.log('error', 'error-report', 'Failed to send error report', { error: error?.toString() });
      return false;
    }
  }
}

export const errorLogger = new ErrorLoggerService();