# Security Specification & Test Payloads

## 1. Data Invariants
1. A transaction, invoice, contact, profile, or settings document must strictly belong to the authenticated user path (`/users/{userId}/...`).
2. An unauthenticated user cannot read, write, or list any documents.
3. A user cannot read or mutate data belonging to another user (`request.auth.uid != userId`).
4. Timestamps and required properties must be validated.
5. All IDs must adhere to standard alphanumeric identifier patterns (`^[a-zA-Z0-9_\\-]+$`).

## 2. The "Dirty Dozen" Malicious Payloads
1. **Malicious Payload 1 (Identity Theft in Transaction)**: Attempt to write a transaction into another user's path (`/users/userB/transactions/tx1`) while logged in as `userA`.
2. **Malicious Payload 2 (Unauthenticated Write)**: Attempt to create a transaction without signing in (`request.auth == null`).
3. **Malicious Payload 3 (Negative Price / Bypass Type)**: Sending `bayar: "one million"` (string instead of number) in a transaction.
4. **Malicious Payload 4 (Shadow Injection / Ghost Field)**: Attempting to inject `isAdmin: true` or `superUser: true` into a transaction document.
5. **Malicious Payload 5 (Junk ID Poisoning)**: Setting an excessively long document ID (>128 chars) containing special injection characters.
6. **Malicious Payload 6 (Unauthenticated List Query)**: Attempting to execute a collection group query on `transactions` without authentication.
7. **Malicious Payload 7 (Cross-User Read)**: `userA` attempting to `get()` an invoice belonging to `userB`.
8. **Malicious Payload 8 (Invalid Status)**: Setting `status: "Hacked"` in an invoice instead of `"Lunas"` or `"Belum"`.
9. **Malicious Payload 9 (Oversized Payload Exhaustion)**: Supplying a 2MB base64 string inside `catatan` in an invoice.
10. **Malicious Payload 10 (Immutability Violation)**: Updating a transaction and changing its `userId` to someone else.
11. **Malicious Payload 11 (Unverified Email Write)**: Attempting to write when `email_verified == false` (if email auth is enabled).
12. **Malicious Payload 12 (Direct Root Collection Injection)**: Attempting to write directly to `/transactions/tx1` instead of nested under a valid user path.
