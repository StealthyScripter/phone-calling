import { API_ENDPOINTS } from '../../constants/API';
import { apiClient } from './client';
import type { 
  CallRequest, 
  CallResponse, 
  CallHistoryItem,
  CallStats,
  ApiResponse,
  PaginatedResponse 
} from './types';

class CallsAPI {
  async makeCall(callData: CallRequest): Promise<CallResponse> {
    const response = await apiClient.post<ApiResponse<CallResponse>>(
      API_ENDPOINTS.CALLS.MAKE,
      callData
    );
    return response.data.data;
  }

  async hangupCall(callSid: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.CALLS.HANGUP(callSid)
    );
  }

  async acceptCall(callSid: string): Promise<CallResponse> {
    const response = await apiClient.post<ApiResponse<CallResponse>>(
      API_ENDPOINTS.CALLS.ACCEPT(callSid)
    );
    return response.data.data;
  }

  async rejectCall(callSid: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.CALLS.REJECT(callSid)
    );
  }

  async getActiveCalls(): Promise<CallResponse[]> {
    const response = await apiClient.get<ApiResponse<CallResponse[]>>(
      API_ENDPOINTS.CALLS.ACTIVE
    );
    return response.data.data;
  }

  async getPendingCalls(): Promise<CallResponse[]> {
    const response = await apiClient.get<ApiResponse<CallResponse[]>>(
      API_ENDPOINTS.CALLS.PENDING
    );
    return response.data.data;
  }

  async getCall(callSid: string): Promise<CallResponse> {
    const response = await apiClient.get<ApiResponse<CallResponse>>(
      API_ENDPOINTS.CALLS.BY_SID(callSid)
    );
    return response.data.data;
  }

  async getCallHistory(
    userId: string, 
    options: {
      direction?: 'inbound' | 'outbound';
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<CallHistoryItem[]> {
    const params = new URLSearchParams();
    
    if (options.direction) params.append('direction', options.direction);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<CallHistoryItem>>>(
      `${API_ENDPOINTS.CALL_HISTORY.BASE(userId)}?${params.toString()}`
    );
    return response.data.data.data;
  }

  async getCallStats(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<CallStats> {
    const params = new URLSearchParams();
    
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const response = await apiClient.get<ApiResponse<CallStats>>(
      `${API_ENDPOINTS.CALL_HISTORY.STATS(userId)}?${params.toString()}`
    );
    return response.data.data;
  }
}

export const callsAPI = new CallsAPI();
