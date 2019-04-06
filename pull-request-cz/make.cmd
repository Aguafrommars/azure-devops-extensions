CALL npm install
CALL terser scripts/context.js -o scripts/context.min.js -c -m
CALL terser scripts/main.js -o scripts/main.min.js -c -m
CALL replace-in-file scripts/context.js scripts/context.min.js contextForm.html
CALL replace-in-file scripts/main.js scripts/main.min.js main.html
tfx extension create --override "{\"version\": \"%SemVer%.%GitVersion_BuildMetaData%\"}" --output-path dist