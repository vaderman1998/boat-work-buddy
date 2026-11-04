# Project rules

- Keep created-date editing in the reusable JobCreatedDate control and save through useUpdateJob so live and demo jobs share the same behavior without bypassing demo isolation.
- Inventory stock changes from job parts and order receipt are transactional database triggers; history is append-only to preserve stock consistency across edits and cascading job deletion.
- Inventory queries and mutations share existing team authentication/RLS, with a separate in-memory demo store and scoped query cache to prevent demo writes reaching live stock.
- Reuse BarcodeScanner for inventory forms, lookup and job picking; decode locally and stop camera tracks on success or dismissal to protect privacy and battery life.