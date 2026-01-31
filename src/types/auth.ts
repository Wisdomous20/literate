export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  message?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
  };
  error?: string;
}

export type RegisterErrorCode =
  | "VALIDATION_ERROR"
  | "USER_EXISTS"
  | "INTERNAL_ERROR";
