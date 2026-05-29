/**
 * أحداث Audit Trail — كل حدث في دورة حياة الطلب مُسجَّل
 */
export enum RequestActivityType {
  RequestedByRider = 'RequestedByRider',
  BookedByRider = 'BookedByRider',
  RequestedByOperator = 'RequestedByOperator',
  DriverAccepted = 'DriverAccepted',
  ArrivedToPickupPoint = 'ArrivedToPickupPoint',
  Started = 'Started',
  ArrivedToDestination = 'ArrivedToDestination',
  CanceledByDriver = 'CanceledByDriver',
  CanceledByRider = 'CanceledByRider',
  CanceledByOperator = 'CanceledByOperator',
  Paid = 'Paid',
  Reviewed = 'Reviewed',
  Expired = 'Expired',
  OtpVerified = 'OtpVerified',
  OtpFailed = 'OtpFailed',
}
