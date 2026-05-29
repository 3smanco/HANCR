// =============================================
// @hancr/sos — SOS / Safety system (shared)
// =============================================

export { SosModule } from './lib/sos.module';
export {
  SosService,
  SOS_INCIDENT_CHANNEL,
  type TriggerSosInput,
  type AddEmergencyContactInput,
} from './lib/sos.service';
