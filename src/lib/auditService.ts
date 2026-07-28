import { supabase } from './supabase';

export interface AuditLogRecord {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  expedient_id: string | null;
  employee_id: string | null;
  employee_name: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string;
  created_at: string;
}

export interface AuditLogInput {
  user: string;
  userRole: string;
  action: string;
  expedientId?: string;
  employeeId?: string;
  employeeName?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

const SESSION_IP_KEY = 'sam-simulated-ip';

function getSimulatedIp(): string {
  let ip = sessionStorage.getItem(SESSION_IP_KEY);
  if (!ip) {
    const octet = () => Math.floor(Math.random() * 224) + 10;
    ip = `10.${octet()}.${octet()}.${octet()}`;
    sessionStorage.setItem(SESSION_IP_KEY, ip);
  }
  return ip;
}

export async function writeAuditLog(input: AuditLogInput): Promise<AuditLogRecord | null> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_name: input.user,
        user_role: input.userRole,
        action: input.action,
        expedient_id: input.expedientId ?? null,
        employee_id: input.employeeId ?? null,
        employee_name: input.employeeName ?? null,
        field: input.field ?? null,
        old_value: input.oldValue ?? null,
        new_value: input.newValue ?? null,
        ip_address: getSimulatedIp(),
      })
      .select()
      .single();

    if (error) {
      console.error('[audit] insert failed:', error.message);
      return null;
    }
    return data as AuditLogRecord;
  } catch (err) {
    console.error('[audit] writeAuditLog error:', err);
    return null;
  }
}

export async function fetchAuditLogs(limit = 500): Promise<AuditLogRecord[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[audit] fetch failed:', error.message);
      return [];
    }
    return (data ?? []) as AuditLogRecord[];
  } catch (err) {
    console.error('[audit] fetchAuditLogs error:', err);
    return [];
  }
}
