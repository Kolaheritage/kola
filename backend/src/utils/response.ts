import { Response } from 'express';

/**
 * Response utility functions
 * Standardizes API responses
 */

interface SuccessResponseData {
  [key: string]: any;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ErrorDetail {
  [key: string]: any;
}

const successResponse = (
  res: Response,
  data: SuccessResponseData,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  errors: ErrorDetail | null = null
): Response => {
  const response: any = {
    success: false,
    error: { message },
  };

  if (errors) {
    response.error.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const paginatedResponse = (
  res: Response,
  data: SuccessResponseData,
  pagination: PaginationData,
  message: string = 'Success'
): Response => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export { successResponse, errorResponse, paginatedResponse };
