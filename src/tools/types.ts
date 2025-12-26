export interface PermissionResponse {
  allowed: boolean;
  feedback?: string;
}

export interface PermissionRequest {
  id: string;
  toolName: string;
  args: any;
  resolve: (response: PermissionResponse) => void;
}
