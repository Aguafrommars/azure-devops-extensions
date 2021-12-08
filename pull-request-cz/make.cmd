CALL npm install
CALL terser scripts/context.js -o scripts/context.min.js -c -m
CALL terser scripts/main.js -o scripts/main.min.js -c -m
CALL replace-in-file scripts/context.js scripts/context.min.js contextForm.html
CALL replace-in-file scripts/main.js scripts/main.min.js main.html
if "%APPVEYOR_REPO_BRANCH%" EQU "master" (
    tfx extension create --override "{""version"": ""%SemVer%.%GitVersion_BuildMetaData%"", ""name"": ""CommitiZen Pull Request (Preview)""}" --overrides-file ..\override.json --output-path dist
) else (
    tfx extension create --override "{""version"": ""%SemVer%.%GitVersion_BuildMetaData%""}" --output-path dist
)
