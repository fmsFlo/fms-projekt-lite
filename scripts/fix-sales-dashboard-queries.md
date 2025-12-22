# Fix Sales Dashboard SQL Queries

Die SQL-Queries müssen von snake_case auf PascalCase Spaltennamen angepasst werden:

## Spalten-Mapping:

### calendly_events:
- `start_time` → `"startTime"`
- `end_time` → `"endTime"`
- `user_id` → `"userId"`
- `host_name` → `"hostName"`
- `host_email` → `"hostEmail"`
- `invitee_name` → `"inviteeName"`
- `invitee_email` → `"inviteeEmail"`
- `event_type_name` → `"eventTypeName"`
- `lead_id` → `"leadId"`

### custom_activities:
- `user_id` → `"userId"`
- `user_email` → `"userEmail"`
- `user_name` → `"userName"`
- `lead_id` → `"leadId"`
- `lead_email` → `"leadEmail"`
- `lead_name` → `"leadName"`
- `activity_type` → `"activityType"`
- `date_created` → `"dateCreated"`
- `date_updated` → `"dateUpdated"`
- `calendly_event_id` → `"calendlyEventId"`
- `match_confidence` → `"matchConfidence"`
- `result_value` → `"resultValue"`

### users:
- `user_id` → `id` (User-Tabelle verwendet `id`)
- `close_user_id` → `close_user_id` (bleibt gleich, da es ein Custom-Feld ist)

## Dateien die angepasst werden müssen:
1. app/api/dashboard/calendly/stats/route.ts
2. app/api/dashboard/calendly/host-stats/route.ts
3. app/api/dashboard/custom-activities/advisor-completion/route.ts
4. app/api/dashboard/forecast-backcast/route.ts
5. app/api/dashboard/custom-activities/stats/route.ts

