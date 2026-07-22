confirmation  [boolean] [default: false]
  -v, --version         Show version number  [boolean]
🪵  Logs were written to "C:\Users\board\.wrangler\logs\wrangler-2026-07-22_15-54-55_495.log"
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76

board@Boardwalk MINGW64 ~/OneDrive/Documentos/GitHub/new-cloud (main)
$ wrangler r2 object put beltlinecloud/users/testUser/profile.jpg --file r2.txt --remote

 ⛅️ wrangler 4.98.0 (update available 4.113.0)
──────────────────────────────────────────────
Resource location: remote

Creating object "users/testUser/profile.jpg" in bucket "beltlinecloud".
Upload complete.

