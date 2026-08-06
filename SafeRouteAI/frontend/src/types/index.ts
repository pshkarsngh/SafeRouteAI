export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};
