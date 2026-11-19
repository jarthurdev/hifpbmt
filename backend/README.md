# Backend

## Setup

Configure `.env` using `.env.example`, then run:

From the project root, start PostgreSQL, initialize the database and run the API/frontend with one command:

```sh
npm start
```

The application is available at `http://localhost:3333`.

For manual setup, use:

```sh
cd backend
npm install
npx prisma db push
npm run db:seed:admin
npm run dev
```

Set a unique `JWT_SECRET` with at least 32 characters and replace the development
`ADMIN_PASSWORD` before exposing the API. The seed stores the administrator
password as a bcrypt hash.

For a clean local startup, use `npm run db:seed:admin` to create only the
administrator. `npm run db:seed` also attempts the source academic data import,
but currently stops on 78 uniqueness conflicts in the source schedule. Create
the course records in the admin UI and use the defined-schedule importer below
to load the attached source script without dropping the assigned hours.

## Authentication and CRUD

`POST /api/auth/login` accepts `{ "email": "...", "password": "..." }` and
returns a JWT. Send it as `Authorization: Bearer <token>` for every write.

`POST`, `PUT /:id`, and `DELETE /:id` are available for
`/api/courses`, `/api/class-groups`, `/api/subjects`, `/api/professors`,
`/api/rooms`, `/api/time-blocks`, and `/api/schedule-slots`.
Room and class-group collisions return `409 Conflict`; ordinary manual writes
also reject overlapping professor schedules. The defined-source importer can
explicitly preserve known professor overlaps and reports their count. Public
catalog and schedule reads remain available without authentication.

## Full schedule import

`POST /api/schedules/import` replaces the schedule slots for the specified
course and academic term in one transaction. Catalog records included in the
payload are upserted by ID; references not included must already exist.
Repeated room or class-group allocations in the same day/time block are
rejected before writes. Professor overlaps are rejected by default. An
explicit `allowProfessorConflicts: true` import preserves them and reports the
overlap count. Other import failures roll back the transaction.

```json
{
  "courseId": "course-id",
  "academicTerm": "2026.2",
  "classGroups": [
    {
      "id": "group-id",
      "courseId": "course-id",
      "name": "Turma 1",
      "semesterPeriod": "1",
      "shift": "matutino",
      "academicTerm": "2026.2"
    }
  ],
  "subjects": [],
  "professors": [],
  "rooms": [],
  "timeBlocks": [],
  "scheduleSlots": [
    {
      "dayOfWeek": 1,
      "classGroupId": "group-id",
      "subjectId": "subject-id",
      "professorId": "professor-id",
      "roomId": null,
      "timeBlockId": "time-block-id"
    }
  ]
}
```

The admin UI also accepts CSV with the header
`dayOfWeek,classGroupId,subjectId,professorId,roomId,timeBlockId`; select the
course and academic term in the form. Empty professor and room cells are
treated as `null`.

## Import the defined schedule script

The provided schedule source can be imported and normalized for the existing
six courses. From `backend/`, run a dry check first:

```sh
npm run db:import-defined-schedule -- "C:\Users\<user>\Downloads\gemini-code-1795105478817.js" --dry-run
npm run db:import-defined-schedule -- "C:\Users\<user>\Downloads\gemini-code-1795105478817.js"
```

The importer writes `prisma/data/defined-schedule-2026.2.json` and persists
catalogs and 2026.2 schedule slots. It does not create rooms because the source
does not specify any. Entries with several teachers separated by `/` are
assigned to the first listed teacher, as agreed. The database no longer applies
a unique professor/time constraint; the importer preserves and reports
overlapping professor assignments. Regular manual API writes still reject
overlapping professor schedules. After the normalized JSON exists, it can be
re-imported with:

```sh
npm run db:import-defined-schedule -- --normalized
```
