---
name: External database
description: Distinguishes the external PostgreSQL database from Replit's managed database query surface.
---

This project uses an external PostgreSQL database, as stated by the user.

**Why:** A query against Replit's managed development database did not show the user's simulation records, so it must not be treated as evidence about the external database.

**How to apply:** Use the Drizzle schema and API validators as the intended data contract. Do not query or modify external records unless the user explicitly asks for that.
