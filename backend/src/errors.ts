export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (message = 'Không tìm thấy dữ liệu') => new HttpError(404, 'not_found', message);
