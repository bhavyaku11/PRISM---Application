abstract class AppError implements Exception {
  final String message;
  final dynamic cause;

  const AppError(this.message, [this.cause]);

  @override
  String toString() => message;
}

class NetworkError extends AppError {
  const NetworkError(
      [super.message = 'Unable to connect. Check your internet connection.',
      super.cause]);
}

class AuthError extends AppError {
  const AuthError(
      [super.message = 'Your session has expired. Please sign in again.',
      super.cause]);
}

class NotFoundError extends AppError {
  const NotFoundError(
      [super.message = 'The requested resource was not found.', super.cause]);
}

class ServerError extends AppError {
  const ServerError(
      [super.message = 'Something went wrong. Please try again.', super.cause]);
}

class ValidationError extends AppError {
  const ValidationError(
      [super.message = 'Please check your input and try again.', super.cause]);
}
