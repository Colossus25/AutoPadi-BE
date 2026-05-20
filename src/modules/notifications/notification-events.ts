/**
 * Central catalog of domain events that result in a notification.
 *
 * Domain services emit these via EventEmitter2; NotificationsSubscriberService
 * listens (@OnEvent) and turns each into an in-app + push notification. This
 * keeps domain modules decoupled from the notifications module and keeps all
 * notification copy in one place (the subscriber).
 */
export enum NotificationEvent {
  // Booking
  BOOKING_CREATED = "booking.created",
  BOOKING_STATUS_CHANGED = "booking.status_changed",
  BOOKING_CANCELLED = "booking.cancelled",
  BOOKING_REVIEWED = "booking.reviewed",

  // Messaging
  MESSAGE_SENT = "message.sent",

  // Subscriptions
  SUBSCRIPTION_ACTIVATED = "subscription.activated",
  SUBSCRIPTION_EXPIRING_SOON = "subscription.expiring_soon",
  SUBSCRIPTION_EXPIRED = "subscription.expired",
  SUBSCRIPTION_RENEWED = "subscription.renewed",
  SUBSCRIPTION_RENEWAL_FAILED = "subscription.renewal_failed",
  PAYMENT_SUCCESSFUL = "payment.successful",
  PAYMENT_FAILED = "payment.failed",

  // Service moderation
  SERVICE_APPROVED = "service.approved",
  SERVICE_REJECTED = "service.rejected",

  // Account security
  EMAIL_VERIFIED = "account.email_verified",
  PASSWORD_CHANGED = "account.password_changed",
}

export interface BookingCreatedEvent {
  providerId: number;
  bookingId: number;
  serviceName?: string;
}

export interface BookingStatusChangedEvent {
  customerId: number;
  bookingId: number;
  status: string;
  serviceName?: string;
  reason?: string;
}

export interface BookingCancelledEvent {
  providerId: number;
  bookingId: number;
  serviceName?: string;
  reason?: string;
}

export interface BookingReviewedEvent {
  providerId: number;
  bookingId: number;
  rating: number;
}

export interface MessageSentEvent {
  recipientIds: number[];
  senderId: number;
  senderName?: string;
  conversationId: string;
  preview?: string;
}

export interface SubscriptionEvent {
  userId: number;
  planName?: string;
  endDate?: string;
  daysLeft?: number;
  reason?: string;
}

export interface PaymentEvent {
  userId: number;
  amount?: number;
  reference?: string;
  reason?: string;
}

export interface ServiceModerationEvent {
  providerId: number;
  serviceId: number;
  serviceName?: string;
  reason?: string;
}

export interface AccountEvent {
  userId: number;
}
